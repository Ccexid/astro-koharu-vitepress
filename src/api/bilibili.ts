import type {
  BangumiItem,
  BangumiMediaType,
  BangumiResponse,
  BangumiFollowParams,
  BangumiFollowStatus,
} from './bilibili.types'

export type {
  BangumiFollowParams,
  BangumiItem,
  BangumiMediaType,
  BangumiResponse,
  BangumiFollowStatus,
} from './bilibili.types'

export class BilibiliApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'http' | 'api' | 'invalid-response',
    readonly status?: number,
    readonly code?: number,
  ) {
    super(message)
    this.name = 'BilibiliApiError'
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BilibiliApiError(`Invalid Bilibili response: ${path}`, 'invalid-response')
  }
  return value as Record<string, unknown>
}

function integer(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new BilibiliApiError(`Invalid Bilibili response: ${path}`, 'invalid-response')
  }
  return value
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BilibiliApiError(`Invalid Bilibili response: ${path}`, 'invalid-response')
  }
  return value
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new BilibiliApiError(`Invalid Bilibili response: ${path}`, 'invalid-response')
  }
  return value
}

function optionalText(value: unknown, path: string): string | undefined {
  return value == null ? undefined : text(value, path)
}

function optionalCount(value: unknown, path: string): number | undefined {
  return value == null ? undefined : integer(value, path)
}

function optionalEpisodeCount(value: unknown, path: string): number | undefined {
  return value === -1 ? undefined : optionalCount(value, path)
}

function followStatus(value: unknown, path: string): BangumiFollowStatus {
  if (value !== 1 && value !== 2 && value !== 3) {
    throw new BilibiliApiError(`Invalid Bilibili response: ${path}`, 'invalid-response')
  }
  return value
}

function invalid(path: string): never {
  throw new BilibiliApiError(`Invalid Bilibili response: ${path}`, 'invalid-response')
}

function mediaType(value: unknown, fallback: BangumiMediaType, path: string): BangumiMediaType {
  return value == null ? fallback : value === 1 || value === 2 ? value : invalid(path)
}

function progressCount(value: unknown, path: string): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value !== 'string' && typeof value !== 'number') return invalid(path)
  const match = String(value).match(/\d+/)
  return match ? Number(match[0]) : undefined
}

function item(value: unknown, index: number, params: BangumiFollowParams): BangumiItem {
  const path = `data.list[${index}]`
  const raw = record(value, path)
  const rating = raw.rating == null ? null : record(raw.rating, `${path}.rating`)
  const latestEpisode = raw.new_ep == null ? null : record(raw.new_ep, `${path}.new_ep`)
  const stat = raw.stat == null ? null : record(raw.stat, `${path}.stat`)
  const publish = raw.publish == null ? null : record(raw.publish, `${path}.publish`)
  const styles = raw.styles == null ? undefined : raw.styles
  if (styles !== undefined && (!Array.isArray(styles) || styles.some((style) => typeof style !== 'string'))) {
    return invalid(`${path}.styles`)
  }

  const seasonId = raw.season_id == null ? raw.media_id : raw.season_id
  const score = rating == null ? undefined : finiteNumber(rating.score, `${path}.rating.score`)
  return {
    id: String(integer(seasonId, `${path}.season_id`)),
    title: text(raw.title, `${path}.title`),
    cover: text(raw.cover, `${path}.cover`),
    url: text(raw.url, `${path}.url`),
    status:
      raw.follow_status == null
        ? params.followStatus
        : followStatus(raw.follow_status, `${path}.follow_status`),
    category: mediaType(raw.season_type, params.type, `${path}.season_type`),
    total: optionalEpisodeCount(raw.total_count, `${path}.total_count`),
    progress: progressCount(raw.progress, `${path}.progress`),
    latestEpisode:
      latestEpisode == null ? undefined : optionalText(latestEpisode.index_show, `${path}.new_ep.index_show`),
    score,
    desc: optionalText(raw.evaluate, `${path}.evaluate`),
    airDate: publish == null ? undefined : optionalText(publish.release_date, `${path}.publish.release_date`),
    type: styles?.join(' / '),
    follow: stat == null ? undefined : optionalCount(stat.follow, `${path}.stat.follow`),
    view: stat == null ? undefined : optionalCount(stat.view, `${path}.stat.view`),
    danmaku: stat == null ? undefined : optionalCount(stat.danmaku, `${path}.stat.danmaku`),
    reply: stat == null ? undefined : optionalCount(stat.reply, `${path}.stat.reply`),
    coin: stat == null ? undefined : optionalCount(stat.coin, `${path}.stat.coin`),
    likes: stat == null ? undefined : optionalCount(stat.likes, `${path}.stat.likes`),
    favorite: stat == null ? undefined : optionalCount(stat.favorite, `${path}.stat.favorite`),
  }
}

function parsePage(payload: unknown, params: BangumiFollowParams): BangumiResponse {
  const envelope = record(payload, 'root')
  if (envelope.code !== 0) {
    const code = finiteNumber(envelope.code, 'code')
    if (!Number.isSafeInteger(code)) {
      throw new BilibiliApiError('Invalid Bilibili response: code', 'invalid-response')
    }
    const message = optionalText(envelope.message, 'message') ?? `Bilibili API error (${code})`
    throw new BilibiliApiError(message, 'api', undefined, code)
  }

  const data = record(envelope.data, 'data')
  if (!Array.isArray(data.list)) {
    throw new BilibiliApiError('Invalid Bilibili response: data.list', 'invalid-response')
  }
  return {
    list: data.list.map((entry, index) => item(entry, index, params)),
    total: integer(data.total, 'data.total'),
    page: integer(data.pn, 'data.pn'),
    pageSize: integer(data.ps, 'data.ps'),
  }
}

function positiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`)
  }
}

/** Fetches one upstream page through the same-origin /bili proxy. */
export async function listBangumiFollows(
  params: BangumiFollowParams,
  options: { signal?: AbortSignal } = {},
): Promise<BangumiResponse> {
  const { vmid, type, followStatus: status, page = 1, pageSize = 30 } = params
  if (!/^[1-9]\d*$/.test(String(vmid)) || (typeof vmid === 'number' && !Number.isSafeInteger(vmid))) {
    throw new RangeError('vmid must be a positive decimal ID')
  }
  if (type !== 1 && type !== 2) throw new RangeError('type must be 1 or 2')
  if (status !== 1 && status !== 2 && status !== 3) throw new RangeError('followStatus must be 1, 2 or 3')
  positiveInteger(page, 'page')
  positiveInteger(pageSize, 'pageSize')

  const query = new URLSearchParams({
    vmid: String(vmid),
    type: String(type),
    follow_status: String(status),
    pn: String(page),
    ps: String(pageSize),
  })
  const response = await fetch(`/bili/x/space/bangumi/follow/list?${query}`, {
    signal: options.signal,
    credentials: 'omit',
  })
  if (!response.ok) {
    throw new BilibiliApiError(`Bilibili request failed (HTTP ${response.status})`, 'http', response.status)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new BilibiliApiError('Bilibili response is not JSON', 'invalid-response')
  }
  return parsePage(payload, params)
}
