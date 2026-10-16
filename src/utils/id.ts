function fallbackUuid(): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    cryptoApi.getRandomValues(bytes)
    bytes[6] = (bytes[6]! & 0x0f) | 0x40
    bytes[8] = (bytes[8]! & 0x3f) | 0x80
    return [...bytes]
      .map((value, index) => {
        const hex = value.toString(16).padStart(2, '0')
        return [4, 6, 8, 10].includes(index) ? `-${hex}` : hex
      })
      .join('')
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/** Create a client-side identifier in both secure and plain HTTP contexts. */
export function createClientId(prefix = ''): string {
  const cryptoApi = globalThis.crypto
  const id = typeof cryptoApi?.randomUUID === 'function' ? cryptoApi.randomUUID() : fallbackUuid()

  return prefix ? `${prefix}${id}` : id
}

/** Protect dependencies that call crypto.randomUUID directly on an HTTP deployment. */
export function installClientUuidFallback(): void {
  const cryptoApi = globalThis.crypto as (Crypto & { randomUUID?: () => string }) | undefined
  if (!cryptoApi || typeof cryptoApi.randomUUID === 'function') return
  try {
    Object.defineProperty(cryptoApi, 'randomUUID', {
      configurable: true,
      value: fallbackUuid,
    })
  } catch {
    // Some older browsers expose a non-extensible Crypto object; local callers still use fallbackUuid().
  }
}
