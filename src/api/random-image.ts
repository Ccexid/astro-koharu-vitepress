import { createRandomImageUrl, type RandomImageQuery } from '@/api/random-image-contract'

export type { RandomImageQuery, RandomImageCategory } from '@/api/random-image-contract'

export class RandomImageError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly retryAfterMs?: number,
    public readonly requestId?: string,
    public readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'RandomImageError'
  }
}

export interface RandomImageOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

function retryDelay(value: string | null): number | undefined {
  if (!value?.trim()) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : undefined
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}

/** Fetch image bytes from the public UAPI endpoint through the same-origin Worker. */
export async function fetchRandomImage(
  query: RandomImageQuery = {},
  options: RandomImageOptions = {},
): Promise<Blob> {
  const target = createRandomImageUrl(query)
  const { signal, timeoutMs = 30_000 } = options
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new RangeError('请求超时必须是正整数毫秒。')
  const timeout = AbortSignal.timeout(timeoutMs)
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
  try {
    const baseUrl = (import.meta.env.VITE_API_UAPI_URL?.trim() || 'https://uapis.cn').replace(/\/+$/, '')
    const response = await fetch(`${baseUrl}/${target.pathname}${target.search}`, {
      method: 'GET',
      headers: { Accept: 'image/*' },
      credentials: 'omit',
      cache: 'no-store',
      signal: requestSignal,
    })
    if (!response.ok) {
      const data: unknown = await response.json().catch(() => undefined)
      const error = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
      const fallback =
        response.status === 429
          ? '随机图片请求被限流，请稍后重试。'
          : `随机图片读取失败（HTTP ${response.status}）。`
      throw new RandomImageError(
        typeof error.message === 'string' ? error.message : fallback,
        response.status,
        typeof error.code === 'string' ? error.code : undefined,
        retryDelay(response.headers.get('Retry-After')),
        response.headers.get('X-Request-ID') || undefined,
        error.details,
      )
    }
    if (!response.headers.get('Content-Type')?.toLowerCase().startsWith('image/')) {
      throw new RandomImageError(
        '随机图片接口未返回图片，请确认正在使用 Cloudflare Worker 环境。',
        response.status,
        'CLIENT_INVALID_IMAGE',
      )
    }
    const image = await response.blob()
    if (!image.size) throw new RandomImageError('随机图片内容为空。', response.status, 'CLIENT_EMPTY_IMAGE')
    return image
  } catch (error) {
    if (signal?.aborted) throw signal.reason
    if (timeout.aborted)
      throw new RandomImageError(
        '随机图片请求超时，请稍后重试。',
        0,
        'CLIENT_TIMEOUT',
        undefined,
        undefined,
        undefined,
        { cause: error },
      )
    if (error instanceof RandomImageError) throw error
    throw new RandomImageError(
      '随机图片网络请求失败，请检查网络连接。',
      0,
      'CLIENT_NETWORK_ERROR',
      undefined,
      undefined,
      undefined,
      { cause: error },
    )
  }
}
