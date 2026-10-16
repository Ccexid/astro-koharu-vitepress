# Koharu Vue 静态页面模板

本项目参考 [astro-koharu](https://github.com/cosZone/astro-koharu) 的公开博客界面和视觉风格，使用 **Vue 3 + Vite + TypeScript** 制作前端静态页面模板。当前阶段以本地模拟数据呈现页面，未来接入独立后端。目录名中的 `vitepress` 是历史名称，项目不使用 VitePress。

> 当前已实现站点外壳、首页、文章列表/详情、分类/标签、归档、友链、关于与追番。文章列表保留原有卡片风格和滚动追加；追番顶部可切换哔哩哔哩与 Bangumi.tv，均保留响应式瀑布流。首页动效补齐计划见 `plans/README.md`。

## 本地运行

需要 Bun 1.3.14。执行 `bun install` 后，可使用：

```sh
bun run dev
bun run typecheck
bun run test
bun run build
bun run build:report
bun run preview
bun run format
bun run format:check
```

开发服务器的实际地址以终端输出为准。当前首页在 `/`，示例文章在 `/posts/a-note-for-spring`；文章内容由 `src/services/posts.ts` 从本地模拟数据读取。`/bangumi` 顶部选择数据源：哔哩哔哩通过 `/bili` 代理并读取 `VITE_API_BILIBILI_UID`，Bangumi.tv 通过 `api.bgm.tv/v0` 并读取 `VITE_BANGUMI_USER_ID`。两个来源均每批追加 24 条，不增加分页 URL。

构建使用页面懒加载、Vue 依赖分包和 FA6 图标按批加载，并生成 manifest、许可证清单及 gzip/Brotli 资源。`build:report` 会重新构建并统计首页所需 JS（包含共享依赖）。预压缩资源需要托管服务器启用对应的内容协商才能生效；部署与缓存配置见 [构建优化说明](docs/build-optimization.md)。

Cloudflare Workers 已提供生产 API 转发入口 `cloudflare/worker.ts` 与 `wrangler.jsonc`。运行 `bun run cf:dev` 本地验证，`bun run cf:check` 只检查、不发布；配置与发布步骤见 [Cloudflare Workers 部署说明](docs/cloudflare-workers.md)。

## 目标与范围

- 参考上游的布局、色彩、排版、卡片、导航和交互，用 Vue 单文件组件重新实现，不直接搬运 Astro/React 组件。
- 覆盖桌面和移动端，支持明暗主题与常见页面状态。
- 页面通过数据读取接口获取本地模拟数据，为以后替换成 HTTP API 留出明确边界。
- 文章内容使用结构化模拟数据或 Vue 模板展示，**不以 Markdown/MDX 为内容源**。追番页同时保留 `src/api/bilibili.ts` 与 `src/api/bangumi.ts`，通过顶部标签选择数据来源。

当前不做 VitePress、Astro 构建、Markdown 解析、CMS/编辑器、后端、数据库、认证、评论服务、搜索服务、RSS、站点地图或文章预渲染。Vite 的普通客户端构建可以静态部署，但并不为每篇文章生成独立 HTML。未来若需服务端可读正文和 SEO，再单独选择预渲染或 SSR 方案。

## 页面清单

| 页面       | 建议路由                           | 初期展示内容                             |
| ---------- | ---------------------------------- | ---------------------------------------- |
| 首页       | `/`                                | 站点导航、视觉区域、文章列表与响应式布局 |
| 文章列表   | `/posts`                           | 摘要卡片及筛选与滚动追加演示             |
| 文章详情   | `/posts/:slug`                     | 标题、元信息、示例正文、目录与阅读布局   |
| 分类       | `/categories`、`/categories/:slug` | 分类入口及关联文章                       |
| 标签       | `/tags`、`/tags/:slug`             | 标签入口及关联文章                       |
| 归档       | `/archives`                        | 时间分组的文章列表                       |
| 追番记录   | `/bangumi`                         | 哔哩哔哩番剧/影视、追番状态与瀑布流追加  |
| 友链与关于 | `/friends`、`/about`               | 静态资料与链接                           |

搜索、系列、音乐、多语言和第三方评论暂列后续可选功能。具体外观与交互在实施前根据选定的上游版本及截图确定，不以“完整复刻”作为本阶段承诺。

## 技术约定

- Vue 3 SFC 使用 `<script setup lang="ts">`；Vite 负责开发和构建；使用 Vue Router 导航。
- Bun 作为包管理器与脚本运行器。初始化时核对本机 Bun 版本并设置 `packageManager`，只提交 `bun.lock`，避免混用其他锁文件。
- 用 TypeScript 描述文章、分类、标签、导航和加载状态。全局状态库只在实际存在共享状态时引入。
- 样式使用 CSS 变量管理主题令牌，组件和页面遵循一致的响应式断点。
- 上游代码许可及图片、字体等第三方素材授权须在复制前核查；本项目保留参考来源及所用资源的归属记录。仅作视觉参考时优先自行实现。

工程采用以下目录分层；未创建的目录在对应阶段加入：

```text
src/
  app/              # 入口、路由及全局配置
  assets/           # 有明确授权的图片和字体
  components/       # 站点布局与通用 UI
  pages/            # 路由页面
  data/             # 本地模拟数据
  services/         # 数据读取边界，后续改为 HTTP 实现
  types/            # 领域类型
  styles/           # 全局样式与主题变量
public/             # 不经打包处理的静态资源
tests/              # 组件和页面测试
```

页面只依赖 `services/` 的读取接口，不直接导入 `data/`。模拟数据应有稳定 ID、slug、时间及字段含义；列表加载、空数据、读取错误和文章不存在等状态都需要页面表现。追番读取由 `src/services/bangumi.ts` 包装，哔哩哔哩请求由 `src/api/bilibili.ts` 处理。开发使用用户配置的 `/bili` 代理，静态部署需要提供对应的同源转发。

## 实施顺序与验收

1. 初始化 Vue + Vite + TS、Bun、路由、类型检查、格式化与基础测试；保证开发与生产构建通过。
2. 选定上游参考版本，记录关键页面截图和可用素材；建立主题令牌、导航、站点外壳与移动布局。
3. 实现首页、文章列表和详情，接入模拟数据与加载、空、错误状态。
4. 实现分类、标签、归档、友链和关于页面；核对桌面与移动端交互。
5. 检查构建、类型、测试、深链接、资源授权和基本无障碍；记录未覆盖的上游能力与未来 API 对接点。

若使用 Vue Router history 模式，部署服务器必须将未知路径回退到 `index.html`，否则直接刷新 `/posts/:slug` 会得到 404。回退只能解决客户端路由，不会让文章生成独立 HTML。

当前阶段已通过类型检查、21 个测试和生产构建。追番顶部可切换两个来源，实测哔哩哔哩列表与 Bangumi.tv 用户 `ccexid` 的收藏均能读取，Bangumi 24→51 条追加无重复，URL 不变。首页动效计划见 `plans/README.md`。部署需要配置 history fallback、同源 `/bili` API 代理并确认 `api.bgm.tv` 可访问。

## 下一步

参考版本固定为 `.reference/v7.7.4`。本轮结构对齐与验证结果见 `docs/alignment-v7.7.4.md`；后续部署需验证 history fallback、Bangumi 网络可用性并替换演示作者资料。
