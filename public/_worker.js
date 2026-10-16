export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // ========== /bili/* 代理 ==========
    if (url.pathname.startsWith('/bili')) {
      const path = url.pathname.replace(/^\/bili/, '') || '/'
      const targetUrl = `https://api.bilibili.com${path}${url.search}`

      const headers = new Headers(request.headers)
      headers.delete('origin')
      headers.delete('Origin')
      headers.set('Referer', 'https://www.bilibili.com/')
      headers.set(
        'User-Agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      )

      return fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      })
    }

    // ========== /uapi/* 代理 ==========
    if (url.pathname.startsWith('/uapi')) {
      const path = url.pathname.replace(/^\/uapi/, '') || '/'
      const targetUrl = `https://uapis.cn${path}${url.search}`

      const headers = new Headers(request.headers)
      headers.delete('origin')
      headers.delete('Origin')
      headers.set('Referer', 'https://uapis.cn')
      headers.set(
        'User-Agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      )

      return fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      })
    }

    // 其他请求交给静态资源（前端页面）
    return env.ASSETS.fetch(request)
  },
}
