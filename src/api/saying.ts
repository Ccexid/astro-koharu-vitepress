import { get } from '@/api/http'
import { apiConfig } from '@/config/api'

export interface SayingResponse {
  text: string
}

/** Read a random saying through the same-origin UAPI route. */
export async function fetchSaying(signal?: AbortSignal): Promise<SayingResponse> {
  const payload = await get<unknown>(apiConfig.routes.saying, {
    signal,
    serviceName: '一言',
    fetchOptions: { cache: 'no-store' },
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
