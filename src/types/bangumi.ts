export type SubjectType = 1 | 2 | 3 | 4 | 6
export type CollectionStatus = 1 | 2 | 3 | 4 | 5
export interface CollectionItem {
  id: number
  title: string
  originalTitle: string
  image: string
  date: string
  score: number | null
  ownScore: boolean
  status: CollectionStatus
  subjectType: SubjectType
  episodes: number
}
export interface CollectionPage {
  items: CollectionItem[]
  total: number
  offset: number
  limit: number
}
export const subjectTypes: Array<{ value: SubjectType; label: string }> = [
  { value: 2, label: '动画' },
  { value: 1, label: '书籍' },
  { value: 3, label: '音乐' },
  { value: 4, label: '游戏' },
  { value: 6, label: '三次元' },
]
export const collectionStatuses: Array<{ value: CollectionStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 2, label: '看过' },
  { value: 3, label: '在看' },
  { value: 1, label: '想看' },
  { value: 4, label: '搁置' },
  { value: 5, label: '抛弃' },
]
