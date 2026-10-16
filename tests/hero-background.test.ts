import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, defineComponent, h, ref } from 'vue'
import { getHeroImage, HERO_IMAGE_INTERVAL } from '../src/services/hero-image'
import { defaultHeroImage, useHeroBackground } from '../src/composables/useHeroBackground'

vi.mock('../src/services/hero-image', () => ({
  getHeroImage: vi.fn(),
  HERO_IMAGE_INTERVAL: 12 * 60 * 60 * 1000,
}))
const imageMock = vi.mocked(getHeroImage)
const apps: Array<{ unmount: () => void }> = []

function mount() {
  const renderer = createRenderer({
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    insert: vi.fn(),
    remove: vi.fn(),
    setText: vi.fn(),
    setElementText: vi.fn(),
    patchProp: vi.fn(),
    parentNode: () => null,
    nextSibling: () => null,
  })
  const cover = ref<string | undefined>()
  let state!: ReturnType<typeof useHeroBackground>
  const app = renderer.createApp(
    defineComponent({
      setup() {
        state = useHeroBackground(cover)
        return () => h('img')
      },
    }),
  )
  app.mount({})
  apps.push(app)
  return { app, state, cover }
}

beforeEach(() => {
  vi.useFakeTimers()
  imageMock.mockReset()
  imageMock.mockImplementation(async () => ({
    blob: new Blob(['image'], { type: 'image/jpeg' }),
    refreshAt: Date.now() + HERO_IMAGE_INTERVAL,
  }))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:hero-image')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
afterEach(() => {
  apps.splice(0).forEach((app) => app.unmount())
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Hero background lifecycle', () => {
  it('replaces the fallback with a cached image and only refreshes when due', async () => {
    const { state } = mount()
    expect(state.src.value).toBe(defaultHeroImage)
    await vi.advanceTimersByTimeAsync(0)
    expect(state.src.value).toBe('blob:hero-image')
    await vi.advanceTimersByTimeAsync(HERO_IMAGE_INTERVAL - 1)
    expect(imageMock).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(imageMock).toHaveBeenCalledTimes(2)
  })

  it('keeps the original cover if the random image is unavailable or cannot decode', async () => {
    const { state, cover } = mount()
    cover.value = 'https://images.example/article.jpg'
    await vi.advanceTimersByTimeAsync(0)
    state.handleError()
    expect(state.src.value).toBe(cover.value)
  })

  it('cleans up object URLs and the refresh timer on unmount', async () => {
    const { app } = mount()
    await vi.advanceTimersByTimeAsync(0)
    apps.splice(apps.indexOf(app), 1)
    app.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:hero-image')
    await vi.advanceTimersByTimeAsync(HERO_IMAGE_INTERVAL * 2)
    expect(imageMock).toHaveBeenCalledOnce()
  })

  it('does not allocate object URLs when a delayed response arrives after unmount', async () => {
    let resolve!: (result: { blob: Blob; refreshAt: number }) => void
    imageMock.mockImplementationOnce(
      () =>
        new Promise((complete) => {
          resolve = complete
        }),
    )
    const { app } = mount()
    apps.splice(apps.indexOf(app), 1)
    app.unmount()
    resolve({ blob: new Blob(['late']), refreshAt: Date.now() + HERO_IMAGE_INTERVAL })
    await vi.advanceTimersByTimeAsync(0)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
