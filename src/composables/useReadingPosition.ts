import { nextTick, onMounted, onScopeDispose, ref, watch, type Ref } from 'vue'
import type { SiteCover } from '@/app/site-cover'
export function useReadingPosition(cover: Ref<SiteCover>) {
  const activeId = ref('')
  const progress = ref(0)
  const scrolled = ref(false)
  const headerHidden = ref(false)
  let previousY = 0
  let frame = 0
  function update() {
    frame = 0
    const y = window.scrollY
    scrolled.value = y > 32
    if (Math.abs(y - previousY) > 5) headerHidden.value = y > previousY && y > 320
    previousY = y
    const sections = cover.value.sections || []
    let current = sections[0]?.id || ''
    for (const section of sections) {
      const element = document.getElementById(section.id)
      if (element && element.getBoundingClientRect().top <= 150) current = section.id
    }
    activeId.value = current
    const article = document.querySelector<HTMLElement>('.article-body')
    if (article) {
      const rect = article.getBoundingClientRect()
      progress.value = Math.round(Math.min(1, Math.max(0, (150 - rect.top) / Math.max(1, rect.height))) * 100)
    } else progress.value = 0
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update)
  }
  onMounted(() => {
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  })
  watch(cover, async () => {
    await nextTick()
    schedule()
  })
  onScopeDispose(() => {
    cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })
  return { activeId, progress, scrolled, headerHidden }
}
