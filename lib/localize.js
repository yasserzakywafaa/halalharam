import seedI18n from '../data/seed-rulings.i18n.json' with { type: 'json' }
import { DEFAULT_LOCALE, localeCopy, resolveLocale } from './locale.js'

export function seedDisclaimerFor(locale) {
  const resolved = resolveLocale(locale)
  return seedI18n.disclaimer?.[resolved] || seedI18n.disclaimer?.[DEFAULT_LOCALE] || ''
}

export function localizedAppDisclaimer(locale) {
  const copy = localeCopy(locale)
  const seed = seedDisclaimerFor(locale)
  return seed ? `${copy.appDisclaimer} ${seed}` : copy.appDisclaimer
}

function overlaySource(source, translated) {
  if (!translated) return source
  return {
    ...source,
    authority: translated.authority || source.authority,
    name: translated.name || source.name,
    excerpt: translated.excerpt || source.excerpt,
  }
}

function localizeSources(sources, translatedSources) {
  if (!Array.isArray(sources) || !sources.length) return sources || []
  if (!Array.isArray(translatedSources) || !translatedSources.length) return sources

  const byUrl = new Map()
  for (const extra of translatedSources) {
    if (extra?.url) byUrl.set(String(extra.url), extra)
  }

  return sources.map((source, index) => {
    const extra = (source.url && byUrl.get(String(source.url))) || translatedSources[index]
    return overlaySource(source, extra)
  })
}

function localizePosition(position, translated) {
  if (!translated) return position
  return {
    ...position,
    title: translated.title || position.title,
    summary: translated.summary || position.summary,
    accordingTo: translated.accordingTo || position.accordingTo,
    sources: localizeSources(position.sources, translated.sources),
  }
}

export function localizeSeedItem(item, locale) {
  const resolved = resolveLocale(locale)
  if (!item || resolved === DEFAULT_LOCALE) return item

  const translated = seedI18n.items?.[item.id]?.[resolved]
  if (!translated) return item

  const localizedPositions = Array.isArray(item.positions)
    ? item.positions.map((position) => {
        const extra = (translated.positions || []).find((entry) => entry.stance === position.stance)
        return localizePosition(position, extra)
      })
    : item.positions

  return {
    ...item,
    title: translated.title || item.title,
    summary: translated.summary || item.summary,
    accordingTo: translated.accordingTo || item.accordingTo,
    caveats: Array.isArray(translated.caveats) ? translated.caveats : item.caveats,
    sources: localizeSources(item.sources, translated.sources),
    positions: localizedPositions,
  }
}
