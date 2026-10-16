import { handleRandomImage } from './random-image'

interface WorkerEnv {
  ASSETS: { fetch: typeof fetch }
}

const upstreams = {
  '/bili': { origin: 'https://api.bilibili.com', referer: 'https://www.bilibili.com/' },
  '/uapi': { origin: 'https://uapis.cn', referer: 'https://uapis.cn/' },
} as const

function errorResponse(message: string, status: number, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers })
}

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  if (url.pathname === '/uapi/api/v1/random/image') return handleRandomImage(request)
  const prefix = Object.keys(upstreams).find(
    (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
  ) as keyof typeof upstreams | undefined
  if (!prefix) return env.ASSETS.fetch(request)

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return errorResponse('此接口只支持 GET 和 HEAD。', 405, { Allow: 'GET, HEAD' })
  }

  const path = url.pathname.slice(prefix.length)
  if (!path || path === '/' || /\\|%2f|%5c/i.test(path)) return errorResponse('无效的 API 路径。', 400)
  // Resolve against a fixed host. Never accept a destination URL from a query parameter.
  const upstream = upstreams[prefix]
  const target = new URL(upstream.origin)
  target.pathname = path
  target.search = url.search

  if (prefix === '/bili' && path !== '/x/space/bangumi/follow/list') {
    return errorResponse('此哔哩哔哩接口未开放转发。', 404)
  }
  if (prefix === '/uapi' && !path.startsWith('/api/')) {
    return errorResponse('此 UAPI 路径未开放转发。', 404)
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        Accept: 'application/json',
        Referer: upstream.referer,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'manual',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]),
    })

    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel()
      return errorResponse('上游接口返回了重定向，请检查接口地址。', 502)
    }

    // Only return the API body and content type; do not relay cookies or upstream CORS headers.
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return errorResponse(
      timeout ? '上游接口请求超时或已取消。' : '上游接口暂时无法连接。',
      timeout ? 504 : 502,
    )
  }
}

export default { fetch: handleRequest }
