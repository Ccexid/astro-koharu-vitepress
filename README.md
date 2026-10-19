# Koharu

Vue 3、Vite 和 TypeScript 构建的静态博客前端，参考 [astro-koharu](https://github.com/cosZone/astro-koharu) 的视觉与交互。目录名中的 `vitepress` 是历史名称；项目不使用 VitePress。

当前文章、分类、标签和友链由本地数据提供；追番与一言使用公开 API。Cloudflare Worker 提供静态资源和 API 转发。**D1 数据库、用户登录和在线写入尚未实现。**

## 功能

- 首页、文章列表与详情、分类、标签、归档、友链、关于及追番页面，适配桌面和移动端。
- 明暗主题、文章目录、阅读进度、推荐文章和加载/错误/空状态。
- 本地文章编辑器：Tiptap 富文本编辑、IndexedDB 草稿保存、预览以及 JSON 导入/导出。草稿保存在当前浏览器，不会直接发布到线上。
- 本地发布流程：将编辑器导出的 JSON 校验后写入 `src/data/articles/`，随 Git 提交和站点构建发布。
- 追番支持哔哩哔哩和 Bangumi.tv；API 请求通过 Axios 通用客户端处理。

## 页面路由

| 路由                               | 页面           |
| ---------------------------------- | -------------- |
| `/`                                | 首页           |
| `/posts`                           | 文章列表       |
| `/posts/:slug`                     | 文章详情       |
| `/categories`、`/categories/:slug` | 分类列表与详情 |
| `/tags`、`/tags/:slug`             | 标签列表与详情 |
| `/archives`                        | 归档           |
| `/friends`                         | 友链           |
| `/about`                           | 关于           |
| `/bangumi`                         | 追番记录       |
| `/editor`、`/editor?post=:slug`    | 本地文章编辑   |

## 快速开始

需要 Bun `1.3.14`。

```sh
bun install
bun run dev
```

开发服务器地址以终端输出为准。示例路由：`/`、`/posts/a-note-for-spring`、`/bangumi` 和 `/editor`。如需修改公开 API 参数，可复制 `.env.example` 为 `.env` 并调整相应值。

## 环境变量

| 变量                               | 用途                            |
| ---------------------------------- | ------------------------------- |
| `VITE_API_BILIBILI_UID`            | 默认哔哩哔哩用户 UID            |
| `VITE_BANGUMI_USER_ID`             | 默认 Bangumi 用户名             |
| `VITE_API_BILIBILI_URL`            | Vite 开发代理的哔哩哔哩上游地址 |
| `VITE_API_UAPI_URL`                | Vite 开发代理的 UAPI 上游地址   |
| `VITE_API_BANGUMI_URL`             | 前端构建使用的 Bangumi API 地址 |
| `VITE_API_TIMEOUT_MS`              | JSON API 超时，毫秒             |
| `VITE_API_RANDOM_IMAGE_TIMEOUT_MS` | 随机图片 API 超时，毫秒         |

API 默认值见 [`src/config/api-defaults.ts`](src/config/api-defaults.ts)，运行时配置见 [`src/config/api.ts`](src/config/api.ts)。`VITE_API_BILIBILI_URL` 和 `VITE_API_UAPI_URL` 配置 Vite 开发代理；其他 `VITE_*` 配置会进入浏览器构建，不能放密钥。生产 Worker 使用共享默认上游配置。

## 数据与发布

页面通过 `src/services/` 读取数据，不直接导入 `src/data/`。`src/data/posts.ts` 将示例文章与 `src/data/articles/*.json` 合并；正文使用结构化 JSON，不使用 Markdown/MDX。

文章发布步骤：在 `/editor` 编辑并导出 JSON，然后运行：

```sh
bun run article:publish "path/to/article.json"
```

命令校验文章并更新本地 JSON 文件。检查通过后提交并推送 Git；若 Cloudflare Workers Builds 已连接仓库，构建成功后会部署更新。完整流程见[文章发布说明](docs/article-publishing.md)和[编辑器说明](docs/article-editor.md)。

## 部署

Cloudflare Worker 同时托管 `dist/` 并转发 `/bili`、`/uapi` 请求。开发与发布相关命令：

```sh
bun run cf:dev       # 构建后启动 Wrangler 本地 Worker
bun run cf:check     # Worker dry-run，不发布
bun run cf:deploy    # 构建并部署到已登录的 Cloudflare 账户
```

配置和验收步骤见 [Cloudflare Worker 部署说明](docs/cloudflare-workers.md)。使用 1Panel 静态托管时，将 `bun run build` 生成的 `dist/` 上传到站点目录，并按 [`deploy/nginx/astro-koharu-1panel.conf`](deploy/nginx/astro-koharu-1panel.conf) 配置同源 API 代理和 history 路由回退。

Vue Router 使用 history 模式，托管环境需将未匹配的页面路由回退至 `index.html`。这只保证客户端路由可刷新，不会生成独立的文章 HTML。

## 常用命令

| 命令                    | 说明                             |
| ----------------------- | -------------------------------- |
| `bun run dev`           | 启动 Vite 开发服务器             |
| `bun run typecheck`     | TypeScript / Vue 类型检查        |
| `bun run test`          | 运行全部测试                     |
| `bun run test:articles` | 运行文章相关测试                 |
| `bun run build`         | 校验文章、类型检查并构建生产文件 |
| `bun run preview`       | 本地预览 `dist/`                 |
| `bun run format:check`  | 检查 Prettier 格式               |
| `bun run article:check` | 校验文章 JSON 目录               |

## 项目结构

```text
src/
  api/          Axios 客户端与第三方 API 适配器
  app/          路由、站点封面与应用级逻辑
  components/   布局和可复用 UI
  config/       API 与站点配置
  data/         本地模拟数据和文章 JSON
  pages/        路由页面
  services/     页面使用的类型化数据接口
  types/        内容与 API 类型
cloudflare/     Worker 入口和 API 转发
deploy/nginx/   1Panel 静态网站 Nginx 示例
tests/          单元与集成测试
```
