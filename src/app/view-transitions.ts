import { shallowRef } from 'vue'

type ManagedTransition = { finished: Promise<void>; skipTransition?: () => void }
type TransitionDocument = { startViewTransition?: (update: () => void | Promise<void>) => ManagedTransition }
export const transitionKind = shallowRef<'route' | 'theme' | null>(null)
let active: { transition?: ManagedTransition; cleanup: () => void } | undefined

export function cancelViewTransition() {
  const previous = active
  active = undefined
  previous?.transition?.skipTransition?.()
  previous?.cleanup()
  transitionKind.value = null
}

export function canTransition() {
  return (
    !!(document as TransitionDocument).startViewTransition &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function startViewTransition(
  kind: 'route' | 'theme',
  update: () => void | Promise<void>,
  cleanup = () => {},
) {
  cancelViewTransition()
  if (!canTransition()) {
    void update()
    cleanup()
    return
  }
  const root = document.documentElement
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  root.classList.add(`${kind}-transition`)
  transitionKind.value = kind
  const current = {
    transition: undefined as ManagedTransition | undefined,
    cleanup: () => {
      query.removeEventListener?.('change', cancelViewTransition)
      root.classList.remove(`${kind}-transition`)
      cleanup()
    },
  }
  active = current
  query.addEventListener?.('change', cancelViewTransition)
  try {
    current.transition = (document as TransitionDocument).startViewTransition!(update)
    const finish = () => {
      if (active !== current) return
      active = undefined
      current.cleanup()
      transitionKind.value = null
    }
    void current.transition.finished.then(finish, finish)
  } catch {
    cancelViewTransition()
    void update()
  }
}
