import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, defineComponent, h } from 'vue'
import { fetchSaying } from '../src/api/saying'
import { useSayingTypewriter } from '../src/composables/useSayingTypewriter'

vi.mock('../src/api/saying', () => ({ fetchSaying: vi.fn() }))
const fetchMock = vi.mocked(fetchSaying)
const mountedApps: Array<{ unmount: () => void }> = []

function mountTypewriter(reducedMotion = false) {
  const query = Object.assign(new EventTarget(), { matches: reducedMotion })
  vi.stubGlobal('window', { matchMedia: () => query })
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
  let state!: ReturnType<typeof useSayingTypewriter>
  const app = renderer.createApp(
    defineComponent({
      setup() {
        state = useSayingTypewriter('春日来信')
        return () => h('span')
      },
    }),
  )
  app.mount({})
  mountedApps.push(app)
  return { state, app, query }
}

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ text: '春风来信' })
})

afterEach(() => {
  mountedApps.splice(0).forEach((app) => app.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('homepage saying typewriter', () => {
  it('waits eight seconds after the final character before requesting the next saying', async () => {
    const { state } = mountTypewriter()
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(state.visibleCount.value).toBe(0)

    await vi.advanceTimersByTimeAsync(80)
    expect(state.visibleCount.value).toBe(1)
    expect(state.typing.value).toBe(true)
    await vi.advanceTimersByTimeAsync(240)
    expect(state.visibleCount.value).toBe(4)
    expect(state.typing.value).toBe(false)

    await vi.advanceTimersByTimeAsync(7999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps emoji graphemes intact while typing', async () => {
    fetchMock.mockResolvedValue({ text: '你好👨‍👩‍👧‍👦' })
    const { state } = mountTypewriter()
    await vi.advanceTimersByTimeAsync(240)
    expect(state.characters.value).toEqual(['你', '好', '👨‍👩‍👧‍👦'])
    expect(state.typing.value).toBe(false)
  })

  it('shows the full text immediately for reduced motion and still waits eight seconds', async () => {
    const { state } = mountTypewriter(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(state.visibleCount.value).toBe(4)
    expect(state.typing.value).toBe(false)
    await vi.advanceTimersByTimeAsync(7999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('finishes the current animation if reduced motion is enabled while typing', async () => {
    const { state, query } = mountTypewriter()
    await vi.advanceTimersByTimeAsync(80)
    query.matches = true
    query.dispatchEvent(new Event('change'))
    expect(state.visibleCount.value).toBe(4)
    expect(state.typing.value).toBe(false)
    await vi.advanceTimersByTimeAsync(8000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(state.typing.value).toBe(false)
  })

  it('retains readable text and retries after a failed request', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))
    const { state } = mountTypewriter()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.text.value).toBe('春日来信')
    expect(state.visibleCount.value).toBe(4)
    await vi.advanceTimersByTimeAsync(8000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(state.text.value).toBe('春风来信')
  })

  it.each([80, 400])(
    'cleans up timers when leaving during typing or the waiting period (%d ms)',
    async (elapsed) => {
      const { app } = mountTypewriter()
      await vi.advanceTimersByTimeAsync(elapsed)
      mountedApps.splice(mountedApps.indexOf(app), 1)
      app.unmount()
      await vi.advanceTimersByTimeAsync(20000)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('aborts a pending request and ignores responses arriving after leaving the homepage', async () => {
    let resolve!: (value: { text: string }) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((complete) => {
          resolve = complete
        }),
    )
    const { app, state } = mountTypewriter()
    const signal = fetchMock.mock.calls[0]![0]!
    mountedApps.splice(mountedApps.indexOf(app), 1)
    app.unmount()
    expect(signal.aborted).toBe(true)
    resolve({ text: '迟到的回复' })
    await vi.advanceTimersByTimeAsync(20000)
    expect(state.text.value).toBe('春日来信')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})
