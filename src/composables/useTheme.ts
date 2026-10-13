import { nextTick, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const storageKey = 'koharu-theme'
const reducedMotionPreference = '(prefers-reduced-motion: reduce)'

type ThemeViewTransition = {
  finished: Promise<void>
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ThemeViewTransition
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const savedTheme = window.localStorage.getItem(storageKey)
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const theme = ref<Theme>(getInitialTheme())

  watch(
    theme,
    (value) => {
      document.documentElement.dataset.theme = value
      window.localStorage.setItem(storageKey, value)
    },
    { flush: 'sync', immediate: true },
  )

  function toggleTheme(origin?: HTMLElement) {
    const nextTheme = theme.value === 'light' ? 'dark' : 'light'
    const root = document.documentElement
    const viewTransitionDocument = document as DocumentWithViewTransition

    if (
      !origin ||
      window.matchMedia(reducedMotionPreference).matches ||
      !viewTransitionDocument.startViewTransition
    ) {
      theme.value = nextTheme
      return
    }

    const rect = origin.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    root.style.setProperty('--theme-x', `${x}px`)
    root.style.setProperty('--theme-y', `${y}px`)
    root.style.setProperty('--theme-r', `${radius}px`)
    root.classList.add('theme-transition')

    try {
      const transition = viewTransitionDocument.startViewTransition(async () => {
        theme.value = nextTheme
        await nextTick()
      })
      const cleanup = () => root.classList.remove('theme-transition')
      void transition.finished.then(cleanup, cleanup)
    } catch {
      root.classList.remove('theme-transition')
      theme.value = nextTheme
    }
  }

  return { theme, toggleTheme }
}
