import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClientId, installClientUuidFallback } from '../src/utils/id'

afterEach(() => vi.unstubAllGlobals())

describe('client ids', () => {
  it('uses getRandomValues when randomUUID is unavailable on an HTTP deployment', () => {
    vi.stubGlobal('crypto', {
      getRandomValues(bytes: Uint8Array) {
        bytes.fill(7)
        return bytes
      },
    })

    const id = createClientId('heading-')
    expect(id).toMatch(/^heading-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('still creates an identifier when Web Crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined)
    expect(createClientId()).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
  })

  it('installs a safe randomUUID fallback for dependencies on plain HTTP', () => {
    vi.stubGlobal('crypto', {
      getRandomValues(bytes: Uint8Array) {
        bytes.fill(9)
        return bytes
      },
      randomUUID: 'unsupported',
    })

    installClientUuidFallback()
    expect(typeof (globalThis.crypto as Crypto).randomUUID).toBe('function')
    expect((globalThis.crypto as Crypto).randomUUID()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })
})
