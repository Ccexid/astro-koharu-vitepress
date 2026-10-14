/** Values accepted by Bilibili's follow-list query. */
export type BangumiMediaType = 1 | 2
export type BangumiFollowStatus = 1 | 2 | 3

export interface BangumiFollowParams {
  vmid: string | number
  type: BangumiMediaType
  followStatus: BangumiFollowStatus
  page?: number
  pageSize?: number
}

/** Normalized item shared by the Bilibili API adapter and the Bangumi UI. */
export interface BangumiItem {
  id: string
  title: string
  cover: string
  url: string
  status: BangumiFollowStatus
  category: BangumiMediaType
  total?: number
  progress?: number
  latestEpisode?: string
  score?: number
  desc?: string
  airDate?: string
  type?: string
  follow?: number
  view?: number
  danmaku?: number
  reply?: number
  coin?: number
  likes?: number
  favorite?: number
}

export interface BangumiResponse {
  list: BangumiItem[]
  total: number
  page: number
  pageSize: number
}
