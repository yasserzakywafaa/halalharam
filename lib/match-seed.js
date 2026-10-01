import seedFile from '../data/seed-rulings.json' with { type: 'json' }
import { collectSources } from './authorities.js'
import { DEFAULT_LOCALE, resolveLocale } from './locale.js'
import { localizeSeedItem, seedDisclaimerFor } from './localize.js'
import { normalizeQuery } from './normalize-query.js'
import { buildPositions, hasConflict } from './positions.js'

export const SEED_DISCLAIMER = seedFile.disclaimer
export { normalizeQuery }

const ALCOHOL_SEED_ID = 'alcohol'
const NON_ALCOHOLIC_BEER_SEED_IDS = ['non-alcoholic-beer', 'alcohol-free-beer']

const INTOXICANT_NEGATION = [
  /\bwithout alcohol\b/u,
  /\bwith no alcohol\b/u,
  /\bno alcohol\b/u,
  /\bnon alcoholic\b/u,
  /\bnonalcoholic\b/u,
  /\balcohol free\b/u,
  /\balcoholfree\b/u,
  /\bfree of alcohol\b/u,
  /\bzero alcohol\b/u,
  /بدون كحول/u,
  /خال من الكحول/u,
  /خالية من الكحول/u,
  /غير كحولي/u,
  /\balkoholfrei/u,
  /\bsans alcool\b/u,
  /\bsin alcohol\b/u,
]

export function queryNegatesIntoxicant(input) {
  const normalized = normalizeQuery(input)
  return INTOXICANT_NEGATION.some((pattern) => pattern.test(normalized))
}

function wholeWord(haystack, needle) {
  const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(needle)}(?:$|\\s)`, 'u')
  return pattern.test(` ${haystack} `)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const NEGATION_BEFORE = new Set(['non', 'no', 'not', 'without', 'zero'])

function aliasSpans(tokens, alias) {
  const parts = alias.split(' ').filter(Boolean)
  const spans = []
  if (!parts.length) return spans
  for (let i = 0; i <= tokens.length - parts.length; i += 1) {
    let matched = true
    for (let j = 0; j < parts.length; j += 1) {
      if (tokens[i + j] !== parts[j]) {
        matched = false
        break
      }
    }
    if (matched) spans.push({ start: i, end: i + parts.length })
  }
  return spans
}

function spanIsNegated(tokens, span) {
  const before = tokens[span.start - 1]
  const before2 = tokens[span.start - 2]
  const after = tokens[span.end]
  if (before && (NEGATION_BEFORE.has(before) || before === '0')) return true
  if (after === 'free') return true
  if (before2 === 'free' && (before === 'of' || before === 'from')) return true
  return false
}

/**
 * Label-style negation ("alcohol-free", "non-gelatin", "without interest")
 * blocks the positive seed. A longer alias on another item can still match,
 * so "alcohol-free beer" does not inherit the khamr entry.
 */
export function aliasIsNegated(normalized, alias) {
  const normalizedAlias = normalizeQuery(alias)
  if (!normalizedAlias) return false
  const tokens = String(normalized || '')
    .split(' ')
    .filter(Boolean)
  return aliasSpans(tokens, normalizedAlias).some((span) => spanIsNegated(tokens, span))
}

export function itemBlockedByNegation(normalized, item) {
  return (item.aliases || []).some((alias) => aliasIsNegated(normalized, alias))
}

/**
 * Curated seed lookup. Exact alias wins; otherwise longest whole-word alias.
 * Short aliases like "ham" will not match "hamburger".
 * Negated alcohol phrases skip the intoxicant seed (they are not khamr by keyword).
 * Negated aliases ("X-free", "non-X", "without X") do not select that seed.
 */
export function matchSeed(query, locale = DEFAULT_LOCALE) {
  const normalized = normalizeQuery(query)
  if (!normalized) return null
  const resolvedLocale = resolveLocale(locale)
  const skipIntoxicant = queryNegatesIntoxicant(normalized)

  let best = null

  for (const item of seedFile.items) {
    if (item.id === ALCOHOL_SEED_ID && skipIntoxicant) continue
    // Whole-item block for gelatin-free gummies, interest-free, etc.
    // Alcohol keeps per-alias skips so "beer-free wine" and "gin without rum"
    // still hit khamr through the un-negated drink name.
    if (item.id !== ALCOHOL_SEED_ID && itemBlockedByNegation(normalized, item)) continue

    const aliases = (item.aliases || [])
      .map(normalizeQuery)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)

    for (const alias of aliases) {
      if (item.id === ALCOHOL_SEED_ID && aliasIsNegated(normalized, alias)) continue
      if (normalized === alias) {
        return toSeedResult(item, normalized, 1, resolvedLocale)
      }
      if (wholeWord(normalized, alias)) {
        const score = alias.length / Math.max(normalized.length, 1)
        if (!best || score > best.score) {
          best = { item, score }
        }
      }
    }
  }

  if (
    !best &&
    skipIntoxicant &&
    wholeWord(normalized, 'beer') &&
    !aliasIsNegated(normalized, 'beer')
  ) {
    const alcoholFreeBeer = NON_ALCOHOLIC_BEER_SEED_IDS.map((id) =>
      seedFile.items.find((item) => item.id === id),
    ).find(Boolean)
    if (alcoholFreeBeer) {
      return toSeedResult(alcoholFreeBeer, normalized, 0.9, resolvedLocale)
    }
  }

  if (!best) return null
  return toSeedResult(best.item, normalized, Math.min(0.97, 0.75 + best.score * 0.2), resolvedLocale)
}

function toSeedResult(item, normalizedQuery, matchQuality, locale) {
  const localized = localizeSeedItem(item, locale)
  const confidence = clamp(item.confidence * matchQuality, 0.05, 0.99)
  const conflict = hasConflict(localized)
  const positions = conflict ? buildPositions(localized, locale) : []
  return {
    query: normalizedQuery,
    verdict: conflict ? 'unclear' : item.verdict,
    confidence,
    title: localized.title,
    summary: localized.summary,
    accordingTo: localized.accordingTo,
    caveats: localized.caveats || [],
    sources: collectSources(localized),
    positions,
    conflict,
    sourcePath: 'seed',
    seedId: item.id,
    locale,
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function listSeedExamples(locale = DEFAULT_LOCALE) {
  const resolved = resolveLocale(locale)
  return seedFile.items.slice(0, 8).map((item) => {
    const localized = localizeSeedItem(item, resolved)
    return {
      id: item.id,
      label: item.aliases[0],
      title: localized.title,
      verdict: item.verdict,
    }
  })
}

export function listLibrary(locale = DEFAULT_LOCALE) {
  const resolved = resolveLocale(locale)
  return seedFile.items.map((item) => {
    const localized = localizeSeedItem(item, resolved)
    return {
      id: item.id,
      label: item.aliases[0],
      query: item.aliases[0],
      title: localized.title,
      verdict: item.conflict ? 'unclear' : item.verdict,
      conflict: Boolean(item.conflict),
    }
  })
}

export { seedDisclaimerFor }
