# 双数据源追番 API 边界

页面顶部提供哔哩哔哩 / Bangumi.tv 标签，同时保留两套适配器。仅加载当前选中的来源；切换时销毁旧列表面板、取消列表和统计请求，重置筛选及追加位置，不混合条目 ID 或平台计数。两个来源共用海报瀑布流，每批 24 条，URL 始终为 `/bangumi`。

Bangumi.tv 读取 `VITE_BANGUMI_USER_ID`，请求 `https://api.bgm.tv/v0/users/:username/collections`，支持五类媒介和五类收藏状态。展示层统一 `1=想看/2=在看/3=看过/4=搁置/5=抛弃`，API 层将“在看/看过”映射为 Bangumi 的 `type=3/2`。条目保留个人评分优先、社区评分回退及 bgm.tv 链接。

参考 `sf-yuzifu/astro-bangumi` 的 `src/api.ts`（提交 `4b28c480edb0aa9201e27e6523753b5e0e0e9975`）重新实现公开追番读取；未引入其 Astro 运行时、文件系统或本地 JSON 合并代码。

哔哩哔哩账号读取 `VITE_API_BILIBILI_UID`，请求走 `/bili/x/space/bangumi/follow/list`，沿用用户配置的 Vite 代理。`type=1/2` 为番剧/影视，`follow_status=1/2/3` 为想看/在看/看过；此来源不显示不支持的书籍、游戏、搁置等选项。

界面每批追加 24 条，服务层映射上游 `ps=30` 的 `pn` 窗口；全部状态按在看、想看、看过依次拼接。分页参数只用于请求，页面始终保持 `/bangumi`。接口失败必须显示错误与重试，不能转成空收藏。

Vite 代理只在开发环境生效。静态部署需提供同源 `/bili` 转发；history fallback 不能代替 API 代理。番剧链接指向哔哩哔哩，不将“全24话”当成用户进度。

测试覆盖请求参数、公开响应规范化、评分回退、取消、失败恢复与批次追加。
