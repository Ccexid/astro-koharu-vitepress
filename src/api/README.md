# Bangumi API 边界

追番页面读取 Bangumi.tv v0 的公开用户收藏，不需要访问令牌。请求由 src/api/bangumi.ts 统一封装，服务层负责媒介/状态筛选、批次读取、取消和错误转换。

当前默认用户为 cosine，可通过 VITE_BANGUMI_USER_ID 覆盖。页面每批读取 24 条并滚动追加，不使用分页 URL。部署环境若限制跨域，需要为 https://api.bgm.tv 配置同源反向代理。

测试覆盖请求参数、公开响应规范化、评分回退、取消、失败恢复与批次追加。
