export const THEME_STORAGE_KEY = 'themePreference'
export const LANGUAGE_STORAGE_KEY = 'languagePreference'
export const HOW_THIS_WORKS_STORAGE_KEY = 'howThisWorksDismissed'
export const PLAIN_EXPLANATIONS_STORAGE_KEY = 'plainExplanationsPreference'

import type { Direction, Locale } from '../../lib/types.ts'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ColorMode = 'light' | 'dark'

export interface LanguageOption {
  code: Locale
  dir: Direction
  nativeLabel: string
}

export const THEME_OPTIONS: readonly ThemePreference[] = ['light', 'dark', 'system']

/** Mirrors of the localStorage keys so the server can render the right language and theme. */
const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function writePreferenceCookie(name: string, value: string): void {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; samesite=lax`
  } catch {
    // Ignore SSR / blocked cookies.
  }
}

export function isThemeOption(value: unknown): value is ThemePreference {
  return (THEME_OPTIONS as readonly unknown[]).includes(value)
}

export function isLanguageCode(value: unknown): value is Locale {
  return LANGUAGES.some((item) => item.code === value)
}

export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', dir: 'ltr', nativeLabel: 'English' },
  { code: 'ar', dir: 'rtl', nativeLabel: 'العربية' },
  { code: 'de', dir: 'ltr', nativeLabel: 'Deutsch' },
  { code: 'fr', dir: 'ltr', nativeLabel: 'Français' },
]

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeOption(stored)) return stored
  } catch {
    // Ignore private-mode / SSR.
  }
  return 'system'
}

export function writeThemePreference(value: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    // Ignore quota / private-mode.
  }
  writePreferenceCookie(THEME_STORAGE_KEY, value)
}

export function readLanguage(): Locale {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguageCode(stored)) return stored
  } catch {
    // Ignore private-mode / SSR.
  }
  return 'en'
}

export function writeLanguage(value: Locale): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
  } catch {
    // Ignore quota / private-mode.
  }
  writePreferenceCookie(LANGUAGE_STORAGE_KEY, value)
}

export function readHowThisWorksDismissed(): boolean {
  try {
    return localStorage.getItem(HOW_THIS_WORKS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeHowThisWorksDismissed(): void {
  try {
    localStorage.setItem(HOW_THIS_WORKS_STORAGE_KEY, '1')
  } catch {
    // Ignore quota / private-mode.
  }
}

/** Missing or unknown values default ON for first-time visitors. */
export function parsePlainExplanationsPreference(stored: string | null | undefined): boolean {
  if (stored === '0' || stored === 'false' || stored === 'off') return false
  return true
}

export function readPlainExplanationsPreference(): boolean {
  try {
    return parsePlainExplanationsPreference(localStorage.getItem(PLAIN_EXPLANATIONS_STORAGE_KEY))
  } catch {
    return true
  }
}

export function writePlainExplanationsPreference(enabled: boolean): void {
  try {
    localStorage.setItem(PLAIN_EXPLANATIONS_STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // Ignore quota / private-mode.
  }
}

const DEFAULT_LANGUAGE: LanguageOption = { code: 'en', dir: 'ltr', nativeLabel: 'English' }

export function languageMeta(code: unknown): LanguageOption {
  return LANGUAGES.find((item) => item.code === code) ?? DEFAULT_LANGUAGE
}

export function resolveColorMode(preference: ThemePreference, systemDark: boolean): ColorMode {
  if (preference === 'light' || preference === 'dark') return preference
  return systemDark ? 'dark' : 'light'
}

export function applyDocumentChrome({
  language,
  direction,
  mode,
}: {
  language: Locale
  direction: Direction
  mode: ColorMode
}): void {
  const root = document.documentElement
  root.lang = language
  root.dir = direction
  root.dataset.theme = mode
  document.body.dir = direction
  document.body.lang = language
  const themeColor = mode === 'dark' ? '#0B0F1D' : '#F1F3F7'
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', themeColor)
}
