import { clientKey, rateLimiter as defaultLimiter, type RateLimiter } from './rate-limit.ts'
import { localeFromAcceptLanguage, resolveLocale } from './locale.ts'
import { HANDLER_SLACK_MS, REQUEST_BUDGET_MS } from './openrouter.ts'
import { getVerdict, timedOutVerdict } from './verdict.ts'
import type { HeaderBag, Locale, VerdictErrorPayload, VerdictResult } from './types.ts'

const HANDLER_BUDGET_MS = REQUEST_BUDGET_MS + HANDLER_SLACK_MS

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept-Language',
}

/** Plain header bag for `clientKey` from a Web `Headers` (Route Handlers, server actions). */
export function headerBag(headers: Headers | HeaderBag | null | undefined): HeaderBag {
  if (!headers) return {}
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  return headers
}

function json(status: number, payload: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  })
}

function requestLocale(headers: HeaderBag, extra: unknown): Locale {
  return resolveLocale(extra || localeFromAcceptLanguage(headers['accept-language']))
}

interface VerdictBody {
  query?: string
  q?: string
  locale?: string
  lang?: string
}

async function readJsonBody(request: Request): Promise<VerdictBody> {
  const raw = await request.text()
  if (!raw) return {}
  return JSON.parse(raw) as VerdictBody
}

export async function extractVerdictInput(request: Request): Promise<{ query: string; locale: Locale }> {
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

export function rateLimitPayload(retryAfterSeconds: number): VerdictErrorPayload & { retryAfterSeconds: number } {
  return {
    error: 'Too many requests. Please wait and try again.',
    code: 'rate_limited',
    retryAfterSeconds,
    status: 429,
  }
}

/** Returns a 429 payload when the soft limit is hit, otherwise null. */
export function consumeVerdictLimit(
  headers: HeaderBag = {},
  limiter: RateLimiter = defaultLimiter,
): ReturnType<typeof rateLimitPayload> | null {
  const decision = limiter.consume(clientKey({ headers }), 'verdict')
  return decision.ok ? null : rateLimitPayload(decision.retryAfterSeconds)
}

/** Seed first, OpenRouter on a miss, never past the function budget. */
export async function lookupWithinBudget(query: string, locale: Locale): Promise<VerdictResult> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      getVerdict(query, { locale }),
      new Promise<VerdictResult>((resolve) => {
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
export async function runVerdict({
  query,
  locale,
  headers = {},
  limiter = defaultLimiter,
}: {
  query: string
  locale?: unknown
  headers?: HeaderBag
  limiter?: RateLimiter
}): Promise<VerdictResult> {
  const limited = consumeVerdictLimit(headers, limiter)
  if (limited) return limited
  return lookupWithinBudget(query, resolveLocale(locale))
}

/** `/api/verdict` Route Handler: Web `Request` in, Web `Response` out. */
export async function handleVerdictRequest(
  request: Request,
  deps: { limiter?: RateLimiter } = {},
): Promise<Response> {
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
    return json(500, { error: 'Verdict lookup failed', detail: error instanceof Error ? error.message : String(error) })
  }
}
