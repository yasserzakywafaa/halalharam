'use client'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { createAppTheme } from './theme.js'
import {
  applyDocumentChrome,
  languageMeta,
  readLanguage,
  readPlainExplanationsPreference,
  readThemePreference,
  resolveColorMode,
  writeLanguage,
  writePlainExplanationsPreference,
  writeThemePreference,
} from './preferences.js'
import { ensureArabicFont } from './fonts.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { createI18n } from './i18n/index.js'

const emotionOptions = {
  ltr: { key: 'muiltr' },
  rtl: { key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] },
}

const ColorModeContext = createContext({
  themePreference: 'system',
  mode: 'light',
  setThemePreference: () => {},
})

const LocaleContext = createContext({
  language: 'en',
  direction: 'ltr',
  setLanguage: () => {},
})

const PlainExplanationsContext = createContext({
  plainExplanations: true,
  setPlainExplanations: () => {},
})

export function useColorMode() {
  return useContext(ColorModeContext)
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function usePlainExplanations() {
  return useContext(PlainExplanationsContext)
}

/**
 * The server renders with the SSR emotion cache for the cookie direction.
 * If the reader switches direction later, a client-only cache for the other
 * direction takes over (same swap the Vite build did with two caches).
 */
function EmotionDirection({ initialDirection, direction, children }) {
  const [swapCaches] = useState(() => ({}))
  if (direction === initialDirection) return children
  swapCaches[direction] ||= createCache(emotionOptions[direction])
  return <CacheProvider value={swapCaches[direction]}>{children}</CacheProvider>
}

/**
 * @param {{ initialLanguage?: string, initialThemePreference?: string, children: React.ReactNode }} props
 * Initial values come from the preference cookies so the server HTML already has the
 * right language, direction, and (for an explicit Light/Dark choice) colors.
 */
export default function AppProviders({ initialLanguage = 'en', initialThemePreference = 'system', children }) {
  const [themePreference, setThemePreferenceState] = useState(initialThemePreference)
  const [language, setLanguageState] = useState(initialLanguage)
  // Defaults on the server and on the hydration pass; synced from the browser right after.
  const [plainExplanations, setPlainExplanationsState] = useState(true)
  const [systemDark, setSystemDark] = useState(false)
  const [i18n] = useState(() => createI18n(initialLanguage))
  const [initialDirection] = useState(() => languageMeta(initialLanguage).dir)

  useEffect(() => {
    // localStorage stays the source of truth; refresh the cookie mirror if it drifted.
    const storedLanguage = readLanguage()
    if (storedLanguage !== initialLanguage) {
      writeLanguage(storedLanguage)
      setLanguageState(storedLanguage)
    }
    const storedTheme = readThemePreference()
    if (storedTheme !== initialThemePreference) {
      writeThemePreference(storedTheme)
      setThemePreferenceState(storedTheme)
    }
    setPlainExplanationsState(readPlainExplanationsPreference())

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(media.matches)
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
    // Mount-only: initial values are fixed for this tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mode = resolveColorMode(themePreference, systemDark)
  const direction = languageMeta(language).dir
  const theme = useMemo(() => createAppTheme(mode, direction), [mode, direction])

  useEffect(() => {
    applyDocumentChrome({ language, direction, mode })
    if (language === 'ar') ensureArabicFont()
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [i18n, language, direction, mode])

  const colorMode = useMemo(
    () => ({
      themePreference,
      mode,
      setThemePreference: (next) => {
        writeThemePreference(next)
        setThemePreferenceState(next)
      },
    }),
    [themePreference, mode],
  )

  const locale = useMemo(
    () => ({
      language,
      direction,
      setLanguage: (next) => {
        writeLanguage(next)
        setLanguageState(next)
      },
    }),
    [language, direction],
  )

  const plainExplanationsValue = useMemo(
    () => ({
      plainExplanations,
      setPlainExplanations: (next) => {
        writePlainExplanationsPreference(next)
        setPlainExplanationsState(Boolean(next))
      },
    }),
    [plainExplanations],
  )

  return (
    <AppRouterCacheProvider options={emotionOptions[initialDirection]}>
      <EmotionDirection initialDirection={initialDirection} direction={direction}>
        <I18nextProvider i18n={i18n}>
          <ColorModeContext.Provider value={colorMode}>
            <LocaleContext.Provider value={locale}>
              <PlainExplanationsContext.Provider value={plainExplanationsValue}>
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <ErrorBoundary>{children}</ErrorBoundary>
                </ThemeProvider>
              </PlainExplanationsContext.Provider>
            </LocaleContext.Provider>
          </ColorModeContext.Provider>
        </I18nextProvider>
      </EmotionDirection>
    </AppRouterCacheProvider>
  )
}
