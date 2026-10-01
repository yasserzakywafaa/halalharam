import { matchSeed } from './matchSeed.ts'
import { lookupWithOpenRouter } from '../../ai/openRouterClient.ts'
import { namedSourceCount } from './positions.ts'
import {
  aiFailedMessage,
  DEFAULT_LOCALE,
  localeCopy,
  resolveLocale,
} from '../../utils/locale.ts'
import { localizedAppDisclaimer } from './localize.ts'
import type {
  CodedError,
  DraftVerdict,
  Locale,
  UnavailableReason,
  VerdictErrorPayload,
  VerdictResponse,
} from '../../application/shared/types.ts'

export interface GetVerdictOptions {
  locale?: unknown
  timeoutMs?: number
  rateLimitRetries?: number
  rateLimitBackoffMs?: number[]
}

const LOW_CONFIDENCE_THRESHOLD = 0.7

export const APP_DISCLAIMER = localeCopy(DEFAULT_LOCALE).appDisclaimer

export async function getVerdict(
  rawQuery: unknown,
  options: GetVerdictOptions = {},
): Promise<VerdictResponse | VerdictErrorPayload> {
  const locale = resolveLocale(options.locale)
  const copy = localeCopy(locale)
  const query = String(rawQuery || '').trim()
  if (query.length < 2) {
    return {
      error: copy.queryTooShort,
      status: 400,
      locale,
    }
  }
  if (query.length > 200) {
    return {
      error: copy.queryTooLong,
      status: 400,
      locale,
    }
  }

  const seeded = matchSeed(query, locale)
  if (seeded) {
    return finalize(query, seeded, locale)
  }

  try {
    const ai = await lookupWithOpenRouter(query, {
      locale,
      timeoutMs: options.timeoutMs,
      rateLimitRetries: options.rateLimitRetries,
      rateLimitBackoffMs: options.rateLimitBackoffMs,
    })
    return finalize(query, ai, locale)
  } catch (caught) {
    const error = caught as CodedError
    if (error.code === 'NO_API_KEY') {
      return finalize(query, unavailableResult(query, copy.noKey, locale, 'no_api_key'), locale)
    }
    console.error('[verdict] openrouter failed', error.code || 'UNKNOWN', error.status || '')
    const rateLimited = error.code === 'OPENROUTER_HTTP' && error.status === 429
    return finalize(
      query,
      unavailableResult(
        query,
        rateLimited ? copy.aiBusy : aiFailedMessage(locale),
        locale,
        rateLimited ? 'ai_rate_limited' : 'ai_error',
      ),
      locale,
    )
  }
}

export function timedOutVerdict(rawQuery: unknown, locale?: unknown): VerdictResponse {
  const resolved = resolveLocale(locale)
  const query = String(rawQuery || '').trim() || 'lookup'
  return finalize(query, unavailableResult(query, aiFailedMessage(resolved), resolved, 'ai_error'), resolved)
}

function unavailableResult(
  query: string,
  summary: string,
  locale: Locale,
  reason: UnavailableReason,
): DraftVerdict {
  const copy = localeCopy(locale)
  return {
    query,
    verdict: 'unclear',
    confidence: 0.15,
    title: query,
    summary,
    accordingTo: copy.noAuthority,
    caveats: [copy.missingLookup],
    sources: [],
    positions: [],
    conflict: false,
    sourcePath: 'unavailable',
    unavailableReason: reason,
    locale,
  }
}

function finalize(originalQuery: string, result: DraftVerdict, locale: Locale): VerdictResponse {
  const confidence = Number(result.confidence) || 0
  const conflict = Boolean(result.conflict)
  const lowConfidence =
    result.verdict === 'unclear' ||
    conflict ||
    confidence < LOW_CONFIDENCE_THRESHOLD ||
    result.sourcePath === 'unavailable' ||
    namedSourceCount(result) < 1

  return {
    query: originalQuery,
    normalizedQuery: result.query,
    verdict: conflict ? 'unclear' : result.verdict,
    confidence,
    lowConfidence,
    conflict,
    sourcePath: result.sourcePath,
    unavailableReason: result.unavailableReason || null,
    seedId: result.seedId || null,
    model: result.model || null,
    locale: result.locale || locale,
    title: result.title,
    summary: result.summary,
    accordingTo: result.accordingTo,
    caveats: result.caveats || [],
    sources: result.sources || [],
    positions: result.positions || [],
    disclaimer: localizedAppDisclaimer(locale),
  }
}
