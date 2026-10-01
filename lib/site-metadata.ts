import { messages } from '../src/client/i18n/messages.ts'
import { SITE_ORIGIN } from './public-pages.ts'

const seo = messages.en.seo

/**
 * Default (English) share metadata for crawlers that do not run JavaScript.
 * The client swaps title and description to the active language after hydration.
 */
export const siteMetadata = {
  origin: SITE_ORIGIN,
  name: messages.en.brand,
  title: seo.title,
  description: seo.description,
  themeColorLight: '#F1F3F7',
  themeColorDark: '#0B0F1D',
  ogImage: {
    url: `${SITE_ORIGIN}/og.png`,
    width: 1200,
    height: 630,
    alt: 'Halal-Haram ask-mark on a cream field. Cited, not a fatwa mill.',
  },
  ogLocale: 'en_US',
  ogAlternateLocales: ['ar_AR', 'de_DE', 'fr_FR'],
}

/** Per-page titles for the two prose documents. */
export const pageTitles = {
  '/about': `${messages.en.nav.about} · ${messages.en.brand}`,
  '/privacy': `${messages.en.nav.privacy} · ${messages.en.brand}`,
}
