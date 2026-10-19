import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { apiConfig } from '@/config/api'

export const axiosInstance = axios.create({
  adapter: 'fetch',
  timeout: apiConfig.timeoutMs,
  withCredentials: false,
  withXSRFToken: false,
  headers: { Accept: 'application/json' },
  transitional: { silentJSONParsing: false },
})

export interface ApiRequestOptions<D = unknown> extends Omit<AxiosRequestConfig<D>, 'timeout'> {
  timeoutMs?: number
  serviceName?: string
}

function normalizeError(
  error: unknown,
  serviceName: string,
  signal: AbortSignal | undefined,
  timeout: AbortSignal,
) {
  if (signal?.aborted) return signal.reason ?? new DOMException('The operation was aborted.', 'AbortError')
  if (timeout.aborted) return new DOMException(`${serviceName}请求超时。`, 'TimeoutError')
  if (axios.isCancel(error)) return new DOMException('The operation was aborted.', 'AbortError')
  if (axios.isAxiosError(error)) {
    if (
      error.code === 'ERR_BAD_RESPONSE' &&
      error.response?.status !== undefined &&
      error.response.status >= 200 &&
      error.response.status < 300
    )
      return new Error(`${serviceName}返回了无法识别的数据。`, { cause: error })
    if (error.response)
      return new Error(`${serviceName}暂时无法读取（HTTP ${error.response.status}），请稍后重试。`, {
        cause: error,
      })
    if (error.code === 'ERR_BAD_RESPONSE')
      return new Error(`${serviceName}返回了无法识别的数据。`, { cause: error })
  }
  return error
}

export async function request<T = unknown, D = unknown>(
  url: string | URL,
  options: ApiRequestOptions<D> = {},
): Promise<AxiosResponse<T>> {
  const { serviceName = '接口', timeoutMs = apiConfig.timeoutMs, signal, ...config } = options
  const callerSignal = signal as AbortSignal | undefined
  const timeout = AbortSignal.timeout(timeoutMs)
  const requestSignal = callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout

  try {
    return await axiosInstance.request<T, AxiosResponse<T>, D>({
      ...config,
      url: String(url),
      signal: requestSignal,
      timeout: timeoutMs,
      responseType: config.responseType ?? 'json',
      transitional: {
        ...axiosInstance.defaults.transitional,
        ...config.transitional,
        silentJSONParsing: false,
      },
    })
  } catch (error) {
    throw normalizeError(error, serviceName, callerSignal, timeout)
  }
}

export async function get<T = unknown>(url: string | URL, options: ApiRequestOptions = {}): Promise<T> {
  return (await request<T>(url, { ...options, method: 'GET' })).data
}

export async function post<T = unknown, D = unknown>(
  url: string | URL,
  data?: D,
  options: ApiRequestOptions<D> = {},
): Promise<T> {
  return (await request<T, D>(url, { ...options, data, method: 'POST' })).data
}
