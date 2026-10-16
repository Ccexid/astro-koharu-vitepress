import { createRandomImageUrl, type RandomImageQuery } from '../src/api/random-image-contract'

function fail(message: string, status: number, code: string, headers?: HeadersInit): Response {
  return Response.json({ code, message }, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}

/** Fetch this public image endpoint without credentials and follow its image redirects. */
export async function handleRandomImage(request: Request): Promise<Response> {
  if (request.method !== 'GET')
    return fail('随机图片接口只支持 GET。', 405, 'PROXY_METHOD_NOT_ALLOWED', { Allow: 'GET' })
  const params = new URL(request.url).searchParams
  if (
    [...params.keys()].some((name) => !['category', 'type'].includes(name)) ||
    params.getAll('category').length > 1 ||
    params.getAll('type').length > 1
  ) {
    return fail('只允许单个 category 和 type 参数。', 400, 'PROXY_INVALID_PARAMETER')
  }
  let target: URL
  try {
    target = createRandomImageUrl({
      category: params.get('category') ?? undefined,
      type: params.get('type') ?? undefined,
    } as RandomImageQuery)
  } catch (error) {
    return fail(error instanceof Error ? error.message : '无效的图片参数。', 400, 'PROXY_INVALID_PARAMETER')
  }

  const timeout = AbortSignal.timeout(25_000)
  const signal = AbortSignal.any([request.signal, timeout])
  const apiOrigin = target.origin
  let requestId: string | null = null
  try {
    for (let redirects = 0; redirects <= 5; redirects++) {
      const headers = new Headers({ Accept: 'image/*' })
      const response = await fetch(target, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal,
        cache: 'no-store',
      })
      if (target.origin === apiOrigin) requestId = response.headers.get('X-Request-ID') || requestId
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('Location')
        await response.body?.cancel()
        if (!location || redirects === 5)
          return fail('图片跳转无效或次数过多。', 502, 'PROXY_INVALID_REDIRECT')
        let next: URL
        try {
          next = new URL(location, target)
        } catch {
          return fail('图片跳转地址无效。', 502, 'PROXY_INVALID_REDIRECT')
        }
        if (next.protocol !== 'https:' || next.username || next.password) {
          return fail('图片跳转必须使用不含凭据的 HTTPS 地址。', 502, 'PROXY_INVALID_REDIRECT')
        }
        target = next
        continue
      }
      if (response.ok && !response.headers.get('Content-Type')?.toLowerCase().startsWith('image/')) {
        await response.body?.cancel()
        return fail('上游未返回图片内容。', 502, 'PROXY_INVALID_IMAGE')
      }
      const outgoing = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      for (const name of ['Content-Type', 'Retry-After', 'X-Request-ID']) {
        const value = response.headers.get(name)
        if (value) outgoing.set(name, value)
      }
      if (requestId) outgoing.set('X-Request-ID', requestId)
      return new Response(response.body, { status: response.status, headers: outgoing })
    }
    return fail('图片跳转次数过多。', 502, 'PROXY_INVALID_REDIRECT')
  } catch {
    const expired = timeout.aborted || request.signal.aborted
    return fail(
      expired ? '随机图片上游请求超时或已取消。' : '随机图片上游暂时无法连接。',
      expired ? 504 : 502,
      expired ? 'PROXY_TIMEOUT' : 'PROXY_NETWORK_ERROR',
    )
  }
}
