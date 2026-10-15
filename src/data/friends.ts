import type { Friend, FriendGroup } from '@/types/post'

export const friends: Friend[] = [
  {
    name: '纸上散步',
    url: 'https://example.com/notes',
    description: '记录城市、书与日常小事的个人博客。',
    initial: '纸',
    owner: '阿纸',
    group: 'familiar',
    color: '#d65175',
  },
  {
    name: '慢慢生长',
    url: 'https://example.com/growing',
    description: '关于植物、生活方式和那些不赶时间的计划。',
    initial: '慢',
    owner: '小叶',
    group: 'community',
    color: '#54836c',
  },
  {
    name: '像素与风',
    url: 'https://example.com/pixels',
    description: '一个前端开发者的设计笔记与项目记录。',
    initial: '像',
    owner: '林风',
    group: 'following',
    color: '#627fb4',
  },
]

export const friendGroups: FriendGroup[] = [
  { id: 'familiar', title: '熟人', description: '常有交流、彼此熟悉的朋友。' },
  { id: 'community', title: '友链小伙伴', description: '通过博客相遇，交换生活与创作。' },
  { id: 'following', title: '单向关注', description: '喜欢阅读，也推荐给你的角落。' },
]
