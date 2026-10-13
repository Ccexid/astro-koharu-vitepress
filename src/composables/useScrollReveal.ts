import { nextTick, onMounted, onUnmounted, watch, type Ref, type WatchSource } from 'vue'

const reducedMotionPreference = '(prefers-reduced-motion: reduce)'

export function useScrollReveal(container: Readonly<Ref<HTMLElement | null>>, items: WatchSource<unknown>) {
  const revealed = new WeakSet<HTMLElement>()
  let observer: IntersectionObserver | undefined
  let motionQuery: MediaQueryList | undefined

  function clearRevealState(markAsRevealed: boolean) {
    container.value?.querySelectorAll<HTMLElement>('.post-card').forEach((card) => {
      card.removeAttribute('data-reveal')
      card.style.removeProperty('--reveal-delay')
      if (markAsRevealed) revealed.add(card)
    })
  }

  function handleIntersection(entries: IntersectionObserverEntry[]) {
    const entering = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)

    entering.forEach((entry, index) => {
      const card = entry.target as HTMLElement
      observer?.unobserve(card)
      if (revealed.has(card)) return

      revealed.add(card)
      card.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 70}ms`)
      card.dataset.reveal = 'in'
    })
  }

  function handleAnimationEnd(event: AnimationEvent) {
    const card = event.target
    if (
      card instanceof HTMLElement &&
      event.animationName === 'post-card-reveal' &&
      card.dataset.reveal === 'in'
    ) {
      card.removeAttribute('data-reveal')
      card.style.removeProperty('--reveal-delay')
    }
  }

  async function refresh() {
    await nextTick()
    observer?.disconnect()
    observer = undefined

    const cards = container.value?.querySelectorAll<HTMLElement>('.post-card')
    if (!cards) return

    if (motionQuery?.matches || !('IntersectionObserver' in window)) {
      clearRevealState(true)
      return
    }

    observer = new IntersectionObserver(handleIntersection)
    cards.forEach((card) => {
      if (revealed.has(card)) return
      if (card.dataset.reveal === 'in') {
        revealed.add(card)
        return
      }

      if (card.getBoundingClientRect().top < window.innerHeight) {
        revealed.add(card)
        card.removeAttribute('data-reveal')
        return
      }

      card.dataset.reveal = 'pending'
      observer?.observe(card)
    })
  }

  function handleMotionPreferenceChange() {
    void refresh()
  }

  onMounted(() => {
    motionQuery = window.matchMedia(reducedMotionPreference)
    motionQuery.addEventListener('change', handleMotionPreferenceChange)
    container.value?.addEventListener('animationend', handleAnimationEnd)
    void refresh()
  })

  watch(items, () => void refresh(), { flush: 'post' })
  watch(
    container,
    (current, previous) => {
      previous?.removeEventListener('animationend', handleAnimationEnd)
      current?.addEventListener('animationend', handleAnimationEnd)
      void refresh()
    },
    { flush: 'post' },
  )

  onUnmounted(() => {
    observer?.disconnect()
    motionQuery?.removeEventListener('change', handleMotionPreferenceChange)
    container.value?.removeEventListener('animationend', handleAnimationEnd)
  })
}
