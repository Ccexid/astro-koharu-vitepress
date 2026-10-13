import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '../src/composables/useTheme'

function installBrowser(
  options: { reducedMotion?: boolean; supportsViewTransitions?: boolean } = {},
) {
  const classes = new Set<string>()
  const root = {
    dataset: {} as Record<string, string>,
    style: { setProperty: vi.fn() },
    classList: {
      add: vi.fn((name: string) => classes.add(name)),
      remove: vi.fn((name: string) => classes.delete(name)),
      contains: (name: string) => classes.has(name),
    },
  }
  const localStorage = {
    getItem: vi.fn(() => 'light'),
    setItem: vi.fn(),
  }
  const startViewTransition = vi.fn((callback: () => void | Promise<void>) => ({
    finished: Promise.resolve()
      .then(callback)
      .then(() => undefined),
  }))
  const browserDocument = {
    documentElement: root,
    ...(options.supportsViewTransitions === false ? {} : { startViewTransition }),
  }

  vi.stubGlobal('document', browserDocument)
  vi.stubGlobal('window', {
    innerWidth: 1000,
    innerHeight: 800,
    localStorage,
    matchMedia: vi.fn(() => ({ matches: options.reducedMotion ?? false })),
  })

  return { classes, localStorage, root, startViewTransition }
}

afterEach(() => vi.unstubAllGlobals())

describe('useTheme', () => {
  it('applies the theme immediately when reduced motion is requested', () => {
    const browser = installBrowser({ reducedMotion: true })
    const { theme, toggleTheme } = useTheme()

    toggleTheme()

    expect(theme.value).toBe('dark')
    expect(browser.root.dataset.theme).toBe('dark')
    expect(browser.localStorage.setItem).toHaveBeenLastCalledWith('koharu-theme', 'dark')
    expect(browser.startViewTransition).not.toHaveBeenCalled()
  })

  it('reveals the theme from the toggle button and removes the transition class on completion', async () => {
    const browser = installBrowser()
    const { theme, toggleTheme } = useTheme()
    const origin = {
      getBoundingClientRect: () => ({ left: 250, top: 20, width: 42, height: 42 }),
    } as HTMLElement

    toggleTheme(origin)

    expect(browser.root.style.setProperty).toHaveBeenNthCalledWith(1, '--theme-x', '271px')
    expect(browser.root.style.setProperty).toHaveBeenNthCalledWith(2, '--theme-y', '41px')
    expect(browser.root.style.setProperty).toHaveBeenNthCalledWith(
      3,
      '--theme-r',
      `${Math.hypot(729, 759)}px`,
    )
    expect(browser.root.classList.contains('theme-transition')).toBe(true)

    const transition = browser.startViewTransition.mock.results[0]?.value
    await transition?.finished
    await Promise.resolve()

    expect(theme.value).toBe('dark')
    expect(browser.root.dataset.theme).toBe('dark')
    expect(browser.root.classList.contains('theme-transition')).toBe(false)
  })

  it('falls back to a direct switch when View Transitions are unavailable', () => {
    const browser = installBrowser({ supportsViewTransitions: false })
    const { theme, toggleTheme } = useTheme()
    const origin = { getBoundingClientRect: vi.fn() } as unknown as HTMLElement

    toggleTheme(origin)

    expect(theme.value).toBe('dark')
    expect(browser.root.dataset.theme).toBe('dark')
    expect(browser.root.classList.contains('theme-transition')).toBe(false)
  })
})
