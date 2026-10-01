'use client'

import createCache, { type EmotionCache, type Options as EmotionCacheOptions } from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Direction, Locale } from '../../lib/types.ts'
import { I18nextProvider } from 'react-i18next'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { createAppTheme } from './theme.ts'
import {
  applyDocumentChrome,
  languageMeta,
  readLanguage,
  readThemePreference,
  resolveColorMode,
  writeLanguage,
  writeThemePreference,
  type ColorMode,
  type ThemePreference,
} from './preferences.ts'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { createI18n } from './i18n/index.ts'

const emotionOptions: Record<Direction, EmotionCacheOptions> = {
  ltr: { key: 'muiltr' },
  rtl: { key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] },
}

export interface ColorModeValue {
  themePreference: ThemePreference
  mode: ColorMode
  setThemePreference: (next: ThemePreference) => void
}

export interface LocaleValue {
  language: Locale
  direction: Direction
  setLanguage: (next: Locale) => void
}

const ColorModeContext = createContext<ColorModeValue>({
  themePreference: 'system',
  mode: 'light',
  setThemePreference: () => {},
})

const LocaleContext = createContext<LocaleValue>({
  language: 'en',
  direction: 'ltr',
  setLanguage: () => {},
})

export function useColorMode(): ColorModeValue {
  return useContext(ColorModeContext)
}

export function useLocale(): LocaleValue {
  return useContext(LocaleContext)
}

/**
 * The server renders with the SSR emotion cache for the cookie direction.
 * If the reader switches direction later, a client-only cache for the other
 * direction takes over (same swap the Vite build did with two caches).
 */
function EmotionDirection({
  initialDirection,
  direction,
  children,
}: {
  initialDirection: Direction
  direction: Direction
  children: ReactNode
}) {
  const [swapCaches] = useState<Partial<Record<Direction, EmotionCache>>>(() => ({}))
  if (direction === initialDirection) return children
  const cache = (swapCaches[direction] ||= createCache(emotionOptions[direction]))
  return <CacheProvider value={cache}>{children}</CacheProvider>
}

export interface AppProvidersProps {
  initialLanguage?: Locale
  initialThemePreference?: ThemePreference
  children: ReactNode
}

/**
 * Initial values come from the preference cookies so the server HTML already has the
 * right language, direction, and (for an explicit Light/Dark choice) colors.
 */
export default function AppProviders({
  initialLanguage = 'en',
  initialThemePreference = 'system',
  children,
}: AppProvidersProps) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(initialThemePreference)
  const [language, setLanguageState] = useState<Locale>(initialLanguage)
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
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [i18n, language, direction, mode])

  const colorMode = useMemo<ColorModeValue>(
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

  const locale = useMemo<LocaleValue>(
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

  return (
    <AppRouterCacheProvider options={emotionOptions[initialDirection]}>
      <EmotionDirection initialDirection={initialDirection} direction={direction}>
        <I18nextProvider i18n={i18n}>
          <ColorModeContext.Provider value={colorMode}>
            <LocaleContext.Provider value={locale}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <ErrorBoundary>{children}</ErrorBoundary>
              </ThemeProvider>
            </LocaleContext.Provider>
          </ColorModeContext.Provider>
        </I18nextProvider>
      </EmotionDirection>
    </AppRouterCacheProvider>
  )
}
