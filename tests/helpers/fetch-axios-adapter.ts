import { afterEach, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios'
import { axiosInstance } from '../../src/api/http'

export const fetchAxiosAdapter: AxiosAdapter = async (config) => {
  const options = config.fetchOptions as RequestInit | undefined
  const response = await fetch(String(config.url), {
    method: config.method?.toUpperCase(),
    headers: AxiosHeaders.from(config.headers).toJSON() as HeadersInit,
    body: config.data as BodyInit | null | undefined,
    signal: config.signal as AbortSignal | undefined,
    credentials: config.withCredentials ? 'include' : 'omit',
    cache: options?.cache,
  })
  const data = config.responseType === 'blob' ? await response.blob() : await response.text()

  const result = {
    config,
    data,
    headers: AxiosHeaders.from(Object.fromEntries(response.headers.entries())),
    status: response.status,
    statusText: response.statusText,
    request: undefined,
  }
  const validateStatus = config.validateStatus ?? ((status: number) => status >= 200 && status < 300)
  if (!validateStatus(response.status)) {
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      result,
    )
  }
  return result
}

export function useFetchAxiosAdapter() {
  const originalAdapter = axiosInstance.defaults.adapter
  beforeEach(() => {
    axiosInstance.defaults.adapter = fetchAxiosAdapter
  })
  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
  })
}
