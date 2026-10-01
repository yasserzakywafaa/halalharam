import { localeFromAcceptLanguage, resolveLocale } from '../../utils/locale.ts'
import { listLibrary, listSeedExamples } from '../verdict/matchSeed.ts'
import { openRouterPublicStatus } from '../../ai/openRouterClient.ts'
import type { HeaderBag, HealthPayload, Locale } from '../../application/shared/types.ts'

interface LocaleSource {
  url?: string
  headers?: Headers | HeaderBag
}

function acceptLanguage(headers: LocaleSource['headers']): string | string[] | undefined {
  if (!headers) return undefined
  if (headers instanceof Headers) return headers.get('accept-language') ?? undefined
  return headers['accept-language'] || headers['Accept-Language']
}

export function localeFromRequest(req?: LocaleSource | null): Locale {
  const url = new URL(req?.url || '/', 'http://localhost')
  return resolveLocale(
    url.searchParams.get('locale') ||
      url.searchParams.get('lang') ||
      localeFromAcceptLanguage(acceptLanguage(req?.headers)),
  )
}

export function buildHealthPayload(locale: Locale): HealthPayload {
  return {
    ok: true,
    service: 'halalharam',
    ...openRouterPublicStatus(),
    locale,
    examples: listSeedExamples(locale),
    library: listLibrary(locale),
  }
}

/** `/api/v1/health` Route Handler: Web `Request` in, Web `Response` out. */
export function handleHealthRequest(request: Request): Response {
  return Response.json(buildHealthPayload(localeFromRequest(request)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
