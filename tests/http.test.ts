import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosInstance, get, post } from '../src/api/http'
import { useFetchAxiosAdapter } from './helpers/fetch-axios-adapter'

useFetchAxiosAdapter()
afterEach(() => vi.unstubAllGlobals())

describe('shared Axios methods', () => {
  it('omits credentials and automatic XSRF headers by default', () => {
    expect(axiosInstance.defaults.withCredentials).toBe(false)
    expect(axiosInstance.defaults.withXSRFToken).toBe(false)
  })

  it('sends a GET request without credentials and returns the response data', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('GET')
      expect(init?.credentials).toBe('omit')
      expect(init?.cache).toBe('no-store')
      expect(init?.signal).toBeInstanceOf(AbortSignal)
      return Response.json({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(get<{ ok: boolean }>('/items', { fetchOptions: { cache: 'no-store' } })).resolves.toEqual({
      ok: true,
    })
  })

  it('sends POST data and custom headers', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST')
      expect(init?.body).toBe('{"name":"Koharu"}')
      expect(new Headers(init?.headers).get('content-type')).toContain('application/json')
      return Response.json({ id: 1 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(post<{ id: number }, { name: string }>('/items', { name: 'Koharu' })).resolves.toEqual({
      id: 1,
    })
  })

  it('preserves cancellation and provider-specific HTTP and JSON errors', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        controller.abort()
        init?.signal?.throwIfAborted()
        return Response.json({})
      }),
    )
    await expect(get('/items', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('', { status: 503 }))
        .mockResolvedValueOnce(new Response('{invalid', { headers: { 'content-type': 'application/json' } })),
    )
    await expect(get('/items', { serviceName: 'Bangumi' })).rejects.toThrow('Bangumi暂时无法读取（HTTP 503）')
    await expect(get('/items', { serviceName: '哔哩哔哩' })).rejects.toThrow('哔哩哔哩返回了无法识别的数据。')
  })
})
