import { onMounted, onScopeDispose, ref, watch, type Ref } from 'vue'

export function useHeroMotion(hero: Ref<HTMLElement | null>, image: Ref<HTMLImageElement | null>) {
  const paused = ref(false)
  const lowPower = ref(false)
  let observer: IntersectionObserver | undefined
  let query: MediaQueryList | undefined
  let settle: Animation | undefined
  let pendingImage: HTMLImageElement | null = null
  let visible = true

  function cancelSettle() {
    settle?.cancel()
    settle = undefined
    pendingImage?.removeEventListener('load', settleImage)
    pendingImage = null
  }

  function settleImage() {
    const target = pendingImage
    pendingImage = null
    if (!target || query?.matches || !target.naturalWidth || !target.animate) return
    settle = target.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], {
      duration: 1800,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    })
  }

  function prepareImage() {
    cancelSettle()
    if (!image.value || image.value.complete || query?.matches) return
    pendingImage = image.value
    pendingImage.addEventListener('load', settleImage, { once: true })
  }

  function updatePause() {
    paused.value = !visible || document.hidden || !!query?.matches
    if (query?.matches) cancelSettle()
  }

  onMounted(() => {
    query = window.matchMedia('(prefers-reduced-motion: reduce)')
    query.addEventListener('change', updatePause)
    document.addEventListener('visibilitychange', updatePause)
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    lowPower.value =
      !!device.connection?.saveData ||
      (device.deviceMemory ?? 8) <= 4 ||
      (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
    if ('IntersectionObserver' in window && hero.value) {
      observer = new IntersectionObserver(([entry]) => {
        visible = !!entry?.isIntersecting
        updatePause()
      })
      observer.observe(hero.value)
    }
    updatePause()
    prepareImage()
  })
  watch(image, prepareImage, { flush: 'post' })
  onScopeDispose(() => {
    cancelSettle()
    observer?.disconnect()
    query?.removeEventListener('change', updatePause)
    document.removeEventListener('visibilitychange', updatePause)
  })
  return { paused, lowPower }
}
