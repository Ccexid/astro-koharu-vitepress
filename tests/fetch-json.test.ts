import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from '../src/api/fetch-json'

afterEach(() => vi.unstubAllGlobals())

describe('fetchJson', () => {
  it('returns JSON and forwards request options with a timeout signal', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST')
      expect(init?.headers).toEqual({ 'content-type': 'application/json' })
      expect(init?.signal).toBeInstanceOf(AbortSignal)
      return Response.json({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchJson<{ ok: boolean }>('https://api.example.test/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        timeoutMs: 5000,
      }),
    ).resolves.toEqual({ ok: true })
  })

  it('combines caller cancellation with its timeout signal', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).not.toBe(controller.signal)
      controller.abort()
      init?.signal?.throwIfAborted()
      return Response.json({})
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchJson('https://api.example.test/items', { signal: controller.signal }),
    ).rejects.toMatchObject({
      name: 'AbortError',
    })
  })

  it('reports provider-specific HTTP and JSON errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('{invalid', { headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchJson('https://api.example.test/items', { serviceName: 'Bangumi' })).rejects.toThrow(
      'Bangumi暂时无法读取（HTTP 503）',
    )
    await expect(fetchJson('https://api.example.test/items', { serviceName: '哔哩哔哩' })).rejects.toThrow(
      '哔哩哔哩返回了无法识别的数据。',
    )
  })
})
