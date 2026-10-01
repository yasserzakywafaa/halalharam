import { collectSources, sourceHasNamedAuthority } from './authorities.js'
import { DEFAULT_LOCALE, positionTitleForStance } from './locale.js'

function sanitizeVerdict(value) {
  const v = String(value || '').toLowerCase()
  if (v === 'halal' || v === 'haram' || v === 'unclear') return v
  return 'unclear'
}

export function stancesIn(sources) {
  return [...new Set((sources || []).map((source) => sanitizeVerdict(source.stance)))]
}

export function buildPositions(item, locale = DEFAULT_LOCALE) {
  if (Array.isArray(item.positions) && item.positions.length >= 2) {
    return item.positions.map((position) => ({
      stance: sanitizeVerdict(position.stance),
      title: String(position.title || '').slice(0, 180),
      summary: String(position.summary || '').slice(0, 800),
      accordingTo: String(position.accordingTo || '').slice(0, 400),
      sources: position.sources || [],
    }))
  }

  const sources = collectSources(item)
  const groups = { halal: [], haram: [], unclear: [] }
  for (const source of sources) {
    groups[sanitizeVerdict(source.stance)].push(source)
  }

  const filled = Object.entries(groups)
    .filter(([, list]) => list.length)
    .map(([stance, list]) => ({
      stance,
      title: positionTitleForStance(stance, locale),
      summary: list.map((source) => source.excerpt).filter(Boolean).slice(0, 2).join(' '),
      accordingTo: [...new Set(list.map((source) => source.authority).filter(Boolean))].join('; '),
      sources: list,
    }))

  return filled.length >= 2 ? filled : []
}

export function hasConflict(item) {
  if (item.conflict === false) return false
  if (item.conflict === true) return true
  if (Array.isArray(item.positions) && item.positions.length >= 2) return true
  return stancesIn(collectSources(item)).filter((stance) => stance === 'halal' || stance === 'haram').length >= 2
}

export function namedSourceCount(item) {
  return collectSources(item).filter(sourceHasNamedAuthority).length
}
