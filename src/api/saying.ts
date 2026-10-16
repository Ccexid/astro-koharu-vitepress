import { fetchJson } from '@/api/fetch-json'

export interface SayingResponse {
  text: string
}

/** Read a random saying directly from UAPI. */
export async function fetchSaying(signal?: AbortSignal): Promise<SayingResponse> {
  const payload = await fetchJson<unknown>(`/uapi/api/v1/saying`, {
    method: 'GET',
    signal,
    serviceName: '一言',
    credentials: 'omit',
    cache: 'no-store',
  })

  if (
    !payload ||
    typeof payload !== 'object' ||
    !('text' in payload) ||
    typeof payload.text !== 'string' ||
    !payload.text.trim()
  ) {
    throw new Error('一言返回了无法识别的数据。')
  }

  return { text: payload.text.trim() }
}
