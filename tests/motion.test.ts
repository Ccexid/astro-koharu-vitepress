import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, defineComponent, h, nextTick, ref } from 'vue'
import { useHeroMotion } from '../src/composables/useHeroMotion'
import { cancelViewTransition, startViewTransition, transitionKind } from '../src/app/view-transitions'

function browser() {
  const query = Object.assign(new EventTarget(), { matches: false })
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    documentElement: { classList: { add: vi.fn(), remove: vi.fn() } },
  })
  vi.stubGlobal('window', { matchMedia: () => query })
  vi.stubGlobal('document', document)
  vi.stubGlobal('navigator', { hardwareConcurrency: 8 })
  return { query, document }
}

function mountHero(complete = false) {
  const cancel = vi.fn()
  const image = Object.assign(new EventTarget(), {
    complete,
    naturalWidth: 100,
    animate: vi.fn(() => ({ cancel })),
  })
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
  const app = renderer.createApp(
    defineComponent({
      setup() {
        useHeroMotion(ref(null), ref(image as unknown as HTMLImageElement))
        return () => h('div')
      },
    }),
  )
  app.mount({})
  return { app, image, cancel }
}

afterEach(() => {
  cancelViewTransition()
  vi.unstubAllGlobals()
})

describe('hero motion lifecycle', () => {
  it('settles an uncached image once and cancels it when the motion preference changes', () => {
    const { query } = browser()
    const { app, image, cancel } = mountHero()
    image.dispatchEvent(new Event('load'))
    expect(image.animate).toHaveBeenCalledOnce()
    query.matches = true
    query.dispatchEvent(new Event('change'))
    expect(cancel).toHaveBeenCalledOnce()
    app.unmount()
  })

  it('leaves a cached image still and removes a pending load listener on unmount', () => {
    browser()
    const cached = mountHero(true)
    cached.image.dispatchEvent(new Event('load'))
    expect(cached.image.animate).not.toHaveBeenCalled()
    cached.app.unmount()
    const pending = mountHero()
    pending.app.unmount()
    pending.image.dispatchEvent(new Event('load'))
    expect(pending.image.animate).not.toHaveBeenCalled()
  })
})

describe('shared View Transition ownership', () => {
  it('cancels the old transition without letting its late completion clear the new one', async () => {
    const { document, query } = browser()
    const transitions: Array<{ skipTransition: ReturnType<typeof vi.fn>; finish: () => void }> = []
    Object.assign(document, {
      startViewTransition: (update: () => void) => {
        const skipTransition = vi.fn()
        let finish!: () => void
        const finished = new Promise<void>((resolve) => {
          finish = resolve
        })
        transitions.push({ skipTransition, finish })
        update()
        return { finished, skipTransition }
      },
    })
    const cleanup = vi.fn()
    startViewTransition('route', vi.fn(), cleanup)
    startViewTransition('theme', vi.fn())
    expect(transitions[0]?.skipTransition).toHaveBeenCalledOnce()
    expect(cleanup).toHaveBeenCalledOnce()
    transitions[0]?.finish()
    await nextTick()
    expect(transitionKind.value).toBe('theme')
    query.matches = true
    query.dispatchEvent(new Event('change'))
    expect(transitions[1]?.skipTransition).toHaveBeenCalledOnce()
    expect(transitionKind.value).toBeNull()
  })

  it('updates directly without snapshots when reduced motion is enabled', () => {
    const { query, document } = browser()
    query.matches = true
    const start = vi.fn()
    Object.assign(document, { startViewTransition: start })
    const update = vi.fn()
    startViewTransition('route', update)
    expect(update).toHaveBeenCalledOnce()
    expect(start).not.toHaveBeenCalled()
  })
})
