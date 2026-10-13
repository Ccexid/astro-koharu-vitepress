import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const storageKey = 'koharu-theme'

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
    { immediate: true },
  )

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, toggleTheme }
}
