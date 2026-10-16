import { h, type Component, type FunctionalComponent, type StyleValue } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { IconPack } from '@fortawesome/fontawesome-svg-core'

export type FontAwesomeLibrary = 'fa-solid' | 'fa-regular' | 'fa-brands'

const packs = {
  'fa-solid': () => import('@fortawesome/free-solid-svg-icons').then((module) => module.fas),
  'fa-regular': () => import('@fortawesome/free-regular-svg-icons').then((module) => module.far),
  'fa-brands': () => import('@fortawesome/free-brands-svg-icons').then((module) => module.fab),
}

function iconComponents(pack: IconPack): Record<string, Component> {
  const components: Record<string, Component> = {}
  for (const icon of Object.values(pack)) {
    // Packs also export aliases; each canonical icon should appear only once.
    if (Object.hasOwn(components, icon.iconName)) continue
    const component: FunctionalComponent<{ size?: number }> = ({ size = 24 }, { attrs }) =>
      h(FontAwesomeIcon, {
        ...attrs,
        icon,
        style: [attrs.style as StyleValue, { width: `${size}px`, height: `${size}px` }],
      })
    component.props = ['size']
    component.inheritAttrs = false
    components[icon.iconName] = component
  }
  return components
}

export async function loadFontAwesomeIcons(library: FontAwesomeLibrary): Promise<Record<string, Component>> {
  return iconComponents(await packs[library]())
}
