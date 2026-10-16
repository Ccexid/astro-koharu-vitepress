import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleRequest } from '../cloudflare/worker'

const env = () => ({ ASSETS: { fetch: vi.fn() } })
const request = (query = '') => new Request(`https://blog.example/uapi/api/v1/random/image${query}`)

afterEach(() => vi.unstubAllGlobals())

describe('public random image Worker', () => {
  it('works without a key and follows 302 without forwarding browser credentials', async () => {
    const upstream = vi
      .fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response())
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { Location: 'https://images.example/photo.jpg' } }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([0xff, 0xd8]), {
          headers: { 'Content-Type': 'image/jpeg', 'Set-Cookie': 'private=1' },
        }),
      )
    vi.stubGlobal('fetch', upstream)
    const response = await handleRequest(
      new Request(request('?category=acg&type=pc'), {
        headers: { Authorization: 'Bearer visitor-token', Cookie: 'session=private' },
      }),
      env(),
    )
    expect(String(upstream.mock.calls[0]![0])).toBe(
      'https://uapis.cn/api/v1/random/image?category=acg&type=pc',
    )
    expect(new Headers(upstream.mock.calls[0]![1]?.headers).has('Authorization')).toBe(false)
    expect(new Headers(upstream.mock.calls[0]![1]?.headers).has('Cookie')).toBe(false)
    expect(String(upstream.mock.calls[1]![0])).toBe('https://images.example/photo.jpg')
    expect(new Headers(upstream.mock.calls[1]![1]?.headers).has('Authorization')).toBe(false)
    expect(upstream.mock.calls.every(([, options]) => options?.redirect === 'manual')).toBe(true)
    expect(response.status).toBe(200)
    expect(response.headers.has('Set-Cookie')).toBe(false)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0xff, 0xd8]))
  })

  it('validates parameters before using the API', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    for (const query of [
      '?category=acg&type=4k',
      '?type=pc',
      '?category=landscape&type=pc',
      '?category=acg&category=bq',
      '?url=https://elsewhere.example',
    ]) {
      expect((await handleRequest(request(query), env())).status).toBe(400)
    }
    expect(upstream).not.toHaveBeenCalled()
  })

  it.each([404, 429, 500])('preserves upstream HTTP %i, JSON errors and retry headers', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { code: 'UPSTREAM_CODE', message: '上游说明' },
          { status, headers: { 'Retry-After': '25', 'X-Request-ID': 'diagnostic' } },
        ),
      ),
    )
    const response = await handleRequest(request(), env())
    expect(response.status).toBe(status)
    expect(response.headers.get('Retry-After')).toBe('25')
    expect(response.headers.get('X-Request-ID')).toBe('diagnostic')
    expect(await response.json()).toEqual({ code: 'UPSTREAM_CODE', message: '上游说明' })
  })

  it.each([
    'http://images.example/image.jpg',
    'https://user:pass@images.example/image.jpg',
    'file:///image.jpg',
  ])('rejects unsafe redirects: %s', async (location) => {
    const upstream = vi.fn(async () => new Response(null, { status: 302, headers: { Location: location } }))
    vi.stubGlobal('fetch', upstream)
    expect((await handleRequest(request(), env())).status).toBe(502)
    expect(upstream).toHaveBeenCalledOnce()
  })

  it('bounds redirect loops and rejects successful non-image responses', async () => {
    const upstream = vi.fn(
      async () => new Response(null, { status: 302, headers: { Location: '/another.jpg' } }),
    )
    vi.stubGlobal('fetch', upstream)
    expect((await handleRequest(request(), env())).status).toBe(502)
    expect(upstream).toHaveBeenCalledTimes(6)
    upstream.mockImplementation(
      async () => new Response('<html>Not an image</html>', { headers: { 'Content-Type': 'text/html' } }),
    )
    expect((await handleRequest(request(), env())).status).toBe(502)
  })

  it('returns a structured error for network failures and rejects non-GET requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Offline')))
    const response = await handleRequest(request(), env())
    expect(response.status).toBe(502)
    expect(await response.json()).toMatchObject({ code: 'PROXY_NETWORK_ERROR' })
    expect((await handleRequest(new Request(request(), { method: 'POST' }), env())).status).toBe(405)
  })

  it('returns a structured HTTP 504 on upstream timeout', async () => {
    const timeout = new AbortController()
    const spy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal)
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
          timeout.abort(new DOMException('Timeout', 'TimeoutError'))
          init?.signal?.throwIfAborted()
          return new Response()
        }),
      )
      const response = await handleRequest(request(), env())
      expect(response.status).toBe(504)
      const body = await response.text()
      expect(body).toContain('PROXY_TIMEOUT')
    } finally {
      spy.mockRestore()
    }
  })
})
