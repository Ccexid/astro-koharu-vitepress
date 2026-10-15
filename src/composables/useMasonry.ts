import { nextTick, onMounted, onScopeDispose, watch, type Ref } from 'vue'
// One DOM sequence and stable row placement: appending does not rebalance older cards.
export function useMasonry(root: Ref<HTMLElement | null>, items: Ref<unknown>) {
  let observer: ResizeObserver | undefined
  function measure(element: HTMLElement) {
    const parent = element.parentElement
    if (parent) parent.style.gridRowEnd = 'span ' + Math.ceil(element.getBoundingClientRect().height + 24)
  }
  async function connect() {
    await nextTick()
    observer?.disconnect()
    root.value?.querySelectorAll<HTMLElement>('.masonry-content').forEach((element) => {
      measure(element)
      observer?.observe(element)
    })
  }
  onMounted(() => {
    observer = new ResizeObserver((entries) =>
      entries.forEach((entry) => measure(entry.target as HTMLElement)),
    )
    void connect()
  })
  watch(items, connect, { flush: 'post' })
  onScopeDispose(() => observer?.disconnect())
}
