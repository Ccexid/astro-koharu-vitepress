import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleRequest } from '../cloudflare/worker'

afterEach(() => vi.unstubAllGlobals())

const assets = () => ({ ASSETS: { fetch: vi.fn(async () => new Response('SPA')) } })

describe('Cloudflare production API forwarding', () => {
  it('forwards the Bilibili path and query without browser cookies or origin headers', async () => {
    const upstream = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response('{"code":0}', {
          headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'private=1' },
        }),
    )
    vi.stubGlobal('fetch', upstream)
    const env = assets()
    const response = await handleRequest(
      new Request('https://blog.example/bili/x/space/bangumi/follow/list?vmid=19580033&type=1&ps=30', {
        headers: { Cookie: 'visitor=private', Origin: 'https://blog.example', Authorization: 'secret' },
      }),
      env,
    )
    expect(String(upstream.mock.calls[0]?.[0])).toBe(
      'https://api.bilibili.com/x/space/bangumi/follow/list?vmid=19580033&type=1&ps=30',
    )
    const init = upstream.mock.calls[0]?.[1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('referer')).toBe('https://www.bilibili.com/')
    expect(headers.has('cookie')).toBe(false)
    expect(headers.has('origin')).toBe(false)
    expect(headers.has('authorization')).toBe(false)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(await response.json()).toEqual({ code: 0 })
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('strips exactly the /uapi prefix and preserves upstream failures', async () => {
    const upstream = vi.fn(
      async (_input: RequestInfo | URL) => new Response('{"code":"ERROR"}', { status: 403 }),
    )
    vi.stubGlobal('fetch', upstream)
    const response = await handleRequest(
      new Request('https://blog.example/uapi/api/v1/social/bilibili/userinfo?uid=19580033'),
      assets(),
    )
    expect(String(upstream.mock.calls[0]?.[0])).toBe(
      'https://uapis.cn/api/v1/social/bilibili/userinfo?uid=19580033',
    )
    expect(response.status).toBe(403)
  })

  it('serves page and asset requests through the static binding', async () => {
    const env = assets()
    for (const path of ['/', '/posts/a-note-for-spring', '/assets/example.js', '/bilibilis']) {
      const request = new Request(`https://blog.example${path}`)
      expect(await (await handleRequest(request, env)).text()).toBe('SPA')
      expect(env.ASSETS.fetch).toHaveBeenLastCalledWith(request)
    }
  })

  it('rejects unsupported methods and routes and never follows upstream redirects', async () => {
    const upstream = vi.fn(
      async () => new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example' } }),
    )
    vi.stubGlobal('fetch', upstream)
    expect(
      (
        await handleRequest(
          new Request('https://blog.example/bili/x/space/bangumi/follow/list', { method: 'POST' }),
          assets(),
        )
      ).status,
    ).toBe(405)
    expect((await handleRequest(new Request('https://blog.example/bili/x/other'), assets())).status).toBe(404)
    expect(
      (await handleRequest(new Request('https://blog.example/uapi//elsewhere.example'), assets())).status,
    ).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
    expect(
      (await handleRequest(new Request('https://blog.example/bili/x/space/bangumi/follow/list'), assets()))
        .status,
    ).toBe(502)
    expect(upstream).toHaveBeenCalledOnce()
  })

  it('returns API errors instead of the SPA when an upstream is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')))
    const response = await handleRequest(
      new Request('https://blog.example/bili/x/space/bangumi/follow/list'),
      assets(),
    )
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: '上游接口暂时无法连接。' })
  })
})
