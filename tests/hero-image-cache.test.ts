import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRandomImage, RandomImageError } from '../src/api/random-image'

vi.mock('../src/api/random-image', async (original) => ({
  ...(await original<typeof import('../src/api/random-image')>()),
  fetchRandomImage: vi.fn(),
}))
const fetchMock = vi.mocked(fetchRandomImage)
const interval = 12 * 60 * 60 * 1000

function browserStorage() {
  const images = new Map<string, Response>()
  const settings = new Map<string, string>()
  const cache = {
    match: vi.fn(async (key: string) => images.get(key)?.clone()),
    put: vi.fn(async (key: string, response: Response) => {
      images.set(key, response.clone())
    }),
  }
  vi.stubGlobal('window', {
    location: { origin: 'https://blog.example' },
    caches: { open: vi.fn(async () => cache) },
    localStorage: {
      getItem: (key: string) => settings.get(key) || null,
      setItem: (key: string, value: string) => settings.set(key, value),
    },
  })
  let queue = Promise.resolve()
  vi.stubGlobal('navigator', {
    locks: {
      request: vi.fn((_name: string, load: () => Promise<unknown>) => {
        const result = queue.then(load)
        queue = result.then(
          () => undefined,
          () => undefined,
        )
        return result
      }),
    },
  })
  return { images, settings, cache }
}

async function reloadModule() {
  vi.resetModules()
  return import('../src/services/hero-image')
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-16T00:00:00Z'))
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Blob(['first image'], { type: 'image/jpeg' }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('12-hour same-browser Hero image cache', () => {
  it('shares simultaneous requests and persists image bytes for refreshes', async () => {
    const { cache } = browserStorage()
    const { getHeroImage } = await reloadModule()
    const [first, second] = await Promise.all([getHeroImage(), getHeroImage()])
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith({ category: 'acg', type: 'pc' })
    expect(first.refreshAt).toBe(Date.now() + interval)
    expect(first.blob).toBe(second.blob)
    expect(cache.put).toHaveBeenCalledOnce()
    const reloaded = await reloadModule()
    expect(await (await reloaded.getHeroImage()).blob?.text()).toBe('first image')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('requests the next image only at the 12-hour boundary', async () => {
    browserStorage()
    const { getHeroImage } = await reloadModule()
    const first = await getHeroImage()
    vi.setSystemTime(first.refreshAt - 1)
    await getHeroImage()
    expect(fetchMock).toHaveBeenCalledOnce()
    vi.setSystemTime(first.refreshAt)
    fetchMock.mockResolvedValueOnce(new Blob(['second image'], { type: 'image/jpeg' }))
    expect(await (await getHeroImage()).blob?.text()).toBe('second image')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retains stale image data and enforces the cooldown after a failed refresh', async () => {
    browserStorage()
    const { getHeroImage } = await reloadModule()
    const first = await getHeroImage()
    vi.setSystemTime(first.refreshAt)
    fetchMock.mockRejectedValueOnce(new Error('Offline'))
    const failed = await getHeroImage()
    expect(await failed.blob?.text()).toBe('first image')
    expect(failed.refreshAt).toBe(Date.now() + interval)
    const reloaded = await reloadModule()
    expect(await (await reloaded.getHeroImage()).blob?.text()).toBe('first image')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('persists a failed first attempt and does not retry on every page reload', async () => {
    browserStorage()
    fetchMock.mockRejectedValueOnce(new Error('Network unavailable'))
    const { getHeroImage } = await reloadModule()
    const first = await getHeroImage()
    expect(first.blob).toBeNull()
    const reloaded = await reloadModule()
    expect((await reloaded.getHeroImage()).blob).toBeNull()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('shares the request limit across tabs through Web Locks and persistent storage', async () => {
    browserStorage()
    const tabOne = await reloadModule()
    const tabTwo = await reloadModule()
    await Promise.all([tabOne.getHeroImage(), tabTwo.getHeroImage()])
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('honors a longer upstream Retry-After and survives unavailable Cache Storage', async () => {
    const { cache } = browserStorage()
    cache.match.mockRejectedValue(new Error('Storage unavailable'))
    fetchMock.mockRejectedValueOnce(new RandomImageError('限流', 429, 'RATE_LIMIT_EXCEEDED', interval * 2))
    const { getHeroImage } = await reloadModule()
    const result = await getHeroImage()
    expect(result.refreshAt).toBe(Date.now() + interval * 2)
    const reloaded = await reloadModule()
    await reloaded.getHeroImage()
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
