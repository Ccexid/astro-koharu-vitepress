# Bilibili API 边界

目前仅实现公开的追番列表 `GET /x/space/bangumi/follow/list`。`listBangumiFollows` 请求同源的 `/bili` 路径；Vite 开发代理默认指向 `https://api.bilibili.com`，也可用 `VITE_API_BILIBILI_URL` 覆盖。浏览器不保存 Cookie 或密钥。条目会规范化为 `BangumiItem`，字段形状参考 [astro-bangumi 的 api.ts](https://github.com/sf-yuzifu/astro-bangumi/blob/main/src/api.ts)，但类型只保留当前 Bilibili 数据源及本项目页面使用的内容。

```ts
import { listBangumiPage } from '@/services/bangumi'

const page = await listBangumiPage({ vmid: '19580033', category: 'all', followStatus: 2, page: 2 })
console.log(page.total, page.totalPages, page.list)
```

- `listBangumiFollows` 负责单次上游请求，参数 `page`、`pageSize` 映射为 Bilibili 的 `pn`、`ps`，默认 `page=1`、`pageSize=30`。页面通过 `listBangumiPage` 使用每页 10 条的分页；服务层按需读取对应的上游 30 条数据窗口，并在“全部分类”下合并番剧与影视的总数及结果区间。
- `followStatus` 保留上游数值：`1=想看`、`2=在看`、`3=看过`；`type` 为 `1=番剧`、`2=影视`。
- 返回 `BangumiResponse`，分页条目类型为 `BangumiItem`。`progress` 只从 Bilibili 的追番进度字段提取数字；最新上线分集单独放在 `latestEpisode`，不将“全24话”误当成用户已观看进度。未提供的评分、简介、统计等字段保持 `undefined`。上游额外字段不作假设，也不会透传到页面。
- HTTP 错误、上游非零 `code`、格式不符分别抛出 `BilibiliApiError`，其 `kind` 为 `http`、`api`、`invalid-response`；网络错误和主动取消仍由 `fetch` 原样抛出。
- Vite 代理会移除浏览器的 `Origin`，并设置 Bilibili 页面 `Referer` 和常规 `User-Agent`。Vite 代理仅用于开发；部署时需在托管层配置同源 `/bili` 反向代理，否则静态构建本身不会转发 API 请求。
- 测试见 `tests/bilibili.test.ts` 与 `tests/bangumi.test.ts`。
