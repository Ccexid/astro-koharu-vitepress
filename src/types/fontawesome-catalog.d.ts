declare module 'virtual:fontawesome-catalog' {
  import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

  export const fontAwesomeCatalog: Record<
    'fa-solid' | 'fa-regular' | 'fa-brands',
    Array<{
      names: string[]
      load: () => Promise<{ default: Record<string, IconDefinition> }>
    }>
  >
}
