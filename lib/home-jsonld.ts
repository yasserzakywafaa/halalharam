import { LANGUAGES } from '../src/client/preferences.ts'
import { messages } from '../src/client/i18n/messages.ts'
import { SITE_ORIGIN } from './public-pages.ts'

const homeUrl = `${SITE_ORIGIN}/`
const how = messages.en.how
const footer = messages.en.footer

/**
 * Home-document structured data only.
 * Copy is the same English the page shows. No medical or religious authority claim.
 */
export const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${homeUrl}#website`,
      name: messages.en.brand,
      url: homeUrl,
      description: footer.note,
      inLanguage: LANGUAGES.map((language) => language.code),
    },
    {
      '@type': 'WebApplication',
      '@id': `${homeUrl}#app`,
      name: messages.en.brand,
      url: homeUrl,
      applicationCategory: 'ReferenceApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      isPartOf: { '@id': `${homeUrl}#website` },
      description: how.body,
    },
    {
      '@type': 'FAQPage',
      '@id': `${homeUrl}#how-this-works`,
      url: homeUrl,
      isPartOf: { '@id': `${homeUrl}#website` },
      mainEntity: [
        {
          '@type': 'Question',
          name: how.title,
          acceptedAnswer: {
            '@type': 'Answer',
            text: how.body,
          },
        },
      ],
    },
  ],
}
