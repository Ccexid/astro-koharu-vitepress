import { shallowRef, type Component } from 'vue'
import { Github, Link, Mail, Tv } from 'lucide-vue-next'

export const iconLibraryLabels = {
  lucide: 'Lucide',
  meteor: 'Meteor',
  'fa-solid': 'FA6 Solid',
  'fa-regular': 'FA6 Regular',
  'fa-brands': 'FA6 Brands',
} as const
export type IconLibrary = keyof typeof iconLibraryLabels
export const iconLibraryOptions = Object.keys(iconLibraryLabels) as IconLibrary[]

export const socialIcons = shallowRef<Record<IconLibrary, Record<string, Component>>>({
  lucide: { Github, Link, Mail, Tv },
  meteor: {},
  'fa-solid': {},
  'fa-regular': {},
  'fa-brands': {},
})

export function iconLibraryOf(value: string): IconLibrary {
  const separator = value.indexOf(':')
  if (separator === -1) return 'lucide'
  const prefix = value.slice(0, separator)
  return Object.hasOwn(iconLibraryLabels, prefix) ? (prefix as IconLibrary) : 'lucide'
}

export function iconNameOf(value: string): string {
  const library = iconLibraryOf(value)
  return library === 'lucide' ? value : value.slice(library.length + 1)
}

export function socialIconValue(library: IconLibrary, name: string): string {
  return library === 'lucide' ? name : `${library}:${name}`
}

export function resolveSocialIcon(value: string): Component {
  const icons = socialIcons.value[iconLibraryOf(value)]
  const name = iconNameOf(value)
  return Object.hasOwn(icons, name) ? icons[name]! : Link
}

const libraryPromises: Partial<Record<IconLibrary, Promise<Record<string, Component>>>> = {}
const loaders: Record<IconLibrary, () => Promise<Record<string, Component>>> = {
  lucide: () => import('lucide-vue-next/dist/esm/icons/index.js'),
  meteor: () => import('@meteor-icons/vue'),
  'fa-solid': () => import('./fontawesome-icons').then((module) => module.loadFontAwesomeIcons('fa-solid')),
  'fa-regular': () =>
    import('./fontawesome-icons').then((module) => module.loadFontAwesomeIcons('fa-regular')),
  'fa-brands': () => import('./fontawesome-icons').then((module) => module.loadFontAwesomeIcons('fa-brands')),
}

export function loadIconLibrary(library: IconLibrary): Promise<Record<string, Component>> {
  libraryPromises[library] ??= loaders[library]()
    .then((module) => {
      socialIcons.value = { ...socialIcons.value, [library]: module }
      return module
    })
    .catch((error: unknown) => {
      delete libraryPromises[library]
      throw error
    })
  return libraryPromises[library]
}

export async function ensureSocialIcon(value: string): Promise<void> {
  const library = iconLibraryOf(value)
  if (!Object.hasOwn(socialIcons.value[library], iconNameOf(value))) {
    await loadIconLibrary(library)
  }
}
