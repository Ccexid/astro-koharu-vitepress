import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSaying } from '../src/api/saying'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('saying API', () => {
  it('requests the public endpoint directly and returns a normalized saying', async () => {
    vi.stubEnv('VITE_API_UAPI_URL', '')
    const request = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ text: '  无论多么微小的邂逅，都必定有着某种意义。  ' }),
    )
    vi.stubGlobal('fetch', request)

    await expect(fetchSaying()).resolves.toEqual({ text: '无论多么微小的邂逅，都必定有着某种意义。' })
    expect(request).toHaveBeenCalledWith(
      'https://uapis.cn/api/v1/saying',
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('uses the existing UAPI base URL setting without duplicate slashes', async () => {
    vi.stubEnv('VITE_API_UAPI_URL', ' https://api.example.test/// ')
    const request = vi.fn(async () => Response.json({ text: '一句话。' }))
    vi.stubGlobal('fetch', request)
    await fetchSaying()
    expect(request).toHaveBeenCalledWith('https://api.example.test/api/v1/saying', expect.any(Object))
  })

  it.each([null, {}, [], { text: 42 }, { text: '' }, { text: '   ' }])(
    'rejects malformed saying data: %j',
    async (payload) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => Response.json(payload)),
      )
      await expect(fetchSaying()).rejects.toThrow('一言返回了无法识别的数据。')
    },
  )

  it('preserves request cancellation', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        controller.abort()
        init?.signal?.throwIfAborted()
        return Response.json({ text: '一句话。' })
      }),
    )
    await expect(fetchSaying(controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('reports rate limiting without replacing errors with fallback text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 429 })),
    )
    await expect(fetchSaying()).rejects.toThrow('一言暂时无法读取（HTTP 429）')
  })
})
