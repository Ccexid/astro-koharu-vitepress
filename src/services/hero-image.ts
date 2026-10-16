import { fetchRandomImage, RandomImageError } from '@/api/random-image'

export const HERO_IMAGE_INTERVAL = 12 * 60 * 60 * 1000
const cacheName = 'koharu-hero-image-v1'
const cacheKey = '/__koharu_cache__/hero-acg-pc'
const storageKey = 'koharu-hero-image-next-request'

export interface HeroImageResult {
  blob: Blob | null
  refreshAt: number
}

let pending: Promise<HeroImageResult> | undefined
let memory: HeroImageResult = { blob: null, refreshAt: 0 }

function readNextRequest(): number {
  try {
    const value = Number(window.localStorage.getItem(storageKey))
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

function saveNextRequest(value: number): void {
  try {
    window.localStorage.setItem(storageKey, String(value))
  } catch {
    /* Session memory remains available. */
  }
}

async function load(): Promise<HeroImageResult> {
  let cache: Cache | undefined
  const key = new URL(cacheKey, window.location.origin).href
  let cached = memory.blob
  let cachedUntil = memory.refreshAt
  try {
    cache = await window.caches.open(cacheName)
    const response = await cache.match(key)
    if (response?.headers.get('Content-Type')?.startsWith('image/')) {
      const blob = await response.blob()
      if (blob.size) {
        cached = blob
        const expiry = Number(response.headers.get('X-Hero-Refresh-At'))
        if (Number.isFinite(expiry)) cachedUntil = Math.max(cachedUntil, expiry)
      }
    }
  } catch {
    /* Cache storage may be unavailable; still respect the request cooldown. */
  }

  const now = Date.now()
  const refreshAt = Math.max(cachedUntil, readNextRequest())
  if (now < refreshAt) return (memory = { blob: cached, refreshAt })

  // Persist before sending: failures and reloads must not bypass the 12-hour limit.
  memory = { blob: cached, refreshAt: now + HERO_IMAGE_INTERVAL }
  saveNextRequest(memory.refreshAt)
  try {
    const blob = await fetchRandomImage({ category: 'acg', type: 'pc' })
    memory = { blob, refreshAt: memory.refreshAt }
    try {
      await cache?.put(
        key,
        new Response(blob, {
          headers: {
            'Content-Type': blob.type,
            'X-Hero-Refresh-At': String(memory.refreshAt),
          },
        }),
      )
    } catch {
      /* Keep the image in memory if the persistent image cache is full. */
    }
  } catch (error) {
    if (error instanceof RandomImageError && error.retryAfterMs) {
      memory.refreshAt = Math.max(memory.refreshAt, now + error.retryAfterMs)
      saveNextRequest(memory.refreshAt)
    }
  }
  return memory
}

/** Same-browser persistent image cache, with cross-tab locking when the browser supports it. */
export function getHeroImage(): Promise<HeroImageResult> {
  if (pending) return pending
  const task = navigator.locks?.request ? navigator.locks.request(cacheName, load) : load()
  pending = Promise.resolve(task).finally(() => {
    pending = undefined
  })
  return pending
}
