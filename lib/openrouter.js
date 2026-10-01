import { isNamedAuthority, recognizeCitation, sourceHasNamedAuthority } from './authorities.js'
import {
  completionMatchesLocale,
  languageName,
  localeCopy,
  resolveLocale,
} from './locale.js'
import { buildPositions } from './positions.js'
import { HTTPClient, OpenRouter } from '@openrouter/sdk'
import { OpenRouterError, ResponseValidationError } from '@openrouter/sdk/models/errors'

const APP_TITLE = 'Halal or Haram'
const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free'
/** Must stay below api/verdict.js / vercel.json maxDuration (60s) with room for the handler backup. */
export const REQUEST_BUDGET_MS = 55_000
/** Slack for json() + HTTP write after the OpenRouter race; keep handler below 60s. */
export const HANDLER_SLACK_MS = 2_000
/** Structured fatwa JSON only — not a thinking budget. */
export const MAX_OUTPUT_TOKENS = 2048
/** Fail fast on 429 so a queued/rate-limited model cannot consume the whole abort budget. */
const RATE_LIMIT_RETRIES = 0
const RATE_LIMIT_BACKOFF_MS = [250]
const LANGUAGE_RETRY_MIN_MS = 4_000

/** Prefer thinking off; `effort: "low"` is the fallback shape for models that require reasoning. */
export function reasoningPreference() {
  return {
    enabled: false,
    effort: 'low',
    exclude: true,
  }
}

export function buildSystemPrompt(locale) {
  const resolved = resolveLocale(locale)
  const language = languageName(resolved)

  return `You are a cautious Islamic research assistant for a consumer web app called "Halal or Haram".

Rules you MUST follow:
- Never claim one universal ruling for all Muslims. Always name the authority ("according to whom").
- Every citation MUST name a specific scholar, fatwa council, certifying body, or primary text (Qur'an surah, or a named hadith collection). "Widely accepted", "most scholars", or "generally" is NOT an authority.
- Verdict must be exactly one of: "halal", "haram", "unclear".
- If reputable named sources disagree, you MUST set verdict to "unclear", set conflict to true, and fill positions[] with BOTH sides. Do not pick a winner. Each position keeps its own citations.
- Use "unclear" when schools differ, when the question depends on ingredients/process, or when you are not confident.
- Cite real, linkable sources: Qur'an (quran.com), hadith (sunnah.com), IslamQA (islamqa.info), Dar al-Ifta (dar-alifta.org), SeekersGuidance, AMJA, Askimam, Islamweb, or similarly reputable mufti desks. Do not invent URLs.
- When a citation URL is already on a known desk, the authority field must name that desk. Do not write "widely accepted" or "most scholars" for a URL that already identifies the source.
- If you cannot find a solid named citation, lower confidence and say so. Do not fabricate fatwa numbers.
- This is not a personal fatwa. Say the user should consult a qualified local scholar for their circumstances.
- Be concise. No sermons.
- LANGUAGE: Write title, summary, accordingTo, caveats, position titles/summaries/accordingTo, and human-readable citation fields (authority, name, excerpt) in ${language} (locale: ${resolved}). Keep URLs canonical — do not translate or rewrite URLs. Keep fatwa numbers and verse numbers. Named authorities must remain identifiable even when their display names are translated.

Return ONLY JSON matching this shape:
{
  "verdict": "halal" | "haram" | "unclear",
  "confidence": number between 0 and 1,
  "conflict": boolean,
  "title": string,
  "summary": string,
  "accordingTo": string,
  "caveats": string[],
  "sources": [
    {
      "authority": string,
      "name": string,
      "stance": "halal" | "haram" | "unclear",
      "url": string,
      "excerpt": string
    }
  ],
  "positions": [
    {
      "stance": "halal" | "haram" | "unclear",
      "title": string,
      "summary": string,
      "accordingTo": string,
      "sources": [ { "authority": string, "name": string, "stance": string, "url": string, "excerpt": string } ]
    }
  ]
}`
}

function userPrompt(query, locale, { retry = false } = {}) {
  const resolved = resolveLocale(locale)
  const language = languageName(resolved)
  const retryLine = retry
    ? `\n\nCRITICAL: The previous completion was NOT written in ${language}. Re-output the SAME JSON shape entirely in ${language}. Do not use another language for title, summary, accordingTo, caveats, position copy, or citation display names. URLs stay canonical.`
    : ''
  return `Query: ${query}\n\nGive a sourced verdict. Name scholars or fatwa bodies on every citation. If named sources disagree, conflict=true, verdict=unclear, and positions[] must present BOTH sides with their own citations. Do not pick a winner.\n\nWrite every human-readable string in ${language} (locale: ${resolved}).${retryLine}`
}

export function getOpenRouterConfig() {
  const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim()
  const model = String(process.env.OPENROUTER_MODEL || '').trim() || DEFAULT_MODEL
  const referer =
    String(process.env.OPENROUTER_HTTP_REFERER || '').trim() || 'https://halal-or-haram.vercel.app'
  return { apiKey, model, referer }
}

/** Booleans and the model id only. Never includes the API key. */
export function openRouterPublicStatus() {
  const { apiKey, model } = getOpenRouterConfig()
  const keyPresent = apiKey.length > 0
  return {
    openRouterKeyPresent: keyPresent,
    openRouterConfigured: keyPresent,
    model,
  }
}

function codedError(message, code, status) {
  const error = new Error(message)
  error.code = code
  if (status) error.status = status
  return error
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function remainingMs(deadline) {
  return deadline - Date.now()
}

function timeoutError() {
  return codedError('OpenRouter request timed out', 'OPENROUTER_TIMEOUT')
}

/** Resolves or rejects even if `work` ignores AbortSignal (Vercel fetch can hang past abort). */
function raceWithTimeout(work, timeoutMs, onTimeout) {
  const ms = Math.max(1, timeoutMs)
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      try {
        onTimeout?.()
      } catch {
        // Abort is best-effort; the race still has to win.
      }
      reject(timeoutError())
    }, ms)
  })
  return Promise.race([work, timeout]).finally(() => {
    clearTimeout(timer)
  })
}

function rateLimitRetryCount(options = {}) {
  if (Number.isInteger(options.rateLimitRetries) && options.rateLimitRetries >= 0) {
    return options.rateLimitRetries
  }
  return RATE_LIMIT_RETRIES
}

function rateLimitBackoffList(options = {}) {
  if (Array.isArray(options.rateLimitBackoffMs) && options.rateLimitBackoffMs.length) {
    return options.rateLimitBackoffMs.map((value) => Math.max(0, Number(value) || 0))
  }
  return RATE_LIMIT_BACKOFF_MS
}

export function chatCompletionBody({ model, locale, query, retry = false }) {
  return {
    model,
    temperature: 0.2,
    max_tokens: MAX_OUTPUT_TOKENS,
    reasoning: reasoningPreference(),
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(locale) },
      {
        role: 'user',
        content: userPrompt(query, locale, { retry }),
      },
    ],
  }
}

/** camelCase request for `openRouter.chat.send` (the SDK serializes to the wire shape). */
export function sdkChatRequest({ model, locale, query, retry = false }) {
  const body = chatCompletionBody({ model, locale, query, retry })
  return {
    model: body.model,
    temperature: body.temperature,
    maxTokens: body.max_tokens,
    reasoning: body.reasoning,
    responseFormat: body.response_format,
    messages: body.messages,
    stream: false,
  }
}

/**
 * The SDK's typed `reasoning` keeps only `effort`, which would turn thinking ON for
 * models that default to off. Restore the exact `reasoningPreference()` on the wire.
 */
async function preserveReasoningPreference(request) {
  if (request.method !== 'POST') return undefined
  let body
  try {
    body = JSON.parse(await request.clone().text())
  } catch {
    return undefined
  }
  if (!body || typeof body !== 'object' || !('messages' in body)) return undefined
  body.reasoning = reasoningPreference()
  return new Request(request, { body: JSON.stringify(body) })
}

/**
 * One SDK client per lookup: the key and referer are read per request (env can change
 * between tests / deploys), retries are off (we own the 429 policy), and the fetcher
 * defers to `globalThis.fetch` at call time.
 */
export function createOpenRouterClient({ apiKey, referer }) {
  const httpClient = new HTTPClient({
    fetcher: (input, init) => (init == null ? globalThis.fetch(input) : globalThis.fetch(input, init)),
  })
  httpClient.addHook('beforeRequest', preserveReasoningPreference)
  return new OpenRouter({
    apiKey,
    httpReferer: referer,
    appTitle: APP_TITLE,
    httpClient,
    retryConfig: { strategy: 'none' },
  })
}

/** HTTP status from an SDK error, or 0 when the request never got a response. */
function sdkErrorStatus(error) {
  return error instanceof OpenRouterError ? Number(error.statusCode) || 0 : 0
}

async function sendCompletion({ apiKey, model, referer, locale, query, retry, deadline }) {
  const timeoutMs = Math.max(1, remainingMs(deadline))
  const controller = new AbortController()
  const client = createOpenRouterClient({ apiKey, referer })
  const pending = client.chat
    .send(
      { chatRequest: sdkChatRequest({ model, locale, query, retry }) },
      { signal: controller.signal, retries: { strategy: 'none' } },
    )
    .then(
      (result) => ({ ok: true, result }),
      (error) => {
        if (controller.signal.aborted || error?.name === 'AbortError' || error?.code === 'OPENROUTER_TIMEOUT') {
          throw timeoutError()
        }
        // Strict response schema miss (e.g. a provider omits `system_fingerprint`):
        // the body was a 200 chat completion, so keep using it.
        if (error instanceof ResponseValidationError && error.statusCode === 200 && error.rawValue) {
          return { ok: true, result: error.rawValue }
        }
        const status = sdkErrorStatus(error)
        if (status) return { ok: false, status }
        // Never surface SDK messages: they can include the upstream body.
        throw codedError('OpenRouter request could not be completed', 'OPENROUTER_NETWORK')
      },
    )
  pending.catch(() => {})

  try {
    return await raceWithTimeout(pending, timeoutMs, () => controller.abort())
  } catch (error) {
    controller.abort()
    throw error
  }
}

async function completeJson({
  apiKey,
  model,
  referer,
  locale,
  query,
  retry = false,
  deadline,
  rateLimitRetries,
  rateLimitBackoffMs,
}) {
  const retries = rateLimitRetryCount({ rateLimitRetries })
  const backoffs = rateLimitBackoffList({ rateLimitBackoffMs })
  let lastHttpError

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (remainingMs(deadline) <= 1) {
      throw codedError('OpenRouter request timed out', 'OPENROUTER_TIMEOUT')
    }

    const outcome = await sendCompletion({
      apiKey,
      model,
      referer,
      locale,
      query,
      retry,
      deadline,
    })

    if (!outcome.ok) {
      console.error(`[openrouter] HTTP ${outcome.status}`)
      lastHttpError = codedError('OpenRouter request was rejected', 'OPENROUTER_HTTP', outcome.status)
      // Default: no 429 retries. A rate-limited free model often queues for tens of
      // seconds before 429; retrying would burn the abort budget. Tests may override.
      if (outcome.status === 429 && attempt < retries) {
        const backoff = backoffs[Math.min(attempt, backoffs.length - 1)] || 0
        const wait = Math.min(backoff, Math.max(0, remainingMs(deadline) - 250))
        if (wait > 0) {
          await delay(wait)
          continue
        }
      }
      throw lastHttpError
    }

    const content = outcome.result?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      throw codedError('OpenRouter returned an empty completion', 'EMPTY_COMPLETION')
    }

    try {
      return parseModelJson(content)
    } catch {
      throw codedError('OpenRouter completion was not JSON', 'BAD_COMPLETION')
    }
  }

  throw lastHttpError || codedError('OpenRouter request was rejected', 'OPENROUTER_HTTP')
}

export async function lookupWithOpenRouter(query, options = {}) {
  const locale = resolveLocale(options.locale)
  const { apiKey, model, referer } = getOpenRouterConfig()
  if (!apiKey) {
    throw codedError('OPENROUTER_API_KEY is not set', 'NO_API_KEY')
  }

  const budgetMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : REQUEST_BUDGET_MS
  const deadline = Date.now() + budgetMs
  const retryOpts = {
    rateLimitRetries: options.rateLimitRetries,
    rateLimitBackoffMs: options.rateLimitBackoffMs,
  }

  const run = (async () => {
    let parsed = await completeJson({
      apiKey,
      model,
      referer,
      locale,
      query,
      deadline,
      ...retryOpts,
    })
    if (!completionMatchesLocale(parsed, locale) && remainingMs(deadline) >= LANGUAGE_RETRY_MIN_MS) {
      try {
        const retried = await completeJson({
          apiKey,
          model,
          referer,
          locale,
          query,
          retry: true,
          deadline,
          ...retryOpts,
        })
        if (completionMatchesLocale(retried, locale)) {
          parsed = retried
        }
      } catch {
        // Keep the first completion if the language retry fails.
      }
    }
    return normalizeModelResult(query, parsed, model, locale)
  })()
  run.catch(() => {})

  return raceWithTimeout(run, remainingMs(deadline))
}

function namedFrom(sources) {
  return sanitizeSources(sources).map(recognizeCitation).filter(sourceHasNamedAuthority)
}

function rulingStances(item) {
  const stances = new Set()
  const add = (value) => {
    const stance = sanitizeVerdict(value)
    if (stance === 'halal' || stance === 'haram') stances.add(stance)
  }
  for (const source of item.sources || []) add(source.stance)
  for (const position of item.positions || []) {
    add(position.stance)
    for (const source of position.sources || []) add(source.stance)
  }
  return stances
}

export function normalizeModelResult(query, parsed, model, locale = 'en') {
  const resolved = resolveLocale(locale)
  const copy = localeCopy(resolved)
  const rawSources = Array.isArray(parsed?.sources) ? parsed.sources : []
  const rawPositions = Array.isArray(parsed?.positions) ? parsed.positions : []
  const named = namedFrom(rawSources)
  const positionsIn = rawPositions
    .map((position) => ({
      ...position,
      sources: namedFrom(position?.sources),
    }))
    .filter((position) => position.sources.length > 0)

  const hadCitations =
    rawSources.length > 0 || rawPositions.some((position) => (position?.sources || []).length > 0)

  const item = {
    sources: named,
    positions: positionsIn,
  }

  let verdict = sanitizeVerdict(parsed?.verdict)
  let confidence = sanitizeConfidence(parsed?.confidence)
  const caveats = Array.isArray(parsed?.caveats) ? parsed.caveats.map(String).slice(0, 8) : []

  if (named.length === 0 && positionsIn.length === 0) {
    verdict = 'unclear'
    confidence = Math.min(confidence, 0.35)
    caveats.push(hadCitations ? copy.unnamedDropped : copy.noCitationsReturned)
  }

  const stances = rulingStances(item)
  const conflict = stances.size >= 2
  if (conflict) verdict = 'unclear'
  else if (named.length > 0 || positionsIn.length > 0) {
    if (stances.size === 0) {
      verdict = 'unclear'
      confidence = Math.min(confidence, 0.45)
    } else if (
      stances.size === 1 &&
      (verdict === 'halal' || verdict === 'haram') &&
      verdict !== [...stances][0]
    ) {
      verdict = 'unclear'
      confidence = Math.min(confidence, 0.4)
      caveats.push(copy.stanceMismatch)
    }
  }

  for (const position of positionsIn) {
    if (isNamedAuthority(position.accordingTo)) continue
    const names = [
      ...new Set(
        position.sources.map((source) => source.authority).filter((authority) => isNamedAuthority(authority)),
      ),
    ]
    if (names.length) position.accordingTo = names.join('; ')
  }

  if (parsed?.conflict === true && !conflict && (named.length > 0 || positionsIn.length > 0)) {
    caveats.push(copy.oneSidedConflict)
  }

  const positions = conflict ? buildPositions(item, resolved) : []
  const labels = [
    ...new Set(
      [...named, ...positionsIn.flatMap((position) => position.sources)]
        .map((source) => source.authority)
        .filter((authority) => isNamedAuthority(authority)),
    ),
  ]
  const rawAccording = String(parsed?.accordingTo || '').trim()
  const accordingTo = isNamedAuthority(rawAccording)
    ? rawAccording
    : labels.join('; ') || copy.accordingToFallback

  return {
    query,
    verdict,
    confidence,
    title: String(parsed?.title || query).slice(0, 180),
    summary: String(parsed?.summary || '').slice(0, 1200),
    accordingTo: accordingTo.slice(0, 600),
    caveats,
    sources: named,
    positions,
    conflict,
    sourcePath: 'ai',
    model,
    locale: resolved,
  }
}

function parseModelJson(content) {
  const trimmed = String(content).trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : trimmed
  return JSON.parse(raw)
}

function sanitizeVerdict(value) {
  const v = String(value || '').toLowerCase()
  if (v === 'halal' || v === 'haram' || v === 'unclear') return v
  return 'unclear'
}

function sanitizeConfidence(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0.4
  return Math.max(0.05, Math.min(0.95, n))
}

function sanitizeSources(sources) {
  if (!Array.isArray(sources)) return []
  return sources.slice(0, 8).map((source) => ({
    authority: String(source?.authority || '').slice(0, 160),
    name: String(source?.name || 'Citation').slice(0, 180),
    stance: sanitizeVerdict(source?.stance || 'unclear'),
    url: sanitizeUrl(source?.url),
    excerpt: String(source?.excerpt || '').slice(0, 400),
  }))
}

function sanitizeUrl(url) {
  try {
    const parsed = new URL(String(url))
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString()
  } catch {
    // fall through
  }
  return ''
}
