import { localeFromAcceptLanguage, resolveLocale } from './locale.js'
import { listLibrary, listSeedExamples } from './match-seed.js'
import { openRouterPublicStatus } from './openrouter.js'

export function localeFromRequest(req) {
  const url = new URL(req?.url || '/', 'http://localhost')
  const headers = req?.headers
  const header =
    typeof headers?.get === 'function'
      ? headers.get('accept-language')
      : headers?.['accept-language'] || headers?.['Accept-Language']
  return resolveLocale(
    url.searchParams.get('locale') || url.searchParams.get('lang') || localeFromAcceptLanguage(header),
  )
}

export function buildHealthPayload(locale) {
  return {
    ok: true,
    service: 'halal-or-haram',
    ...openRouterPublicStatus(),
    locale,
    examples: listSeedExamples(locale),
    library: listLibrary(locale),
  }
}

/** `/api/health` Route Handler: Web `Request` in, Web `Response` out. */
export function handleHealthRequest(request) {
  return Response.json(buildHealthPayload(localeFromRequest(request)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
