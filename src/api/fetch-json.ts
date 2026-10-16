export interface FetchJsonOptions extends Omit<RequestInit, 'signal'> {
  signal?: AbortSignal
  timeoutMs?: number
  serviceName?: string
}

/** Fetch a JSON API response with a shared timeout, cancellation, and HTTP error policy. */
export async function fetchJson<T>(input: RequestInfo | URL, options: FetchJsonOptions = {}): Promise<T> {
  const { signal, timeoutMs = 15_000, serviceName = '接口', ...init } = options
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
  const response = await fetch(input, { ...init, signal: requestSignal })

  if (!response.ok) {
    throw new Error(`${serviceName}暂时无法读取（HTTP ${response.status}），请稍后重试。`)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    if (requestSignal.aborted) throw error
    throw new Error(`${serviceName}返回了无法识别的数据。`, { cause: error })
  }
}
