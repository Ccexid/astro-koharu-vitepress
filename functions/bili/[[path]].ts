import type { EventContext } from '@cloudflare/workers-types'
export async function onRequest(context: EventContext) {
  const { request, params } = context

  // params.path 是数组，例如 ['x', 'web-interface', 'nav']
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path || ''
  const search = new URL(request.url).search
  const targetUrl = `https://api.bilibili.com/${path}${search}`

  const headers = new Headers(request.headers)
  headers.delete('origin')
  headers.delete('Origin')
  headers.set('Referer', 'https://www.bilibili.com/')
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  )

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  })

  return new Response(response.body, response)
}
