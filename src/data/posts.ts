import type { Post } from '../types/post'

export const posts: Post[] = [
  {
    id: 'welcome',
    slug: 'welcome',
    title: '欢迎来到 Koharu',
    excerpt: '这是用于验证路由、类型和数据边界的示例文章。',
    publishedAt: '2026-10-13',
    category: '公告',
    body: ['这里暂时使用结构化模拟数据。', '后续页面会参考上游设计并接入真实 API。'],
  },
]
