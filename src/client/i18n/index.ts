import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { messages } from './messages.ts'

const resources = Object.fromEntries(
  Object.entries(messages).map(([lng, translation]) => [
    lng,
    {
      translation,
      // Sibling apps (and @yasserzakywafaa/client-core switchers) read the "common" namespace.
      common: translation,
    },
  ]),
)

/**
 * One i18next instance per React tree. The server renders with the language
 * from the `languagePreference` cookie, so a shared module singleton would leak
 * one request's language into another.
 */
export function createI18n(lng = 'en') {
  const instance = i18next.createInstance()
  instance.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    ns: ['translation', 'common'],
    defaultNS: 'translation',
    fallbackNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
    // Resources are inline, so init synchronously and render translated on the first pass.
    initAsync: false,
  })
  return instance
}
