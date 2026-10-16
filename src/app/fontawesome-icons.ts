import { defineAsyncComponent, h, type Component, type FunctionalComponent, type StyleValue } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Link } from 'lucide-vue-next'
import { fontAwesomeCatalog } from 'virtual:fontawesome-catalog'

export type FontAwesomeLibrary = 'fa-solid' | 'fa-regular' | 'fa-brands'

function iconComponent(icon: IconDefinition): Component {
  const component: FunctionalComponent<{ size?: number }> = ({ size = 24 }, { attrs }) =>
    h(FontAwesomeIcon, {
      ...attrs,
      icon,
      style: [attrs.style as StyleValue, { width: `${size}px`, height: `${size}px` }],
    })
  component.props = ['size']
  component.inheritAttrs = false
  return component
}

export async function loadFontAwesomeIcons(library: FontAwesomeLibrary): Promise<Record<string, Component>> {
  const components: Record<string, Component> = {}
  for (const group of fontAwesomeCatalog[library]) {
    let pending: ReturnType<typeof group.load> | undefined
    for (const name of group.names) {
      components[name] = defineAsyncComponent({
        async loader() {
          pending ??= group.load().catch((error: unknown) => {
            pending = undefined
            throw error
          })
          const icon = (await pending).default[name]
          if (!icon) throw new Error(`Missing Font Awesome icon: ${library}:${name}`)
          return iconComponent(icon)
        },
        loadingComponent: Link,
        errorComponent: Link,
        delay: 0,
      })
    }
  }
  return components
}
