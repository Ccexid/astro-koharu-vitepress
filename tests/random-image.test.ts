import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRandomImageUrl, type RandomImageQuery } from '../src/api/random-image-contract'
import { fetchRandomImage, RandomImageError } from '../src/api/random-image'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('random image API', () => {
  it('uses the exact documented upstream and accepts all valid category/subcategory combinations', () => {
    expect(createRandomImageUrl().href).toBe('https://uapis.cn/api/v1/random/image')
    const combinations = {
      acg: ['pc', 'mb'],
      bq: ['eciyuan', 'ikun', 'xiongmao', 'waiguoren', 'maomao'],
      furry: ['z4k', 'szs8k', 's4k', '4k'],
      landscape: [],
      anime: [],
      pc_wallpaper: [],
      mobile_wallpaper: [],
      general_anime: [],
      ai_drawing: [],
    }
    for (const [category, types] of Object.entries(combinations)) {
      for (const type of [undefined, ...types]) {
        const url = createRandomImageUrl({ category, type } as RandomImageQuery)
        expect(url.searchParams.get('category')).toBe(category)
        expect(url.searchParams.get('type')).toBe(type ?? null)
      }
    }
  })

  it.each([
    { type: 'pc' },
    { category: 'acg', type: '4k' },
    { category: 'anime', type: 'pc' },
    { category: 'landscape', type: 'pc' },
    { category: 'unknown' },
  ])('rejects invalid parameters before issuing a request: %j', async (query) => {
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    await expect(fetchRandomImage(query as RandomImageQuery)).rejects.toBeInstanceOf(RangeError)
    expect(request).not.toHaveBeenCalled()
  })

  it('returns binary image data and sends no credentials or key from the browser', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
    const request = vi.fn(async () => new Response(bytes, { headers: { 'Content-Type': 'image/jpeg' } }))
    vi.stubGlobal('fetch', request)
    const image = await fetchRandomImage({ category: 'acg', type: 'pc' })
    expect(image.type).toBe('image/jpeg')
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(bytes)
    expect(request).toHaveBeenCalledWith(
      '/uapi/api/v1/random/image?category=acg&type=pc',
      expect.objectContaining({ method: 'GET', credentials: 'omit', headers: { Accept: 'image/*' } }),
    )
  })

  it.each([
    [404, 'NOT_FOUND'],
    [500, 'INTERNAL_SERVER_ERROR'],
    [401, 'UNAUTHORIZED'],
    [402, 'INSUFFICIENT_CREDITS'],
    [403, 'CORS_FORBIDDEN'],
  ])('preserves HTTP %i / %s and request diagnostics', async (status, code) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { code, message: '上游说明', details: { field: 'category' } },
          { status: Number(status), headers: { 'X-Request-ID': 'test-request' } },
        ),
      ),
    )
    await expect(fetchRandomImage()).rejects.toMatchObject({
      name: 'RandomImageError',
      status,
      code,
      message: '上游说明',
      details: { field: 'category' },
      requestId: 'test-request',
    })
  })

  it('honors rate-limit diagnostics without automatically issuing another billable request', async () => {
    const request = vi.fn(async () =>
      Response.json(
        { code: 'RATE_LIMIT_EXCEEDED', message: '请稍后重试' },
        { status: 429, headers: { 'Retry-After': '30' } },
      ),
    )
    vi.stubGlobal('fetch', request)
    await expect(fetchRandomImage()).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterMs: 30_000,
    })
    expect(request).toHaveBeenCalledOnce()
  })

  it('understands an HTTP date in Retry-After', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T00:00:00Z'))
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(null, { status: 429, headers: { 'Retry-After': 'Fri, 16 Oct 2026 00:01:00 GMT' } }),
      ),
    )
    await expect(fetchRandomImage()).rejects.toMatchObject({ status: 429, retryAfterMs: 60_000 })
  })

  it('handles non-JSON failures, HTML fallbacks, empty images and network errors', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response('Bad gateway', { status: 502 }))
      .mockResolvedValueOnce(new Response('<html>SPA</html>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response(null, { headers: { 'Content-Type': 'image/jpeg' } }))
      .mockRejectedValueOnce(new TypeError('Network error'))
    vi.stubGlobal('fetch', request)
    await expect(fetchRandomImage()).rejects.toMatchObject({ status: 502 })
    await expect(fetchRandomImage()).rejects.toMatchObject({ code: 'CLIENT_INVALID_IMAGE' })
    await expect(fetchRandomImage()).rejects.toMatchObject({ code: 'CLIENT_EMPTY_IMAGE' })
    await expect(fetchRandomImage()).rejects.toBeInstanceOf(RandomImageError)
  })

  it('supports caller cancellation and validates timeout values', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        controller.abort()
        init?.signal?.throwIfAborted()
        return new Response()
      }),
    )
    await expect(fetchRandomImage({}, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
    await expect(fetchRandomImage({}, { timeoutMs: -1 })).rejects.toBeInstanceOf(RangeError)
  })

  it('reports request timeouts separately from network errors', async () => {
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
      await expect(fetchRandomImage()).rejects.toMatchObject({ code: 'CLIENT_TIMEOUT', status: 0 })
    } finally {
      spy.mockRestore()
    }
  })
})
