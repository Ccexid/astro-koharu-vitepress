# 首页动效下一步

基于提交 `b342503` 与 `.reference/v7.7.4` 的只读对照，日期 2026-10-15。本轮只接入 Bilibili，以下动效尚未实施。

| 顺序 | 工作                                     | 当前证据                                                                                                                      | 状态                     |
| ---- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1    | 首屏标题分层入场、头图加载收束、滚动视差 | `SiteHero.vue` 只有花瓣和单层波浪运动，文字/图像没有参考的入场与视差                                                          | TODO                     |
| 2    | 首页精选分类翻面和进入视口动画           | `HomePage.vue` 当前为静态上下结构；参考 `CategoryCards.astro` 使用 `FlippedCard`，并标记 `motion-reveal`                      | TODO                     |
| 3    | 首页到文章的页面衔接                     | `App.vue` 直接替换路由组件；`motion.less` 的 `.page-enter-*` 没有 `Transition` 调用，参考另有卡片标题到封面标题的共享元素衔接 | TODO                     |
| 4    | 波浪与花瓣运动精修                       | 当前仅 `.wave-mid` 上下摆动；参考三层波浪不同周期横移。花瓣当前为固定八片循环，缺参考的更丰富轨迹                             | TODO，视觉优先级低于 1–3 |

既有文章卡片的滚动显示、斜切封面 hover 和 reduced-motion 已实现，不重复重写。`useScrollReveal` 刻意让首屏已可见文章立即显示，避免加载时隐藏正文，这一行为保留。

## 第一批实施规格

范围：`src/components/SiteHero.vue`、`src/styles/motion.less`，必要时小型 composable。保持现有图片、标题、封面高度、文章卡片、数据服务和所有 Bilibili 配置不变；不添加依赖。

1. 对首页的英文名、主标题、副标题分别入场：760ms，`var(--motion-ease-enter)`（`cubic-bezier(0.16,1,0.3,1)`），延迟 120/230/340ms，位移从 28px 到 0，透明度从 0 到 1。以已存在的 `.hero-alternate`、`.hero-copy h1`、`.hero-subtitle` 为目标；其他页面不重复播放整个首屏序列。
2. 图片首次尚未加载时，等待 `load` 后使用 WAAPI 从 scale 1.08 到 1，1800ms，`cubic-bezier(0.25,1,0.5,1)`。缓存命中保持静止；卸载取消动画并移除监听。动态切换 reduced-motion 时立即取消并还原，不能让图片透明或留在中间状态。
3. 视差仅在支持 `animation-timeline: scroll()` 且 `prefers-reduced-motion: no-preference` 时启用。参考几何：背景前 100svh 滚动至下移 26svh，文字前 50svh 滚动至透明并上移 9svh；transform 分配给不同容器，不能和图片入场 scale 相互覆盖。不支持的浏览器保持完整静态内容。
4. 入场动画不能在每次追加文章、筛选变化、锚点变化时重播。首屏关键内容必须有静态默认样式；异常/脚本不可用不能留下不可见标题。

上述值来自参考 `src/styles/components/cover.css`、`src/styles/global/motion.css`、`src/components/ui/cover/Cover.astro`，沿用本地 `src/styles/tokens.less` 的同名作用令牌，不新增相近的平行令牌。

## 后续边界

- 分类翻面：参考 720ms 的 `cubic-bezier(0.76,0,0.24,1)` 和 100ms 防误触；需先定义键盘 focus、触屏显式展开及 reduced-motion 的静态双面替代，不能仅实现 hover 让背面链接失去访问途径。
- 页面衔接：先修无效 `.page-enter-*` 的调用，再评估 View Transitions。支持时卡片标题和对应封面标题 520ms 共享元素移动；不支持或减少动态效果时直接导航。快速连续导航取消旧动画，不重复命名，不与主题切换 View Transition 并发争用。
- 波浪：参考三层 12/7/4 秒横向循环，保持封面和正文之间没有空洞；不照搬截图当作图片层。花瓣离屏暂停、低配降级和 OS 减少运动都需要验证。

## 验收

执行 `bun run typecheck`、`bun run test`、`bun run build`。浏览器在 1280、820、390px 下观察首屏第一次加载、缓存加载、向下滚动、返回首页、快速连续导航；录制至少两帧而非用一张截图证明动画存在。在动画面板 10% 速度下检查标题顺序、图片不闪白、正文不跳动。模拟 reduced-motion 时标题立即可见、视差与持续装饰停止，导航和焦点仍正常。第一批完成后再实施翻面及路由衔接。
