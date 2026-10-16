export async function onRequest(context: EventContext) {
  const { request, params } = context

  // 把 /bili/xxx 转成 https://api.bilibili.com/xxx
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path || ''
  const targetUrl = `https://api.bilibili.com/${path}${new URL(request.url).search}`

  // 复制原请求头，并按你开发时的 proxy 逻辑修改
  const headers = new Headers(request.headers)

  // 删除 origin（对应 proxyRequest.removeHeader('origin')）
  headers.delete('origin')
  headers.delete('Origin')

  // 设置 Referer 和 User-Agent（对应你配置里的 setHeader）
  headers.set('Referer', 'https://www.bilibili.com/')
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  // 可选：有些接口需要这些
  // headers.set('Origin', 'https://www.bilibili.com')

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    // 如果需要带 cookie，可以加：
    // credentials: 'include'  // 注意：Worker 这边一般用 headers 传
  })

  // 把响应返回给前端，并处理 CORS（同源其实不需要，但保险）
  const newResponse = new Response(response.body, response)
  
  // 如果前端需要跨域，可以加：
  // newResponse.headers.set('Access-Control-Allow-Origin', '*')
  // newResponse.headers.set('Access-Control-Allow-Credentials', 'true')

  return newResponse
}