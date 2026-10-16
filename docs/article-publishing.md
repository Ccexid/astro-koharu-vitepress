# 从本地写作到 Git 自动部署

工作流：`/editor` 写作 → 导出 JSON → 本地发布命令导入并检查 → 提交、推送 Git → Cloudflare Workers Builds 构建部署。

本地保存继续使用 IndexedDB；下载 JSON 是备份，发布命令把文件纳入站点，线上更新则发生在 Cloudflare 部署成功之后。没有新增后端、文章写入 API 或 Markdown 解析。

## 首次准备

- 使用 Bun 1.3.14，运行 `bun install --frozen-lockfile`。
- 将此次发布脚本、测试和自动收录代码一起提交到仓库；Cloudflare 构建读取 Git 提交，不读取本机未提交的文件。
- 按下面的 Cloudflare 设置连接现有 Worker。账号侧连接完成前，推送 Git 不代表已经自动部署。

## 每次发布

1. 在 `/editor` 写完文章，填写标题、英文 slug、摘要、日期和分类，预览后导出 JSON。
2. 在仓库根目录运行（路径有空格时保留引号）：

   ```powershell
   bun run article:publish "C:\Users\admin\Downloads\my-article.json"
   ```

   命令自动导入到 `src/data/articles/article-<slug>.json`，运行文章相关测试、文章目录校验、全项目类型检查和生产构建。成功时输出实际文件名与预览路由；失败返回非零退出码。

3. 运行 `bun run preview`，检查对应 `/posts/<slug>` 页面，以及列表、分类、标签和归档。
4. 审查并提交命令输出的文件，然后推送已配置的生产分支。以下以 `master` 为例，实际文件名使用命令输出；不要把无关工作区修改一起提交：

   ```powershell
   git diff -- src/data/articles
   git status --short
   git add -- src/data/articles/article-my-article.json
   git diff --cached
   git commit -m "content: publish my article"
   git push origin master
   ```

   新文件在暂存前不会出现在 `git diff` 中，需打开 JSON 检查，暂存后再看 `git diff --cached`。脚本不自动提交、推送或执行线上部署。

5. 在 Cloudflare 的 Builds 中确认对应 commit 构建、部署均成功，再直接打开线上文章路由并刷新验收。已经打开的页面需要刷新后才会读取新构建中的文章。

## 新增、更新与冲突

- `id` 是文章的稳定身份。修改旧文章时从阅读页进入编辑，或导入原 JSON 后继续编辑，保留原 `id`。相同 ID 更新已有 JSON；首次修改内置示例文章时，新增一份相同 ID 的 JSON 覆盖示例。
- `slug` 是公开路径，必须为小写字母、数字和连字符，且全站唯一。相同 slug、不同 ID 会被拒绝，不会误当成更新。两个 JSON 使用相同 ID 也会被拒绝。
- 修改 slug 后仍更新原文件，文件名可以与新 slug 不同；旧 URL 不会自动重定向，发布后需检查已有链接。
- 必填：ID、标题、slug、摘要、有效的 `YYYY-MM-DD` 日期、有效的 `updatedAt` 更新时间、目录中存在且名称匹配的分类、正文。正文至少包含文字或图片。标题最多 160、ID 最多 160、slug 最多 120、摘要最多 500 字符。写作台导出时已包含更新时间。
- 标签允许为空；封面允许为空；图片仍使用现有安全 URL 规则，不提供上传。新增分类先修改 `src/data/categories.ts` 并一同提交，避免分类页遗漏文章。
- JSON 使用 `contentVersion: 1`，最大 2 MB（UTF-8）。正文复用编辑器导入的节点、层级、地址和大小校验；不完整草稿仍可备份，但不能发布。文件仅收录 `src/data/articles/` 当前层的小写 `.json` 普通文件，子目录不收录。
- `src/data/posts.ts` 通过 Vite glob 自动收录，无需逐篇导入。JSON 与内置示例合并后，所有页面继续经 `services/posts.ts` 读取。`demo-posts.ts` 保留示例数据。

## 检查失败与恢复

导入先在内存中验证候选目录，再原子写入单个文件。检查失败时：新文件删除；更新文件恢复导入前的原始内容和格式。源导出文件不变。若检查期间该文件被其他工具修改，脚本保留外部修改并提示手动检查。检查失败后不要部署旧的 `dist/`，修复后重新构建。

同时只能运行一个发布命令，通过 `src/data/articles/.article-publish.lock` 防止命令互相覆盖。若进程被强制终止，可能留下锁；确认没有发布进程后删除该锁，再检查 JSON 文件。锁和临时文件已加入 Git 忽略列表。已有损坏或重复的 JSON 会阻止发布，需先修复目录。

可独立执行：

```sh
bun run article:check
bun run test:articles
bun run article:verify
bun run test
bun run cf:check
```

`article:check` 校验真实目录；`test:articles` 验证文章、草稿、发布事务和目录读取；`article:verify` 运行文章测试与完整生产构建。`build` 自身也包含文章校验，因此直接手动加入错误 JSON 也会阻止部署构建。`cf:check` 使用现有 `dist` 做 Worker dry-run，不发布。

文章服务的固定样例测试使用隔离的示例数据，避免正常新增或更新文章导致固定分类数量断言失败；`article-catalog.test.ts` 单独读取真实 JSON，比较 CLI 与 Vite 收录结果，并验证文章详情、列表、分类、标签和归档读取。

## Cloudflare Workers Builds 一次性连接

当前仓库：`Ccexid/astro-koharu-vitepress`，当前工作分支：`master`，现有 Worker：`wispy-sunset-016f`。使用现有 Worker 的 Git 连接，不新建另一个静态站点。

1. 登录 Cloudflare，打开 **Workers & Pages → wispy-sunset-016f → Settings → Builds**，选择连接 Git 仓库。若控制台文案调整，找到该 Worker 的 Git repository / Builds 设置。
2. 授权 Cloudflare GitHub 应用访问此仓库，选择 `Ccexid/astro-koharu-vitepress`。授权在 GitHub 与 Cloudflare 控制台完成，不把令牌写入仓库或客户端代码。
3. 配置：

   | 设置                                     | 值                                           |
   | ---------------------------------------- | -------------------------------------------- |
   | 生产分支 / Git branch                    | `master`（若改用其他分支，推送命令也需一致） |
   | 根目录                                   | 仓库根目录 `/`                               |
   | Build command                            | `bun run cf:build`                           |
   | Deploy command                           | `bunx wrangler deploy --keep-vars`           |
   | Build variable `BUN_VERSION`             | `1.3.14`                                     |
   | Build variable `SKIP_DEPENDENCY_INSTALL` | `true`                                       |

   `cf:build` 使用 `bun install --frozen-lockfile` 安装精确锁定的依赖，再运行 `article:verify`。跳过平台自动安装以避免先执行不同的安装流程。Bun 版本与 `packageManager` 保持一致。这里不使用 `cf:deploy` 作为 Deploy command，避免重复构建。

4. 暂时关闭非生产分支 / Preview builds，防止开发分支发布到同一个生产 Worker。以后需要预览时再独立配置资源与预览命令。
5. 按现有 `.env.example` 在构建环境填入需要的公开 `VITE_*` 配置；这些值会进入客户端构建，不能放密钥。Worker 名称、静态目录 `dist` 和 SPA fallback 使用已有 `wrangler.jsonc`，保留现有 `/bili`、`/uapi` 转发。
6. 保存连接并查看首次构建；以后推送生产分支自动触发构建。构建失败会停止部署，成功后在部署记录核对 commit 与时间，直接刷新文章深层路由，检查正文和主要导航。

官方参考：[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)、[Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Build image 与版本变量](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)。配置说明按 2026-10-16 核对。Cloudflare 的仓库授权、分支选择、构建变量与第一次线上验收仍需在账号侧完成。

## 验收记录（2026-10-16）

- 本机 Bun 1.3.14；`bun run cf:build` 通过，包含 frozen-lockfile 安装、72 项文章相关测试、真实目录校验、全项目类型检查和生产构建。`bun run cf:check` 的 Worker dry-run 通过。
- 使用写作台相同的 `exportArticleFile` 生成临时 JSON，实际执行 `article:publish` 新增文章；再次以相同 ID 修改标题、正文和 slug，确认更新同一文件。浏览器在本地 Worker 直接打开、刷新文章路径，验证新增正文、目录、新 slug 正文与旧 slug 不存在状态。
- 本地 Worker 直接请求文章、列表、分类、标签、归档和编辑页路径，均返回 200 HTML 应用入口；真实目录服务测试验证 JSON 文章进入详情、列表、分类、标签和归档。这不替代线上部署后的 fallback 与缓存验收。
- 覆盖不完整草稿、非法正文/地址/日期、大小上限、重复 ID/slug、未知分类、同 ID 更新、Windows 文件名大小写冲突、检查失败回滚、保留外部修改和并发锁。关闭 Vitest 的文件模块缓存，避免新增/移除 JSON 后复用旧 glob 结果。
- 本轮改动文件格式检查与 Git 空白检查通过。全量测试最终为 166 项中 162 项通过、4 项现有失败：`tests/saying.test.ts` 的两项地址断言，以及 `tests/cloudflare-worker.test.ts` 的两项上游地址断言。生产发布门槛明确使用文章测试与完整构建，没有声称全量测试通过；未改写这些 API 或断言。
- 临时站点文章与测试服务已清理，`src/data/articles/` 仅保留 `.gitkeep`；验证导出样本保留在被忽略的 `.reference/publication-validation/2026-10-16/`。原有示例数据只迁移到 `demo-posts.ts`，逐字比较确认内容完整保留。没有新增依赖或站点素材。

Wrangler 与可用浏览器当前均未登录；按用户选择，本轮完成本地功能与连接步骤，不执行账号关联或线上发布。Git 连接完成并推送这些代码后，仍需在 Cloudflare 记录首次构建的 commit 和部署结果。
