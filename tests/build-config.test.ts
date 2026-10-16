import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import type { IconPack } from '@fortawesome/fontawesome-svg-core'
import { iconBatchBytes, partitionIconPack } from '../build/fontawesome-catalog'

const require = createRequire(import.meta.url)

describe('Font Awesome build batches', () => {
  it('preserves every canonical SVG once and bounds batches by count and data size', () => {
    const packs: IconPack[] = [
      require('@fortawesome/free-solid-svg-icons').fas,
      require('@fortawesome/free-regular-svg-icons').far,
      require('@fortawesome/free-brands-svg-icons').fab,
    ]
    for (const pack of packs) {
      const original = new Map(Object.values(pack).map((icon) => [icon.iconName, icon]))
      const batches = partitionIconPack(pack)
      const actual = batches.flat()
      expect(actual).toHaveLength(original.size)
      expect(new Set(actual.map((icon) => icon.iconName))).toEqual(new Set(original.keys()))
      for (const icon of actual) expect(icon).toEqual(original.get(icon.iconName))
      for (const batch of batches) {
        expect(batch.length).toBeLessThanOrEqual(64)
        const bytes = batch.reduce((total, icon) => total + Buffer.byteLength(JSON.stringify(icon)), 0)
        expect(bytes <= iconBatchBytes || batch.length === 1).toBe(true)
      }
    }
  })
})
