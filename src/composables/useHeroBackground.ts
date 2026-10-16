import { computed, onMounted, onScopeDispose, shallowRef, type Ref } from 'vue'
import { getHeroImage, HERO_IMAGE_INTERVAL } from '@/services/hero-image'

export const defaultHeroImage =
  'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1920&q=85'

export function useHeroBackground(fallback: Readonly<Ref<string | undefined>>) {
  const randomImage = shallowRef('')
  const failed = shallowRef(false)
  const src = computed(() =>
    !failed.value && randomImage.value ? randomImage.value : fallback.value || defaultHeroImage,
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  async function refresh() {
    let refreshAt = Date.now() + HERO_IMAGE_INTERVAL
    try {
      const result = await getHeroImage()
      if (disposed) return
      refreshAt = result.refreshAt
      if (result.blob) {
        const previous = randomImage.value
        randomImage.value = URL.createObjectURL(result.blob)
        failed.value = false
        if (previous) URL.revokeObjectURL(previous)
      }
    } catch {
      // An unavailable browser cache must never blank the existing Hero cover.
    } finally {
      if (!disposed) timer = setTimeout(() => void refresh(), Math.max(1000, refreshAt - Date.now()))
    }
  }

  function handleError() {
    failed.value = true
  }

  onMounted(() => {
    void refresh()
  })
  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
    if (randomImage.value) URL.revokeObjectURL(randomImage.value)
  })

  return { src, handleError }
}
