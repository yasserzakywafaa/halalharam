import { collectSources } from './authorities.js'

/** Preferred reading order. Any new cited origin still appears, after these. */
const ORIGIN_ORDER = [
  'https://quran.com',
  'https://sunnah.com',
  'https://islamqa.info',
  'https://www.dar-alifta.org',
  'https://seekersguidance.org',
  'https://islamqa.org',
  'https://www.islamweb.net',
  'https://www.halal.gov.my',
  'https://ifanca.org',
]

/**
 * One link per site that the starter library already cites.
 * `href` is the origin of a real citation URL — never a made-up item path.
 */
export function listCitedHomes(items) {
  const groups = new Map()
  for (const item of items || []) {
    for (const source of collectSources(item)) {
      if (!source?.url) continue
      let origin
      try {
        origin = new URL(source.url).origin
      } catch {
        continue
      }
      if (!groups.has(origin)) groups.set(origin, [])
      const authority = String(source.authority || source.name || '').trim()
      const list = groups.get(origin)
      if (authority && !list.includes(authority)) list.push(authority)
    }
  }

  return [...groups.entries()]
    .map(([href, authorities]) => ({ href, authorities }))
    .sort((a, b) => {
      const ai = ORIGIN_ORDER.indexOf(a.href)
      const bi = ORIGIN_ORDER.indexOf(b.href)
      const ar = ai === -1 ? ORIGIN_ORDER.length : ai
      const br = bi === -1 ? ORIGIN_ORDER.length : bi
      if (ar !== br) return ar - br
      return a.href.localeCompare(b.href)
    })
}
