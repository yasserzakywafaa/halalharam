import type { CodedError, HealthPayload, LibraryEntry, SeedExample, VerdictErrorPayload, VerdictResponse, VerdictResult } from './types.ts'

export type VerdictLookup = (query: string, locale: string) => Promise<VerdictResult>
export type HealthLookup = (locale: string) => Promise<HealthPayload | null | undefined>

export interface VerdictClient {
  fetchVerdict(query: string, locale?: string, options?: { signal?: AbortSignal }): Promise<VerdictResponse>
  fetchHealth(locale?: string): Promise<HealthPayload | null>
  fetchLibrary(locale?: string): Promise<Array<LibraryEntry | SeedExample>>
}

function errorFromResult(data: Partial<VerdictErrorPayload> | null | undefined): CodedError {
  const status = Number(data?.status) || 500
  const error: CodedError = new Error(data?.error || `Request failed (${status})`)
  error.status = status
  error.code = data?.code
  if (status === 429) error.code = 'RATE_LIMIT'
  return error
}

function abortError(): Error {
  const error = new Error('The operation was aborted')
  error.name = 'AbortError'
  return error
}

function isErrorPayload(data: VerdictResult): data is VerdictErrorPayload {
  return Number((data as VerdictErrorPayload).status) >= 400
}

export function isVerdictNetworkFailure(input: unknown): boolean {
  if (!input || typeof input !== 'object') return false
  const error = input as CodedError
  if (error.name === 'AbortError') return false
  if (error.code === 'NO_API_KEY' || error.code === 'RATE_LIMIT') return false
  if (error.status === 429) return false
  const message = String(error.message || '')
  if (/OPENROUTER_API_KEY|rate limit|too many requests/i.test(message)) return false
  if (error.code === 'NETWORK') return true
  if (error.name === 'TypeError') return true
  return /failed to fetch|networkerror|network request failed|load failed|the internet connection appears to be offline/i.test(
    message,
  )
}

/**
 * Browser client over the verdict server actions. `lookup` / `health` are injected
 * so this stays testable under `node --test` without the Next.js runtime.
 *
 * A server action cannot be cancelled mid-flight, so `signal` only stops a stale
 * answer from being delivered (the page already ignores superseded lookups).
 */
export function createVerdictClient({ lookup, health }: { lookup: VerdictLookup; health: HealthLookup }): VerdictClient {
  async function fetchVerdict(
    query: string,
    locale = 'en',
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<VerdictResponse> {
    if (signal?.aborted) throw abortError()
    let data: VerdictResult
    try {
      data = await lookup(query, locale)
    } catch (caught) {
      const error = caught as CodedError | undefined
      if (signal?.aborted || error?.name === 'AbortError') throw abortError()
      if (caught instanceof TypeError || error?.name === 'TypeError' || isVerdictNetworkFailure(error)) {
        const network: CodedError = new Error('Network request failed')
        network.code = 'NETWORK'
        network.cause = caught
        throw network
      }
      throw caught
    }
    if (signal?.aborted) throw abortError()
    if (!data || typeof data !== 'object') throw errorFromResult({ status: 500 })
    if (isErrorPayload(data)) throw errorFromResult(data)
    return data
  }

  async function fetchHealth(locale = 'en'): Promise<HealthPayload | null> {
    try {
      return (await health(locale)) || null
    } catch {
      return null
    }
  }

  async function fetchLibrary(locale = 'en'): Promise<Array<LibraryEntry | SeedExample>> {
    const data = await fetchHealth(locale)
    return data?.library || data?.examples || []
  }

  return { fetchVerdict, fetchHealth, fetchLibrary }
}
