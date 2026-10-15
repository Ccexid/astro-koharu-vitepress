import { nextTick, shallowRef } from 'vue'
import type { Router } from 'vue-router'
import { canTransition, cancelViewTransition, startViewTransition } from '@/app/view-transitions'

export const transitioningPost = shallowRef<string | null>(null)
let destination: string | undefined
let ready: (() => void) | undefined

export function articleTransitionReady(slug: string) {
  if (transitioningPost.value === slug) ready?.()
}

export function cancelPostTransition(path: string) {
  if (destination && destination !== path) cancelViewTransition()
}

export function usePostTransition(router: Router) {
  return function navigate(event: MouseEvent, slug: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !canTransition()
    )
      return
    const link = event.currentTarget as HTMLElement
    const title = link.closest('.post-card')?.querySelector<HTMLElement>('.post-title a')
    if (!title) return
    event.preventDefault()
    cancelViewTransition()
    destination = `/posts/${slug}`
    transitioningPost.value = slug
    title.style.viewTransitionName = 'article-title'
    let timeout: ReturnType<typeof setTimeout> | undefined
    const loaded = new Promise<void>((resolve) => {
      ready = resolve
      // An unavailable or delayed article must never hold navigation snapshots open indefinitely.
      timeout = setTimeout(resolve, 1000)
    })
    startViewTransition(
      'route',
      async () => {
        const failure = await router.push(`/posts/${slug}`)
        if (!failure) await loaded
        await nextTick()
      },
      () => {
        title.style.removeProperty('view-transition-name')
        ready?.()
        ready = undefined
        clearTimeout(timeout)
        transitioningPost.value = null
        destination = undefined
      },
    )
  }
}
