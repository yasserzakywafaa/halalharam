import { clientKey, rateLimiter as defaultLimiter } from './rate-limit.js'
import { localeFromAcceptLanguage, resolveLocale } from './locale.js'
import { HANDLER_SLACK_MS, REQUEST_BUDGET_MS } from './openrouter.js'
import { getVerdict, timedOutVerdict } from './verdict.js'

const HANDLER_BUDGET_MS = REQUEST_BUDGET_MS + HANDLER_SLACK_MS

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept-Language',
}

/** Plain header bag for `clientKey` from a Web `Headers` (Route Handlers, server actions). */
export function headerBag(headers) {
  if (!headers) return {}
  if (typeof headers.entries === 'function') return Object.fromEntries(headers.entries())
  return headers
}

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  })
}

function requestLocale(headers, extra) {
  return resolveLocale(extra || localeFromAcceptLanguage(headers['accept-language']))
}

async function readJsonBody(request) {
  const raw = await request.text()
  if (!raw) return {}
  return JSON.parse(raw)
}

export async function extractVerdictInput(request) {
  const headers = headerBag(request.headers)
  const url = new URL(request.url, 'http://localhost')
  const fromQuery = url.searchParams.get('q') || url.searchParams.get('query')
  const fromLocale = url.searchParams.get('locale') || url.searchParams.get('lang')

  if (request.method === 'GET') {
    return {
      query: fromQuery || '',
      locale: requestLocale(headers, fromLocale),
    }
  }

  const body = await readJsonBody(request)
  return {
    query: body.query || body.q || fromQuery || '',
    locale: requestLocale(headers, body.locale || body.lang || fromLocale),
  }
}

export function rateLimitPayload(retryAfterSeconds) {
  return {
    error: 'Too many requests. Please wait and try again.',
    code: 'rate_limited',
    retryAfterSeconds,
    status: 429,
  }
}

/** Returns a 429 payload when the soft limit is hit, otherwise null. */
export function consumeVerdictLimit(headers = {}, limiter = defaultLimiter) {
  const decision = limiter.consume(clientKey({ headers }), 'verdict')
  return decision.ok ? null : rateLimitPayload(decision.retryAfterSeconds)
}

/** Seed first, OpenRouter on a miss, never past the function budget. */
export async function lookupWithinBudget(query, locale) {
  let timer
  try {
    return await Promise.race([
      getVerdict(query, { locale }),
      new Promise((resolve) => {
        timer = setTimeout(() => {
          console.error('[verdict] handler budget exceeded')
          resolve(timedOutVerdict(query, locale))
        }, HANDLER_BUDGET_MS)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * One verdict lookup under the soft rate limit and the function budget.
 * Used by the `lookupVerdict` server action.
 */
export async function runVerdict({ query, locale, headers = {}, limiter = defaultLimiter }) {
  const limited = consumeVerdictLimit(headers, limiter)
  if (limited) return limited
  return lookupWithinBudget(query, resolveLocale(locale))
}

/** `/api/verdict` Route Handler: Web `Request` in, Web `Response` out. */
export async function handleVerdictRequest(request, deps = {}) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { error: 'Use GET or POST' })
  }

  const limited = consumeVerdictLimit(headerBag(request.headers), deps.limiter || defaultLimiter)
  if (limited) {
    const { status, ...body } = limited
    return json(status, body, { 'Retry-After': String(limited.retryAfterSeconds) })
  }

  try {
    const { query, locale } = await extractVerdictInput(request)
    const result = await lookupWithinBudget(query, locale)
    return json(result.status || 200, result)
  } catch (error) {
    return json(500, { error: 'Verdict lookup failed', detail: error.message })
  }
}
