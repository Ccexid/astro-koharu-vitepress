import { inject, onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'
import { siteCoverKey, type SiteCover } from '@/app/site-cover'

export function usePageCover(source: MaybeRefOrGetter<SiteCover | null>): void {
  const controller = inject(siteCoverKey, null)
  const route = useRoute()

  if (!controller) return

  const owner = route.fullPath
  const stop = watch(
    () => toValue(source),
    (cover) => {
      if (cover) controller.set(owner, cover)
    },
    { immediate: true, deep: true, flush: 'sync' },
  )

  onScopeDispose(() => {
    stop()
    controller.clear(owner)
  })
}
