import { computed, onMounted, onScopeDispose, shallowRef } from 'vue'
import { fetchSaying } from '@/api/saying'

const characterDelay = 80
const nextSayingDelay = 8_000

function splitCharacters(text: string): string[] {
  if (typeof Intl.Segmenter === 'undefined') return Array.from(text)
  return Array.from(
    new Intl.Segmenter('zh-CN', { granularity: 'grapheme' }).segment(text),
    (item) => item.segment,
  )
}

export function useSayingTypewriter(fallback: string) {
  const text = shallowRef(fallback)
  const characters = computed(() => splitCharacters(text.value))
  const visibleCount = shallowRef(splitCharacters(fallback).length)
  const typing = shallowRef(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let motionQuery: MediaQueryList | undefined
  let disposed = false

  function finish() {
    clearTimeout(timer)
    visibleCount.value = characters.value.length
    typing.value = false
    timer = setTimeout(() => void load(), nextSayingDelay)
  }

  function typeNext() {
    visibleCount.value++
    if (visibleCount.value >= characters.value.length) finish()
    else timer = setTimeout(typeNext, characterDelay)
  }

  async function load() {
    controller = new AbortController()
    try {
      const saying = await fetchSaying(controller.signal)
      if (disposed) return
      text.value = saying.text
      if (motionQuery?.matches) {
        finish()
      } else {
        visibleCount.value = 0
        typing.value = true
        timer = setTimeout(typeNext, characterDelay)
      }
    } catch {
      // Retain the current sentence (or initial fallback) and retry without overlapping requests.
      if (!disposed) finish()
    }
  }

  function updateMotion() {
    if (motionQuery?.matches && typing.value) finish()
  }

  onMounted(() => {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', updateMotion)
    void load()
  })

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
    controller?.abort()
    motionQuery?.removeEventListener('change', updateMotion)
  })

  return { text, characters, visibleCount, typing }
}
