# v7.7.4 与当前项目重新对比 · 2026-10-15

> 后续实施：用户已指定先对齐首页标题。首页三层文字的字号、字距、行高、间距、阴影、垂直位置及模糊入场已按参考更新，详见文末记录。下表保留 `5cae794` 的原始对比基准。

## 对比基准与方法

- 当前代码：`5cae7943f1bceb4803e5c85c178d3be1ebeb8d1d`，开始对比时工作区干净。
- 参考代码：当前目录 `.reference/v7.7.4`，HEAD 为 `edc0cd6466dfa3c7dd1d0052302e0e4565818b28`。
- 实际页面：参考 `http://localhost:4321/`，当前 `http://localhost:5173/`。
- 参考目录存在既有的 `package.json`、`.cache/og-data.json` 修改及未跟踪 `bun.lock`；本次按目录现状与正在运行的页面观察，未修改该目录。
- 对照了首页、文章列表、文章详情、分类索引、父分类详情、子分类详情、标签索引、标签详情、归档、友链、关于、追番及 404，共 13 类页面。
- 桌面使用 1280×800；手机使用同一个浏览器标签页轮流访问两个站点，统一为 390×844；另在 820、650px 检查了精选分类、友链、追番的布局断点。滚动条占用宽度不同，因此内容视口有 8–10px 的正常差别。
- 截图和 DOM 测量记录位于 `.reference/comparison-2026-10-15/`。截图包含部分首屏入场帧，不能据此把暂时透明的标题认定为缺失；标题存在性、字号与几何数值均另以 DOM 和源码核实。
- 动态内容另等待加载后观察：参考 Bangumi 已显示收藏与页码；当前哔哩哔哩及 Bangumi.tv 均能加载。数量和账号不同属于数据差异。

“待对齐”指现有页面还未达到参考表现；“部分对齐”表示结构/基础交互已有；“保留”表示用户明确要求的差异；“范围外”表示当前项目约定不实现或需要另作决定。

## 页面差异表

| 页面 / 区域            | 参考 v7.7.4 源码与运行表现                                                        | 当前代码与运行表现                                                                   | 判断                                           |
| ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 首页主体               | 置顶、普通文章、精选分类                                                          | 三个区域均有；文章内容和数量为本地演示数据                                           | 主体已对齐，数据差异                           |
| 首页精选分类正面       | 配置驱动，可选根/子分类，有父分类徽标；固定 `h-56`，约 224px                      | 自动取前四个根分类；无父级徽标，最小 240px，增加篇数和展开按钮                       | 部分对齐；按钮是访问性增强                     |
| 首页精选分类背面       | 飘带分类标题、子分类入口、父级入口、最多 `6−子分类数` 篇文章、底部 more 按钮      | 普通纵向标题和最多三篇文章，仅“全部文章”；没有子分类、父级入口和飘带                 | 待对齐                                         |
| 精选分类响应式         | ≤768px 改单列；650px 实测一列                                                     | ≤600px 才单列；650px 实测仍两列                                                      | 待对齐                                         |
| 文章列表 `/posts`      | 使用首页式完整站点封面，普通文章列表和页码                                        | “所有文章”紧凑封面、页内筛选、交替斜切卡片、滚动追加                                 | 卡片、筛选、无分页按要求保留；封面策略另有差异 |
| 文章详情封面           | 桌面标题 40px，手机 24px；发布日期可带时间、更新日期、字数、阅读时长及执笔标识等  | 桌面 48px，手机 32px；只有发布日期、字数、分钟                                       | 排版待对齐；额外元信息依赖内容字段/配置        |
| 文章详情正文           | 摘要面板、复制 Markdown、丰富内容组件；可配置执笔说明、系列与评论                 | 摘要折叠、段落/引用/列表、锚点、标签和落款；没有对应复杂内容与附加面板               | 基础阅读已对齐；Markdown、评论等按范围另定     |
| 文章上下篇             | 在同一末级分类/系列中选择；上一篇是更新文章，下一篇是更旧文章                     | 从全站日期列表选择，会跨分类；上一篇取更旧文章，下一篇取更新文章                     | 语义待对齐；卡片基础外观已接近                 |
| 文章详情侧栏           | 站点、目录、系列三栏；多级目录、目录滑动指示，系列列表和篇次进度                  | 站点、目录两栏；基于 `sections` 的平面目录，无系列栏和篇次进度                       | 部分对齐；系列属可选能力                       |
| 手机文章顶栏           | 圆形阅读进度、章节标题切换和目录浮层                                              | 文本百分比、章节标题、原生 details 目录                                              | 功能基础已具备，外观与动效待对齐               |
| 分类索引 `/categories` | 分类点线目录，根级花瓣标记，子/孙分类分层规则；根项参与滚动浮现                   | 递归目录、Flower2 线框标记；缩进、计数字号和嵌套排列不同，未接入分类项浮现           | 部分对齐                                       |
| 父分类详情             | 面包屑、文章计数、子分类筛选、按年紧凑文章行                                      | 这些结构和交互均有                                                                   | 基本对齐，剩余字号、行距、装饰差异             |
| 子分类 / 叶分类详情    | 没有子分类时隐藏文章行末分类名，避免重复                                          | `PostYears` 默认始终显示分类名；没有按叶节点传 `showCategory=false`                  | 待对齐                                         |
| 标签索引 `/tags`       | 按频次排序、过滤、单次标签折叠；相对最大频次的对数分级，tier 0–4 不同字重/字号    | 排序、过滤和折叠均有；只有 `count >= 3` 的普通/突出两档                              | 基础交互已对齐，字体层级待对齐                 |
| 标签详情               | 面包屑、计数、按年文章行                                                          | 同样结构；文章行标题约 14.08px，参考约 15px，年份/装饰间距不同                       | 基本对齐，排版待精修                           |
| 归档筛选               | “手写 / 与 AI 合写 / AI 主笔 / 含剧透 / 可能已过时”等配置标识筛选                 | 没有执笔/标识字段和筛选条                                                            | 待对齐，先补内容模型                           |
| 归档日历               | 年×月热度日历；高峰月叠白色花瓣；手机年份缩为 `'26`，单元格接近正方形             | 热度、图例、未来月份描边、锚点均有；无高峰花瓣，手机保留完整年份且单元格固定 17px 高 | 部分对齐                                       |
| 归档年份与文章行       | 归档年份单独加大；标题有对应标记/悬停细节                                         | 与普通分类年份共用样式，年份较小，行装饰简化                                         | 待精修                                         |
| 友链列表 `/friends`    | 分组筛选、三/二/一列；支持真实头像和加载回退；站点主题色参与头像描边及 hover 色彩 | 分组筛选和列数已匹配；统一 Smile 图标，头像图片能力缺失，hover 主要位移/边框变化     | 部分对齐；作者、站点与数量是演示数据差异       |
| 友链申请               | 六字段表单、配置预览/复制，引导在页面留言；评论是否显示受配置控制                 | 六字段预览/复制均有，引导联系关于页；仅本地生成，不提交                              | 基础交互已对齐，提交/评论是明确范围边界        |
| 关于 `/about`          | 完整 60svh 封面；正文、引用及 Telegram / Gitbook 的丰富链接预览                   | 紧凑 42svh / 手机 36svh 封面；普通自述和两个简化链接卡片                             | 头图布局与链接组件待对齐；作者文案不应照抄     |
| 404                    | SVG 数字 404 变猫头，发光/脸部细节，首页/归档恢复入口及随机推荐                   | 数字与独立猫脸交替显示，未实现数字形状变形；恢复入口已有，无随机推荐                 | 部分对齐                                       |
| 追番 `/bangumi` 数据源 | 只有 Bangumi.tv；初始化收集各媒介数据，再在客户端按页展示                         | 顶部切换哔哩哔哩 / Bangumi.tv；按需请求、独立面板，每批 24 条                        | 用户明确要求保留双源和按批追加                 |
| 追番卡片布局           | 规则 2:3 海报网格；桌面四列，中屏及手机三列                                       | 海报原比例瀑布流；桌面四列、中屏三列、窄屏两列                                       | 用户明确要求保留瀑布流和无页码                 |
| 追番细节               | 标题最多两行、状态/年份/评分间以点分隔；海报上浮与缩放；200ms 列表切换            | 标题不截两行，增加原名；meta 布局和 hover 细节不同，没有对应列表离入场编排           | 可在保留当前卡片风格前提下选择性对齐           |
| 追番页底部             | 有随机文章推荐                                                                    | 当前关闭推荐区                                                                       | 待对齐                                         |

## 公共外壳与动效差异表

| 区域               | 参考 v7.7.4                                                                  | 当前实现                                                          | 判断                                               |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| 素材与主题         | 插画、真实头像、粉蓝强调和浅灰渐变；暗色梅紫渐变                             | Unsplash 樱花摄影、字形头像、粉白/叶绿及较平面的底色              | 明确视觉差异；素材有授权边界，不应直接复制参考图片 |
| 桌面封面标题       | 首页 48px + 4.8px 字距；紧凑页面 36px + 2.88px 字距                          | 首页 48px、无额外字距；紧凑页面 38.4px、无额外字距                | 待对齐                                             |
| 手机封面标题       | 首页 48px；文章 24px；紧凑页 30px                                            | 首页/文章 32px；紧凑页仍 38.4px                                   | 待对齐；紧凑页移动规则被更高优先级样式覆盖         |
| 封面遮罩与图像加载 | 中央径向遮罩 + 导航渐变；本地响应式资源、srcset 与 LQIP                      | 简化纵向遮罩；单个远程 URL，object-position 43%，无 srcset / LQIP | 部分对齐；图片来源保留自身素材                     |
| 标题入场           | 所有 Cover 标题带 `motion-rise`；首页三层错峰；10px 模糊至清晰               | 只首页三层错峰，760ms / 120、230、340ms 已一致；只有位移与透明度  | 时序已对齐，模糊与非首页入场仍缺                   |
| 滚动视差           | Cover 通用背景与文案视差，26svh / −9svh；支持动效强度缩放                    | 同几何值，仅 `.is-home` 启用                                      | 首页已对齐，文章/其他封面未覆盖                    |
| 波浪               | 三层 12/7/4 秒横移；波形/透明度不同，另有整体从下方抬升的 `cover-tide`       | 三层周期已对齐，重绘波形横移；没有整体抬升                        | 部分对齐                                           |
| 花瓣               | Canvas2D，约 12–34 片，随风/翻滚，鼠标拨动；另有点击花瓣散射                 | CSS 八片固定轨迹，低配三片，离屏/隐藏暂停；无鼠标风场与点击散射   | 部分对齐，质感/交互仍不同                          |
| 分类翻面           | 720ms 曲线、100ms hover 防误触                                               | 同时序；额外支持显式按钮、inert、Escape 和减少运动静态双面        | 动画基础已对齐，访问性有增强                       |
| 页面衔接           | Astro ClientRouter，多处命名元素/持久化容器协调；520ms 共享标题              | Vue 普通页面淡入淡出；PostCard 触发的单标题共享过渡为 520ms       | 主要路径已对齐，覆盖范围和编排不同                 |
| 内容滚动浮现       | 分类项、年份分组、推荐、正文等按等级编排；目录面板切换有级联入场             | 目前主要覆盖文章卡片和精选分类                                    | 动效覆盖仍缺；首屏立即可见行为按原约定保留         |
| 顶部导航           | 周刊、歌单、写作室、搜索、语言等入口和浮层菜单                               | 首页、文章、友链、关于、追番与原生 details 菜单                   | 已有页面可导航；搜索/系列/音乐/多语言另定范围      |
| 手机抽屉           | 可跟手拖拽，按位移和释放速度决定关闭，配合遮罩动画                           | 原生 dialog、滑动结束后按固定阈值关闭；不跟手，结构和顶部分区不同 | 部分对齐                                           |
| 阅读与通用设置     | 字体、字号、行距、行宽、两端对齐；灵动/克制/减弱动效、海浪、滚动条、音乐开关 | 只有主题切换和 OS 减少动态效果，无设置中心                        | 功能差异                                           |
| 页脚推荐算法       | 随机文章；有相似度数据时相关文章，否则备用池；按总量分配条数                 | 固定取前六篇并分成两组三条：“再读一篇 / 最近的文字”               | 待对齐                                             |
| 页脚推荐覆盖       | 首页、列表、文章、友链、关于、追番、404 等启用；分类/标签/归档显式禁用       | 仅首页、文章、友链、关于启用                                      | 列表、追番、404 有缺口                             |
| 页脚统计           | 总字数、总阅读时长、篇数与主题署名                                           | 篇数、分钟、“所有文章”链接，无总字数统计                          | 部分对齐；作者/年份/署名文案是站点配置差异         |

## 已约定保留与范围边界

| 项目                | 参考与当前的差异                                                                     | 处理原则                                           |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| 文章卡片与分页      | 参考带页码；当前保留交替斜切卡片和滚动追加                                           | 保留，不列为待修复                                 |
| 追番数据源          | 参考单源；当前哔哩哔哩 + api.bgm.tv 顶部切换                                         | 保留，不改回单源                                   |
| 追番排布与 URL      | 参考规则网格和页码；当前瀑布流、24 条追加、无分页 URL                                | 保留                                               |
| 作者与示例数据      | 参考 23 篇文章 / 7 分类 / 37 标签；当前 7 篇 / 8 分类 / 9 标签，作者资料及账号均不同 | 数据数量、文字、头像内容不当作布局缺陷             |
| 周刊/系列 `/weekly` | 参考提供系列路由和展示，当前无对应页面                                               | 可选后续能力，需要单独决定                         |
| 歌单 `/music`       | 参考提供页面和全局播放器，当前无对应页面                                             | 可选后续能力，需要单独决定                         |
| 搜索与多语言        | 参考有搜索入口、语言选择和 `[lang]` 路由，当前只有文章列表本地筛选和中文             | 可选后续能力；列表筛选不等同全站搜索               |
| 写作室 `/editor`    | 参考有编辑器集成和入口，当前无后台/编辑器                                            | 当前项目明确范围外                                 |
| 评论、复杂正文能力  | 参考有可配置评论、图表、数学、图片灯箱、加密等；当前为结构化模拟正文                 | 不因视觉对比引入 Markdown 解析、后台或评论服务     |
| 静态内容与 SEO      | 参考有 Astro 内容路由、Markdown 源导出、RSS、sitemap 等；当前为 Vue SPA              | 架构边界；当前 history fallback 仍须由部署环境提供 |
| 文章 URL            | 参考 `/post/:slug`，当前 `/posts/:slug`                                              | 命名不同；若需兼容旧链接，另定映射策略             |

## 关键测量值

| 项目           | 参考桌面 1280×800 | 当前桌面 1280×800 | 参考手机 390×844  | 当前手机 390×844  |
| -------------- | ----------------- | ----------------- | ----------------- | ----------------- |
| 首页封面高度   | 480px             | 480px             | 约 506.4px        | 约 506.4px        |
| 紧凑封面高度   | 336px             | 336px             | 约 303.8px        | 约 303.8px        |
| 关于封面高度   | 480px             | 336px             | 约 506.4px        | 约 303.8px        |
| 首页主标题字号 | 48px              | 48px              | 48px              | 32px              |
| 文章标题字号   | 40px              | 48px              | 24px              | 32px              |
| 紧凑页标题字号 | 36px              | 38.4px            | 30px              | 38.4px            |
| 整页横向溢出   | 13 类页面均未发现 | 13 类页面均未发现 | 13 类页面均未发现 | 13 类页面均未发现 |

手机紧凑页字号原因：`SiteHero.vue` 中 `.is-compact .hero-copy h1` 的选择器优先级高于移动媒体查询中的 `.hero-copy h1`。媒体查询被命中也不能覆盖前者，实际保持 `2.4rem`，不是仅凭截图估计。

## 主要源码证据

| 核对项           | 当前代码                                                                                                                                                                            | 参考代码                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 封面排版和图片   | [SiteHero.vue](D:/workspace/astro-koharu-vitepress/src/components/SiteHero.vue:113)                                                                                                 | [Cover.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/ui/cover/Cover.astro)                                                                                                                               |
| 紧凑标题优先级   | [SiteHero.vue:177](D:/workspace/astro-koharu-vitepress/src/components/SiteHero.vue:177)                                                                                             | [Cover.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/ui/cover/Cover.astro)                                                                                                                               |
| 入场、视差和衔接 | [motion.less](D:/workspace/astro-koharu-vitepress/src/styles/motion.less:15)                                                                                                        | [cover.css](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/styles/components/cover.css)、[motion.css](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/styles/global/motion.css)                                   |
| 精选分类         | [FeaturedCategoryCard.vue](D:/workspace/astro-koharu-vitepress/src/components/FeaturedCategoryCard.vue)、[HomePage.vue](D:/workspace/astro-koharu-vitepress/src/pages/HomePage.vue) | [CategoryCards.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/post/CategoryCards.astro)                                                                                                                   |
| 花瓣             | [SiteHero.vue](D:/workspace/astro-koharu-vitepress/src/components/SiteHero.vue:236)                                                                                                 | [petal-field.ts](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/lib/sakura/petal-field.ts)、[petal-burst.ts](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/lib/sakura/petal-burst.ts)                           |
| 侧栏与目录       | [SiteSidebar.vue](D:/workspace/astro-koharu-vitepress/src/components/SiteSidebar.vue)、[ArticleToc.vue](D:/workspace/astro-koharu-vitepress/src/components/post/ArticleToc.vue)     | [HomeSider.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/layout/HomeSider.astro)                                                                                                                         |
| 标签层级         | [TaxonomyIndexPage.vue:85](D:/workspace/astro-koharu-vitepress/src/pages/TaxonomyIndexPage.vue:85)                                                                                  | [index-tags.ts](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/lib/content/index-tags.ts)、[tag-cloud.css](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/styles/components/tag-cloud.css)                       |
| 叶分类重复标签   | [TaxonomyDetailPage.vue:122](D:/workspace/astro-koharu-vitepress/src/pages/TaxonomyDetailPage.vue:122)                                                                              | [CategoryPostList.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/category/CategoryPostList.astro)                                                                                                         |
| 归档             | [ArchivesPage.vue](D:/workspace/astro-koharu-vitepress/src/pages/ArchivesPage.vue:48)、[archive-friends.less](D:/workspace/astro-koharu-vitepress/src/styles/archive-friends.less)  | [archives.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/pages/archives.astro:43)、[index-archives.css](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/styles/components/index-archives.css)              |
| 友链             | [FriendsPage.vue](D:/workspace/astro-koharu-vitepress/src/pages/FriendsPage.vue)                                                                                                    | [FriendCard.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/friends/FriendCard.astro)、[FriendsGrid.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/friends/FriendsGrid.astro) |
| 推荐与统计       | [SiteFooter.vue:17](D:/workspace/astro-koharu-vitepress/src/components/SiteFooter.vue:17)、[App.vue:19](D:/workspace/astro-koharu-vitepress/src/App.vue:19)                         | [PostFooter.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/post/PostFooter.astro)                                                                                                                         |
| 响应式断点       | [responsive.less:52](D:/workspace/astro-koharu-vitepress/src/styles/responsive.less:52)                                                                                             | [CategoryCards.astro](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/post/CategoryCards.astro)                                                                                                                   |
| Bangumi          | [BangumiPage.vue](D:/workspace/astro-koharu-vitepress/src/pages/BangumiPage.vue)、[bangumi.less](D:/workspace/astro-koharu-vitepress/src/styles/bangumi.less)                       | [BangumiCollection.tsx](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/components/bangumi/BangumiCollection.tsx)、[bangumi.css](D:/workspace/astro-koharu-vitepress/.reference/v7.7.4/src/styles/components/bangumi.css)    |

## 建议处理顺序

1. 手机紧凑页字号、关于页封面类型、标题字距等可直接核实的排版差异。
2. 精选分类背面和断点、归档筛选/高峰月份装饰、叶分类重复标签、页脚推荐策略与覆盖。
3. 标题模糊入场、波浪整体抬升、非首页视差、花瓣风场/散射、正文及目录等滚动编排。
4. 设置中心、系列/音乐/搜索/多语言等按范围单独决定。

本次交付为差异盘点，没有修改应用源码，也没有把未实施功能标记为完成。浏览器宽度检查不能代替真机手势、性能或跨浏览器验证；参考运行环境出现过 React hydration 属性警告，这不作为当前项目应复制的行为。

## 后续实施：对齐首页标题

用户于同日指定先处理首页标题样式，改动限于 `SiteHero.vue` 的首页选择器及首页标题使用的 `hero-rise` 关键帧。

| 项目       | 对齐后的值                                                     |
| ---------- | -------------------------------------------------------------- |
| 英文名     | 48px，400 字重，1.2 行高，0.02em 字距                          |
| 主标题     | 48px，700 字重，1.2 行高，0.1em 字距，上方 12px                |
| 副标题     | 14px，20px 行高，0.2em 字距，上方 20px                         |
| 标题组位置 | 在封面扣除底部 8svh 的区域内垂直居中，左右留白 20px            |
| 阴影       | 英文名与主标题使用双层暗色/粉色阴影，副标题使用参考的暗色阴影  |
| 入场       | 原有 760ms、120/230/340ms 错峰时序，补上 10px → 0 的模糊至清晰 |

同样的字号适用于手机宽度；较窄屏幕允许主标题换行。`bun run build`（含类型检查）通过；浏览器测量和截图保存在 `.reference/home-title-2026-10-15/`。

## 后续实施：页脚推荐与关于

用户随后指定对齐页脚推荐与关于页，仍以该参考版本为准。

| 项目         | 实施结果                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 推荐结构     | 独立 `PostRecommendations.vue`，桌面双列、≤992px 单列；纯文字标题、编号、分类、两行文章标题、悬停及一次性滚动浮现         |
| 普通页面选文 | 随机打乱可用文章，≤10 篇分为两组，超过时每组最多五篇；当前七篇分为 4＋3，右列作为编号延续                                 |
| 文章页选文   | 排除当前文章，优先生成相关文章；随机组排除已选相关文章，两组去重；无关联内容时随机回退                                    |
| 当前关联规则 | 使用现有分类与标签匹配。参考使用预生成语义相似度文件，当前没有该文件，因此没有宣称复用了相同相似度算法；服务边界可替换    |
| 推荐刷新     | 按页面路径/文章变化重新选择，追加文章、锚点和主题切换不重新打乱；支持加载与失败重试，空推荐区隐藏                         |
| 推荐覆盖     | 首页、文章列表/详情、友链、关于、追番及 404；正常分类、标签、归档页按参考隐藏                                             |
| 关于封面     | 显式完整页面封面：桌面 480px（1280×800）、手机约 506.4px（390×844）；标题 48px、0.1em 字距及 48px 链接图标，并有入场/视差 |
| 关于正文     | 正文 16px / 1.8 行高；h2 24px、h3 20px；按参考调整段落间距、移动端 24px 留白及无底色的引用边线                            |
| 链接预览     | 域名、图标、标题、说明、URL 的卡片结构；内部使用 Vue Router，外部新页打开并有 noopener/noreferrer；保留原有两个链接       |
| 预览数据边界 | 使用本地说明与已有图标，没有增加抓取第三方 OG 数据的服务或搬用参考作者的社交账号/徽章                                     |

`bun run typecheck`、8 个文件共 30 项测试、`bun run build` 通过。新测试覆盖随机分组、无重复、排除当前文章、相关内容优先、无关联回退及不修改源数据。

浏览器检查 1280、820、390px；12 个路由核对推荐显示范围；关于页内部链接跳转、`#contact`、静态明暗样式、主题切换时推荐顺序稳定及减少运动模拟。两种窄屏均无整页横向溢出，推荐改为单列；减少运动模拟中标题立即显示且没有活动动画。截图与 DOM 记录位于 `.reference/footer-about-2026-10-15/`。
