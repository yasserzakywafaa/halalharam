function errorFromResult(data) {
  const status = Number(data?.status) || 500
  const error = new Error(data?.error || `Request failed (${status})`)
  error.status = status
  error.code = data?.code
  if (status === 429) error.code = 'RATE_LIMIT'
  return error
}

function abortError() {
  const error = new Error('The operation was aborted')
  error.name = 'AbortError'
  return error
}

export function isVerdictNetworkFailure(error) {
  if (!error || typeof error !== 'object') return false
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
export function createVerdictClient({ lookup, health }) {
  async function fetchVerdict(query, locale = 'en', { signal } = {}) {
    if (signal?.aborted) throw abortError()
    let data
    try {
      data = await lookup(query, locale)
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') throw abortError()
      if (error instanceof TypeError || error?.name === 'TypeError' || isVerdictNetworkFailure(error)) {
        const network = new Error('Network request failed')
        network.code = 'NETWORK'
        network.cause = error
        throw network
      }
      throw error
    }
    if (signal?.aborted) throw abortError()
    if (!data || typeof data !== 'object') throw errorFromResult({ status: 500 })
    if (Number(data.status) >= 400) throw errorFromResult(data)
    return data
  }

  async function fetchHealth(locale = 'en') {
    try {
      return (await health(locale)) || null
    } catch {
      return null
    }
  }

  async function fetchLibrary(locale = 'en') {
    const data = await fetchHealth(locale)
    return data?.library || data?.examples || []
  }

  return { fetchVerdict, fetchHealth, fetchLibrary }
}
