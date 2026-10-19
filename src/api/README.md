# 双数据源追番 API 边界

## 配置

上游地址和路径默认值集中在 `src/config/api-defaults.ts`，前端请求配置集中在 `src/config/api.ts`。`.env` 中的 `VITE_API_BILIBILI_URL`、`VITE_API_UAPI_URL` 覆盖 Vite 开发代理；`VITE_API_BANGUMI_URL` 和两个超时变量覆盖前端运行时配置。`VITE_*` 值会写入前端构建，不要放密钥。浏览器仍请求同源 `/bili`、`/uapi` 路由；开发代理和生产 Worker/Nginx 的路由需要保持一致。

两个 provider adapter 共用 `http.ts` 中的 Axios 实例与 `request`、`get`、`post` 方法：统一处理 15 秒请求超时、外部 `AbortSignal`、HTTP 非成功状态及无效 JSON 响应。接口适配器继续负责 provider envelope 校验和领域字段映射。

页面顶部提供哔哩哔哩 / Bangumi.tv 标签，同时保留两套适配器。仅加载当前选中的来源；切换时销毁旧列表面板、取消列表和统计请求，重置筛选及追加位置，不混合条目 ID 或平台计数。两个来源共用海报瀑布流，每批 24 条，URL 始终为 `/bangumi`。

Bangumi.tv 读取 `VITE_BANGUMI_USER_ID`，请求 `https://api.bgm.tv/v0/users/:username/collections`，支持五类媒介和五类收藏状态。展示层统一 `1=想看/2=在看/3=看过/4=搁置/5=抛弃`，API 层将“在看/看过”映射为 Bangumi 的 `type=3/2`。条目保留个人评分优先、社区评分回退及 bgm.tv 链接。

参考 `sf-yuzifu/astro-bangumi` 的 `src/api.ts`（提交 `4b28c480edb0aa9201e27e6523753b5e0e0e9975`）重新实现公开追番读取；未引入其 Astro 运行时、文件系统或本地 JSON 合并代码。

哔哩哔哩账号读取 `VITE_API_BILIBILI_UID`，请求走 `/bili/x/space/bangumi/follow/list`，沿用用户配置的 Vite 代理。`type=1/2` 为番剧/影视，`follow_status=1/2/3` 为想看/在看/看过；此来源不显示不支持的书籍、游戏、搁置等选项。

界面每批追加 24 条，服务层映射上游 `ps=30` 的 `pn` 窗口；全部状态按在看、想看、看过依次拼接。分页参数只用于请求，页面始终保持 `/bangumi`。接口失败必须显示错误与重试，不能转成空收藏。

Vite 代理只在开发环境生效。Cloudflare Workers 生产转发已在 `cloudflare/worker.ts` 实现，`wrangler.jsonc` 将 `/bili/*`、`/uapi/*` 交给 Worker，其余页面由静态资源绑定处理。需同时部署 Worker 与 `dist`，详见 `docs/cloudflare-workers.md`。history fallback 不能代替 API 转发。番剧链接指向哔哩哔哩，不将“全24话”当成用户进度。

测试覆盖请求参数、公开响应规范化、评分回退、取消、失败恢复与批次追加。

## 一言

`saying.ts` 导出 `fetchSaying(signal?: AbortSignal): Promise<SayingResponse>`，返回 `{ text: string }`。请求地址为同源 `/uapi/api/v1/saying`，由 Vite 开发代理或 Cloudflare Worker 转发到 UAPI。

复用 Axios 请求层的 15 秒超时、取消、HTTP 和 JSON 错误处理，并校验 `text` 必须为非空字符串。随机内容禁用浏览器缓存，响应移除首尾空白；不在接口失败时静默替换为示例文本。

```ts
import { fetchSaying } from '@/api/saying'

const { text } = await fetchSaying()
```

首页标题由 `HomeSaying.vue` 调用该接口，每个字素间隔 80ms，完整显示后等待 8 秒再请求下一句，避免拆开 Emoji 组合字符。完整句子预留排版空间，读屏可读取全文；减少动态效果时直接显示整句。请求失败保留当前文字（首次失败使用原首页标题），8 秒后重试；离开首页销毁计时器并取消请求。

## 随机图片

`random-image.ts` 导出 `fetchRandomImage(query?, { signal?, timeoutMs? }?): Promise<Blob>`。它返回图片二进制，不能作为 JSON 或 `{ url: string }` 解析。浏览器通过项目自己的 `/uapi/api/v1/random/image` 调用 Worker；Worker 严格请求完整上游地址 `https://uapis.cn/api/v1/random/image`，不受前端 `VITE_API_UAPI_URL` 影响。

### 运行方式

1. 随机图片接口无需 `UAPI_KEY`，浏览器与 Worker 均不发送 Authorization。
2. 运行 `bun run cf:dev`，在 Wrangler 显示的本地地址调用接口。Worker 负责图片重定向转发；单独运行 `vite preview` 不提供这个转发入口。
3. 线上按已有流程部署 Worker 与前端，无需额外配置 Secret。

```ts
import { fetchRandomImage, RandomImageError } from '@/api/random-image'

const controller = new AbortController()
try {
  const blob = await fetchRandomImage(
    { category: 'acg', type: 'pc' },
    { signal: controller.signal, timeoutMs: 30_000 },
  )
  const imageUrl = URL.createObjectURL(blob)
  // 将 imageUrl 绑定到 <img :src="imageUrl">。
  // 替换图片或组件卸载时调用 URL.revokeObjectURL(imageUrl)，释放内存。
} catch (error) {
  if (error instanceof RandomImageError) {
    // error.status / error.code：HTTP 状态及上游错误码。
    // error.retryAfterMs：上游 Retry-After 建议等待时长（毫秒）。
    // error.requestId / error.details：诊断信息。
    console.error(error.message, error.code, error.retryAfterMs)
  } else if (error instanceof Error && error.name === 'AbortError') {
    // 用户取消请求。
  } else {
    throw error
  }
}
```

省略查询参数会请求全局随机图片。`category` 支持文档列出的 9 类；`type` 仅允许 `acg: pc/mb`、`bq: eciyuan/ikun/xiongmao/waiguoren/maomao`、`furry: z4k/szs8k/s4k/4k`。外部图床分类和 `anime` 禁止传 `type`。文档介绍中的 `acg&type=4k` 与参数表冲突，实现以参数表为准，不接受这个组合。

Worker 兼容直接图片与最多 5 次 HTTPS 302 等重定向，全程不发送密钥或访客凭据。上游 404 `NOT_FOUND`、500 `INTERNAL_SERVER_ERROR`、401/402/403、429 等错误保留 HTTP 状态和标准 `code/message/details`，同时保留 `Retry-After` 和 `X-Request-ID`。不自动重试随机图片请求，以免在限流期间继续调用；调用方可依据错误信息决定是否及何时重试。

Worker 自身校验、连接错误使用 `PROXY_*` 错误码；浏览器网络、超时、空内容及非图片响应使用 `CLIENT_*` 错误码。这些是本项目本地错误，不能视为 UAPI 官方错误码。

Hero 背景现已接入随机图片，默认使用 `category=acg&type=pc`。同一浏览器、同一站点 12 小时内复用一张图片，文章列表封面不受影响。图片保存在 Cache Storage，下一次允许请求的绝对时间保存在 localStorage；页面刷新、路由切换和多标签页共享此记录，支持 Web Locks 时串行检查并合并多标签页请求。页面保持打开时，到期自动更新；关闭时不在后台请求，下一次打开且过期后才获取。

失败同样进入 12 小时冷却，优先显示上次成功缓存的图片，否则回退原封面；上游 `Retry-After` 超过 12 小时则遵守更长等待时间。图片无法解码时回退原封面，不立即重复请求。浏览器禁止持久存储时仅能在当前会话内缓存，清除站点数据也会清除缓存与冷却记录。每个浏览器独立计时，这不是全站限额，不增加 Worker 存储。

使用 `bun run cf:dev` 或已部署 Worker 的站点即可。若此前被旧版本错误的密钥检查阻止并触发失败冷却，可在开发者工具中清除该站点的 `koharu-hero-image-next-request` localStorage 项及 `koharu-hero-image-v1` Cache Storage 后重试。图片不复制进项目素材目录，使用方仍需自行确认图片使用许可。
