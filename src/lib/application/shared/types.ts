/** Shared domain types for the verdict lookup (server, API, and client). */

export type Locale = 'en' | 'ar' | 'de' | 'fr'
export type Direction = 'ltr' | 'rtl'
export type Verdict = 'halal' | 'haram' | 'unclear'
/** `guard`: rejected by the input screen before any lookup. */
export type SourcePath = 'seed' | 'ai' | 'unavailable' | 'guard'
export type UnavailableReason = 'no_api_key' | 'ai_error' | 'ai_rate_limited'

export interface Citation {
  authority: string
  name: string
  stance?: Verdict | string
  url: string
  excerpt?: string
}

export interface Position {
  stance: Verdict | string
  title: string
  summary: string
  accordingTo: string
  sources: Citation[]
}

/** Anything that carries citations directly and/or through positions. */
export interface CitationHolder {
  sources?: Citation[]
  positions?: Array<Partial<Position> & { sources?: Citation[] }>
  conflict?: boolean
}

/** One entry of src/lib/server/data/seed-rulings.json. */
export interface SeedItem extends CitationHolder {
  id: string
  aliases: string[]
  verdict: Verdict
  confidence: number
  conflict?: boolean
  title: string
  summary: string
  accordingTo: string
  caveats?: string[]
  sources?: Citation[]
  positions?: Position[]
  [key: string]: unknown
}

export interface SeedFile {
  version?: number | string
  disclaimer?: string
  items: SeedItem[]
}

/** Result of a seed match or an AI lookup, before `finalize`. */
export interface DraftVerdict {
  query: string
  verdict: Verdict
  confidence: number
  title: string
  summary: string
  accordingTo: string
  caveats: string[]
  sources: Citation[]
  positions: Position[]
  conflict: boolean
  sourcePath: SourcePath
  unavailableReason?: UnavailableReason | null
  seedId?: string | null
  model?: string | null
  locale: Locale
  /** True when the query is not a halal/haram question (or tried to steer the model). No ruling is shown. */
  outOfScope?: boolean
}

/** What `/api/v1/verdict` and the `lookupVerdict` server action return on success. */
export interface VerdictResponse {
  query: string
  normalizedQuery: string
  verdict: Verdict
  confidence: number
  lowConfidence: boolean
  conflict: boolean
  sourcePath: SourcePath
  unavailableReason: UnavailableReason | null
  /** True when the query is not a halal/haram question. The page shows a notice, never a ruling. */
  outOfScope: boolean
  seedId: string | null
  model: string | null
  locale: Locale
  title: string
  summary: string
  accordingTo: string
  caveats: string[]
  sources: Citation[]
  positions: Position[]
  disclaimer: string
  status?: undefined
}

/** Validation / rate-limit failures. Returned (never thrown) by the server action. */
export interface VerdictErrorPayload {
  error: string
  status: number
  code?: string
  locale?: Locale
  retryAfterSeconds?: number
}

export type VerdictResult = VerdictResponse | VerdictErrorPayload

export interface LibraryEntry {
  id: string
  label: string
  query: string
  title: string
  verdict: Verdict
  conflict: boolean
}

export interface SeedExample {
  id: string
  label: string
  title: string
  verdict: Verdict
}

export interface HealthPayload {
  ok: true
  service: string
  openRouterKeyPresent: boolean
  openRouterConfigured: boolean
  model: string
  locale: Locale
  examples: SeedExample[]
  library: LibraryEntry[]
}

/** Error with the `code` / `status` fields this codebase attaches. */
export interface CodedError extends Error {
  code?: string
  status?: number
  cause?: unknown
}

/** Plain lower-cased header bag (`clientKey`, locale detection). */
export type HeaderBag = Record<string, string | string[] | undefined>
