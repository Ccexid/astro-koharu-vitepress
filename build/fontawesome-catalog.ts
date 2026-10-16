import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { IconDefinition, IconPack } from '@fortawesome/fontawesome-svg-core'
import type { Plugin } from 'vite'

const require = createRequire(import.meta.url)
const catalogId = 'virtual:fontawesome-catalog'
export const iconBatchBytes = 48 * 1024

export function partitionIconPack(pack: IconPack): IconDefinition[][] {
  const unique = new Map(Object.values(pack).map((icon) => [icon.iconName, icon]))
  const icons = [...unique.values()].sort((left, right) => left.iconName.localeCompare(right.iconName))
  const groups: IconDefinition[][] = []
  let group: IconDefinition[] = []
  let bytes = 0
  for (const icon of icons) {
    const size = Buffer.byteLength(JSON.stringify(icon))
    if (group.length && (group.length >= 64 || bytes + size > iconBatchBytes)) {
      groups.push(group)
      group = []
      bytes = 0
    }
    group.push(icon)
    bytes += size
  }
  if (group.length) groups.push(group)
  return groups
}

export function fontAwesomeCatalog(): Plugin {
  const modules = new Map<string, string>()
  const packs: Record<string, IconPack> = {
    'fa-solid': require('@fortawesome/free-solid-svg-icons').fas,
    'fa-regular': require('@fortawesome/free-regular-svg-icons').far,
    'fa-brands': require('@fortawesome/free-brands-svg-icons').fab,
  }
  const families = Object.entries(packs).map(([family, pack]) => {
    const batches = partitionIconPack(pack).map((icons, index) => {
      const id = `virtual:${family}-${String(index).padStart(3, '0')}`
      const definitions = Object.fromEntries(icons.map((icon) => [icon.iconName, icon]))
      modules.set(id, `export default ${JSON.stringify(definitions)}`)
      return `{names:${JSON.stringify(Object.keys(definitions))},load:()=>import(${JSON.stringify(id)})}`
    })
    return `${JSON.stringify(family)}:[${batches.join(',')}]`
  })
  modules.set(catalogId, `export const fontAwesomeCatalog={${families.join(',')}}`)

  return {
    name: 'fontawesome-catalog',
    resolveId(id) {
      if (modules.has(id)) return `\0${id}`
    },
    load(id) {
      return modules.get(id.replace(/^\0/, ''))
    },
    generateBundle() {
      const folder = dirname(require.resolve('@fortawesome/free-solid-svg-icons/package.json'))
      this.emitFile({
        type: 'asset',
        fileName: 'FONT_AWESOME_LICENSE.txt',
        source: readFileSync(join(folder, 'LICENSE.txt'), 'utf8'),
      })
    },
  }
}
