# 构建优化与部署

## 构建方式

```sh
bun run build
bun run build:report
bun run preview
```

`build` 先运行类型检查，再使用 Vite 8/Rolldown 构建到 `dist/`。`build:report` 还会输出 `dist/.vite/build-report.json`。只统计已有产物时可运行 `bun scripts/build-report.ts`。

## 已实施的优化

- 页面通过 Vue Router 动态导入；设置面板首次打开时加载，关闭后保留组件以完成退出动画。
- Vue、Vue Router、Pinia 使用独立的 `vue-vendor` chunk，便于页面更新时复用缓存。图标库不合并进这个首屏依赖包。
- Lucide、Meteor 继续按需加载。Font Awesome 6 的免费 Solid、Regular、Brands 使用构建时生成的完整名称目录；浏览或搜索时，仅渲染的图标会请求对应数据批次。每批最多 64 个图标、约 48KiB 定义数据，批次内的请求共享 Promise；别名去重，所有 2060 个图标/样式保留。
- 生成 `.vite/manifest.json`、`THIRD_PARTY_LICENSES.md` 和 `FONT_AWESOME_LICENSE.txt`，随部署产物一起保留。FA6 数据来自已安装的官方包，构建过程不请求外部接口。
- 超过 1KiB 的 JS、CSS、JSON、SVG、TTF 等资源生成更小的 `.gz` 和 `.br` 文件。使用 Node 内置 zlib，无额外压缩插件依赖，原始资源保留。
- 开发依赖扫描限定为 `index.html`，提前预构建 Font Awesome 核心和 Vue 适配器；`.reference/` 继续排除在文件监听之外。

## 2026-10-16 本机构建对比

大小使用十进制 kB；JS 为压缩前体积，不含 HTTP 请求头。首页统计包含入口、首页页面和它们的静态共享依赖，未计入后续点击加载的页面、设置或图标库。

| 项目                |     优化前 |                                          优化后 |
| ------------------- | ---------: | ----------------------------------------------: |
| 首页所需 JS         |  212.20 kB |                       169.63 kB（减少约 20.1%） |
| FA6 Solid 单次整包  |  939.41 kB |          按批加载，所有 FA6 批次最大约 49.39 kB |
| FA6 Brands 单次整包 |  518.93 kB |                                        按批加载 |
| 最大 JS chunk       |  939.41 kB |                 474.52 kB（可选 Lucide 图标库） |
| 既有 TTF 字体       | 6168.77 kB | 原文件保留；gzip 3614.13 kB / Brotli 3129.01 kB |

TTF 字体仍是最大的单个资源。本轮未改变字体、字符覆盖或排版。表中的字体压缩大小只有在服务器使用 gzip/Brotli 内容协商后才影响传输量；Vite preview 验证页面和分包，不自动配置生产服务器的预压缩支持。

本地验证：类型检查、44 项测试、格式检查、生产构建及构建报告均通过，构建无超大 chunk 警告。128 个预压缩文件已解压并逐一核对原始字节；manifest 的静态与动态依赖均存在。生产预览检查了首页、文章列表/详情、分类索引/详情、标签索引/详情、归档、友链、关于、追番和 404；图标三套样式、搜索、侧栏显示及刷新恢复正常。这些检查不替代部署服务器的缓存、内容协商、API 转发与深链接配置验证。

## 静态部署要求

对带哈希的 `/assets/` 文件使用长期缓存，对 `index.html` 使用重新验证。升级时先上传新资源再切换 HTML，并按需要保留旧哈希资源，避免仍打开旧页面的用户请求不到动态 chunk。

Nginx 示例（站点根目录需改为实际 `dist` 部署路径）：

```nginx
server {
    listen 80;
    server_name example.com;
    root /srv/koharu/dist;

    # 需要 Nginx 已安装 http_gzip_static 模块。
    gzip_static on;
    gzip_vary on;
    # 安装 Brotli 模块后可启用：brotli_static on;

    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

压缩响应应使用原始文件的 Content-Type，并返回匹配的 `Content-Encoding: gzip` 或 `br` 和 `Vary: Accept-Encoding`。CDN/其他静态托管可能自行压缩资源，应按平台能力配置；仅上传 `.gz`/`.br` 文件不能证明客户端正在使用压缩版本。

上述示例只包含静态资源和 history fallback。追番需要的生产同源 API 转发仍需另行配置；开发服务器的代理不会打包进 `dist`。部署后需实测文章、分类和标签详情的深层链接刷新。
