import { AxiosHeaders } from 'axios'
import { createRandomImageUrl, type RandomImageQuery } from '@/api/random-image-contract'
import { request } from '@/api/http'

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

function responseHeader(headers: AxiosHeaders, name: string): string | undefined {
  const value = headers.get(name)
  return typeof value === 'string' ? value : undefined
}

function retryDelay(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : undefined
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}

async function errorPayload(data: unknown): Promise<Record<string, unknown>> {
  try {
    const text = data instanceof Blob ? await data.text() : typeof data === 'string' ? data : ''
    const value =
      data && typeof data === 'object' && !(data instanceof Blob) ? data : JSON.parse(text || 'null')
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** Read image bytes from the public UAPI endpoint through the same-origin Worker. */
export async function fetchRandomImage(
  query: RandomImageQuery = {},
  options: RandomImageOptions = {},
): Promise<Blob> {
  const target = createRandomImageUrl(query)
  const { signal, timeoutMs = 30_000 } = options
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new RangeError('请求超时必须是正整数毫秒。')
  try {
    const response = await request<Blob>(`/uapi${target.pathname}${target.search}`, {
      method: 'GET',
      headers: { Accept: 'image/*' },
      fetchOptions: { cache: 'no-store' },
      responseType: 'blob',
      validateStatus: () => true,
      signal,
      timeoutMs,
    })
    const headers = response.headers as AxiosHeaders
    const contentType = responseHeader(headers, 'Content-Type') || ''
    const requestId = responseHeader(headers, 'X-Request-ID')
    const retryAfter = responseHeader(headers, 'Retry-After')
    if (response.status < 200 || response.status >= 300) {
      const error = await errorPayload(response.data)
      const fallback =
        response.status === 429
          ? '随机图片请求被限流，请稍后重试。'
          : `随机图片读取失败（HTTP ${response.status}）。`
      throw new RandomImageError(
        typeof error.message === 'string' ? error.message : fallback,
        response.status,
        typeof error.code === 'string' ? error.code : undefined,
        retryDelay(retryAfter),
        requestId,
        error.details,
      )
    }
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new RandomImageError(
        '随机图片接口未返回图片，请确认正在使用 Cloudflare Worker 环境。',
        response.status,
        'CLIENT_INVALID_IMAGE',
      )
    }
    const image = response.data
    if (!image.size) throw new RandomImageError('随机图片内容为空。', response.status, 'CLIENT_EMPTY_IMAGE')
    return image
  } catch (error) {
    if (signal?.aborted) throw signal.reason
    if (error instanceof Error && error.name === 'TimeoutError')
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
