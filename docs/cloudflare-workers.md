# Cloudflare Workers 静态站与 API 转发

当前站点 `wispy-sunset-016f.andybabybeibi.workers.dev` 属于 Workers。部署使用项目根目录 `wrangler.jsonc`，入口为 `cloudflare/worker.ts`，静态资源为 `dist/`；不使用 Pages Functions 的 `functions/` 目录。

## 请求路径

| 浏览器同源请求                          | Worker 转发地址                                                  |
| --------------------------------------- | ---------------------------------------------------------------- |
| `/bili/x/space/bangumi/follow/list?...` | `http://8.148.179.96:5173/bili/x/space/bangumi/follow/list?...`  |
| `/uapi/api/v1/...?...`（随机图片除外）  | `http://8.148.179.96:5173/uapi/api/v1/...?...`                   |
| `/uapi/api/v1/random/image?...`         | `https://uapis.cn/api/v1/random/image?...`，由独立图片处理器转发 |
| `/`、文章路由、`/assets/*` 等           | 静态资源；页面深链接使用 SPA fallback                            |

普通 API 经过服务器上的 Nginx 中转，再由 Nginx 去掉 `/bili/` 或 `/uapi/` 前缀并请求第三方。Worker 拼接路径时必须保留中转地址自身的前缀；直接用 `/api/v1/saying` 覆盖 pathname 会请求到服务器的前端路由，返回 HTML 页面。

`assets.run_worker_first` 只匹配 `/bili` 和 `/uapi` 路由。这些请求必须先运行 Worker，否则静态站的 SPA fallback 可能把 API 地址返回成 `index.html`。

前端现有 `fetchJson('/bili/x/space/bangumi/follow/list?' + params)` 无需更改。请求经过自己的 Worker 域名，浏览器不会跨域请求哔哩哔哩；上游请求在 Worker 内发送。

## 本地验证

```sh
bun install
bun run cf:dev
```

该命令先生成 `dist`，再运行 Wrangler 本地环境。打开终端显示的本地地址（通常为端口 8787）；这样测试的是 Worker 与静态资源，而不只是 Vite 的开发代理。

请求 `http://127.0.0.1:8787/uapi/api/v1/saying`，应返回 `Content-Type: application/json` 和可解析的 JSON。若返回 HTML，检查 Worker 中转目标是否保留 `/uapi`；该路径应先转发到 `http://8.148.179.96:5173/uapi/api/v1/saying`。

仅检查 Worker 打包及静态资源绑定、不发布：

```sh
bun run build
bun run cf:check
```

## 部署到现有 Worker

在 Cloudflare 控制台打开 **Workers & Pages → wispy-sunset-016f → Settings → Builds**。如果关联了 Git，设置项目根目录为本仓库目录，并使用：

- 生产分支：`master`（或明确选择的生产分支，与推送目标保持一致）。
- 构建命令：`bun run cf:build`
- 部署命令：`bunx wrangler deploy --keep-vars`
- 构建变量：`BUN_VERSION=1.3.14`、`SKIP_DEPENDENCY_INSTALL=true`。

`cf:build` 用 `bun install --frozen-lockfile` 安装依赖，再运行文章相关测试、文章目录校验、类型检查和生产构建。关闭非生产分支自动部署 / Preview builds，待单独配置预览资源后再启用。仓库连接、权限授权与首次构建验收步骤见 [文章发布说明](article-publishing.md)。这里只提供配置与脚本，不表示当前 Worker 已完成 Git 连接。

让 Wrangler 读取仓库的 `wrangler.jsonc`，同时上传 Worker 代码和 `dist`。只上传 `dist` 或只设置静态资源目录，不会部署这里的转发入口。`--keep-vars` 用于保留控制台已有的普通环境变量。

如果通过本地终端发布，在用户自己的终端登录后执行：

```sh
bunx wrangler login
bun run cf:deploy
```

`wrangler.jsonc` 的 Worker 名称已对应现有站点。发布前确认登录的是该 Worker 所在账户。以上部署命令会更新线上站点；本次代码实现只做本地检查，不自动发布。

不要把代理入口直接写进 `dist/_worker.js`：`dist` 是每次构建重新生成的产物，且 `_worker.js` 是 Pages 的约定。当前部署使用 `cloudflare/worker.ts`，由 Wrangler 读取 `main` 后单独打包。此前本地遗留的 `dist/_worker.js` 已备份到被 Git 忽略的 `.wrangler/legacy-pages-worker.js`，重新构建不再包含这个静态文件。

## 部署后验收

1. 直接刷新 `/posts/a-note-for-spring`，应显示文章页面。
2. 请求 `/bili/x/space/bangumi/follow/list?vmid=19580033&type=1&follow_status=2&pn=1&ps=30`，应返回上游 API 响应，而不是 HTML 首页。
3. 打开 `/bangumi`，检查列表、状态计数与滚动追加。
4. 在 Worker 日志中检查请求失败时的状态；上游若返回 403/412 等状态，转发会保留该状态。

## 边界

- 这是 Cloudflare 运行时能力，不依赖 `vite.config.ts` 的 `server.proxy`。原有 Vite proxy 仍只供 `bun run dev` 使用；要验证生产路径使用 `cf:dev`。
- 仅允许 GET/HEAD。Bilibili 仅开放当前项目使用的追番列表接口，UAPI 仅开放 `/api/` 路径。目标主机固定，不接受 `?url=任意地址` 的通用代理请求。
- Worker 使用新建请求头，不透传浏览器的 Cookie、Origin、Authorization。服务端设置 Referer 与 User-Agent；仅返回上游响应体和必要 Content-Type，不透传 Set-Cookie，不缓存接口响应。
- 代理解决浏览器跨域和开发配置失效，不保证第三方放行 Cloudflare 出口 IP。上游限流、风控、账号权限与 UAPI 的鉴权要求仍然适用。
- 随机图片 `/uapi/api/v1/random/image` 无需密钥，已单独实现图片重定向转发，全程不发送 Authorization。随机图片的 Blob 调用、错误处理与 Hero 的 12 小时浏览器缓存见 `src/api/README.md`。

## 本地验收（2026-10-16）

- 类型检查、49 项测试、格式检查、生产构建和 `wrangler deploy --dry-run` 通过。
- Wrangler 本地运行时实测：首页与文章深层路径返回 HTML；未开放的 API 返回 JSON 404。
- 本地 Worker 的哔哩哔哩追番请求返回 HTTP 200、`code: 0`；UAPI 用户查询返回 HTTP 200 JSON。该结果验证本地转发链路，不能证明 Cloudflare 生产出口一定被上游放行。
- 未执行线上发布，线上环境待用户部署后验收。
