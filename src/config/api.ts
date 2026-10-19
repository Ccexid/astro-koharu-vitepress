import { API_DEFAULTS } from './api-defaults.ts'

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function baseUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback
  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return fallback
    return url.href.replace(/\/+$/, '')
  } catch {
    return fallback
  }
}

export const apiConfig = {
  timeoutMs: positiveInteger(import.meta.env.VITE_API_TIMEOUT_MS, API_DEFAULTS.timeoutMs),
  randomImageTimeoutMs: positiveInteger(
    import.meta.env.VITE_API_RANDOM_IMAGE_TIMEOUT_MS,
    API_DEFAULTS.randomImageTimeoutMs,
  ),
  bangumiBaseUrl: baseUrl(import.meta.env.VITE_API_BANGUMI_URL, API_DEFAULTS.upstreams.bangumi),
  routes: {
    bilibiliFollow: API_DEFAULTS.paths.bilibiliPrefix + API_DEFAULTS.paths.bilibiliFollow,
    saying: API_DEFAULTS.paths.uapiPrefix + API_DEFAULTS.paths.uapiSaying,
    randomImage: API_DEFAULTS.paths.uapiPrefix + API_DEFAULTS.paths.uapiRandomImage,
  },
} as const
