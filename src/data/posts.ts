import type { Post } from '@/types/post'
import { articleDemo } from './article-demo'

const blossomCover =
  'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1600&q=85'
const gardenCover =
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=82'
const morningCover =
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=82'

export const posts: Post[] = [
  articleDemo,
  {
    id: 'a-note-for-spring',
    slug: 'a-note-for-spring',
    title: '给春天留一页空白',
    excerpt: '不急着把每一天填满，先记下窗边的光、晚风和刚刚好的停顿。',
    publishedAt: '2026-10-11',
    category: { name: '随笔', slug: 'essays' },
    tags: [
      { name: '日常', slug: 'everyday' },
      { name: '写作', slug: 'writing' },
    ],
    readingMinutes: 4,
    cover: blossomCover,
    coverAlt: '春日里盛开的粉色樱花枝',
    pinned: true,
    sections: [
      {
        id: 'a-slower-start',
        title: '从慢一点开始',
        paragraphs: [
          '最近开始把早晨空出来十分钟。不是为了完成一件事，只是把窗帘拉开，让房间知道今天已经开始。',
          '桌上的本子仍然是空白的。偶尔写下一个词，偶尔什么也不写。空白不是遗漏，它也可以是认真生活的一部分。',
        ],
        quote: '让日子先经过自己，再决定要不要把它写下来。',
      },
      {
        id: 'small-observations',
        title: '把小事放在近处',
        paragraphs: [
          '走回家的路上，花店把一桶白色的小花放到了门外。风吹过的时候，花瓣轻轻晃了一下。这样的事没有结论，却值得留在记忆里。',
          '我想，写作有时只是替这些微小的时刻找一个不会太快消失的位置。',
        ],
        list: ['一束花在风里的方向', '雨停之后路面的颜色', '晚饭前厨房传来的香气'],
      },
    ],
  },
  {
    id: 'the-long-way-home',
    slug: 'the-long-way-home',
    title: '今天绕远路回家',
    excerpt: '沿着河边多走了两站路，发现熟悉的城市也藏着几段安静。',
    publishedAt: '2026-09-21',
    category: { name: '生活', slug: 'life' },
    tags: [
      { name: '散步', slug: 'walking' },
      { name: '日常', slug: 'everyday' },
    ],
    readingMinutes: 5,
    cover: morningCover,
    coverAlt: '日出时分被晨光照亮的山野',
    sections: [
      {
        id: 'leave-the-usual-route',
        title: '离开熟悉的路线',
        paragraphs: [
          '下班时没有像平常一样去等公交。我沿着河岸往前走，鞋底踩过一段刚刚干透的石板路。',
          '路边的树影很长，偶尔有骑车的人从身旁经过。城市没有因此安静下来，但我的步子慢了下来。',
        ],
      },
      {
        id: 'a-small-detour',
        title: '一段不需要目的地的路',
        paragraphs: [
          '拐进住宅区后，遇到一家亮着灯的小面包店。橱窗里最后一只苹果派还温着，我买下来，继续往家的方向走。',
          '绕远路并没有带来什么特别的答案，只是让我重新看见了回家这件事本身。',
        ],
        quote: '有时候，慢下来就是抵达。',
      },
    ],
  },
  {
    id: 'keep-a-gentle-notebook',
    slug: 'keep-a-gentle-notebook',
    title: '把灵感记在手边',
    excerpt: '给随手记录一个简单的位置，让灵感先留下来，再慢慢长成文章。',
    publishedAt: '2026-08-07',
    category: { name: '写作', slug: 'craft/writing' },
    tags: [
      { name: '写作', slug: 'writing' },
      { name: '灵感', slug: 'ideas' },
    ],
    readingMinutes: 6,
    cover: gardenCover,
    coverAlt: '花园中盛放的粉白色花朵',
    sections: [
      {
        id: 'one-place-is-enough',
        title: '先选一个地方',
        paragraphs: [
          '我曾经在手机、便签、邮件草稿和纸本之间来回切换。记录的工具越多，真正回头整理的次数反而越少。',
          '现在只保留一个入口。它不需要漂亮，也不必把分类想得很周全，只要足够容易打开就可以。',
        ],
      },
      {
        id: 'write-before-editing',
        title: '记录时先不编辑',
        paragraphs: [
          '记录阶段只需要留下关键词、一个问题，或一段还没想明白的话。等到准备写文章时，再把它们放在一起看。',
          '把收集和整理分开之后，我更愿意相信那些不完整的想法。它们不是没有价值，只是还在路上。',
        ],
        list: ['先记下原句，不急着润色', '每周留一次时间回看', '暂时没有用途的内容也可以保留'],
      },
    ],
  },
  {
    id: 'routes-with-vue-router',
    slug: 'routes-with-vue-router',
    title: '让页面之间的路更清楚',
    excerpt: '一个小型博客模板里的路由、页面边界与本地服务，应该如何保持简单。',
    publishedAt: '2026-07-16',
    category: { name: 'Vue', slug: 'frontend/vue' },
    tags: [
      { name: 'Vue', slug: 'vue' },
      { name: '前端', slug: 'frontend' },
    ],
    readingMinutes: 7,
    cover: blossomCover,
    coverAlt: '阳光下的樱花树冠',
    sections: [
      {
        id: 'a-route-is-a-promise',
        title: '路由是一种承诺',
        paragraphs: [
          '每个页面地址都应该有稳定的含义。文章详情使用可读的 slug，分类和标签也有自己的索引与详情地址。',
          '这样一来，导航不仅能在应用内部工作，也能被收藏、分享，并在服务器正确回退配置下直接打开。',
        ],
      },
      {
        id: 'keep-content-behind-a-service',
        title: '内容读取留在服务边界后',
        paragraphs: [
          '页面通过有类型的服务函数读取本地模拟数据，而不是直接依赖数据文件。将来替换成 HTTP 实现时，页面不必知道数据来自哪里。',
          '当前模板不预设 API 地址、鉴权方式或服务端行为。接口契约应该等后端需求确定后再定义。',
        ],
        quote: '简单的边界，比提前设计一套不存在的后端更有用。',
      },
    ],
  },
  {
    id: 'a-window-in-the-morning',
    slug: 'a-window-in-the-morning',
    title: '清晨的窗边有一点绿',
    excerpt: '把一盆新叶放在窗台上以后，房间里多了一个可以慢慢观察的季节。',
    publishedAt: '2026-06-23',
    category: { name: '植物', slug: 'life/plants' },
    tags: [
      { name: '日常', slug: 'everyday' },
      { name: '植物', slug: 'plants' },
    ],
    readingMinutes: 3,
    cover: morningCover,
    coverAlt: '清晨天空中的柔和日光',
    sections: [
      {
        id: 'new-leaves',
        title: '新叶长出来的时候',
        paragraphs: [
          '那盆植物买回来时只有几片叶子。我以为自己会很快忘记照看它，没想到每天倒水的时候都会顺便看一眼。',
          '某个早晨，枝头冒出了很小的一点绿。它不着急长大，我也不用急着替它做什么。',
        ],
      },
    ],
  },
  {
    id: 'photos-without-a-plan',
    slug: 'photos-without-a-plan',
    title: '没有计划的几张照片',
    excerpt: '相机没有设定主题，镜头里却留下了这个夏天最想记住的颜色。',
    publishedAt: '2026-04-19',
    category: { name: '摄影', slug: 'craft/photography' },
    tags: [
      { name: '摄影', slug: 'photography' },
      { name: '灵感', slug: 'ideas' },
    ],
    readingMinutes: 4,
    cover: gardenCover,
    coverAlt: '阳光下开放的花朵与绿叶',
    sections: [
      {
        id: 'look-before-shooting',
        title: '先看一会儿，再按快门',
        paragraphs: [
          '这几张照片都不是为了某个项目准备的。那天只是带相机出门，看到光落在墙上，就停了一会儿。',
          '没有主题反而让我少了一些判断。我不再想它够不够完整，只想把眼前的颜色留下来。',
        ],
        quote: '留住的不是风景，是当时看见它的那一刻。',
      },
    ],
  },
  {
    id: 'reading-between-days',
    slug: 'reading-between-days',
    title: '在忙碌的间隙读几页',
    excerpt: '重新拾起一本放在床头很久的书，阅读不一定需要一整段空闲时间。',
    publishedAt: '2025-12-12',
    category: { name: '随笔', slug: 'essays' },
    tags: [
      { name: '阅读', slug: 'reading' },
      { name: '日常', slug: 'everyday' },
    ],
    readingMinutes: 5,
    cover: blossomCover,
    coverAlt: '层叠的粉色花瓣与春日光线',
    sections: [
      {
        id: 'a-few-pages-count',
        title: '几页也算一次阅读',
        paragraphs: [
          '以前我总想留出完整的一个小时再读书。这样的时间很少出现，于是那本书一直停在床头。',
          '后来我改成睡前读几页。断断续续地读，依然能慢慢走到最后一章。',
        ],
      },
    ],
  },
]
