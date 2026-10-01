export const THEME_STORAGE_KEY = 'themePreference'
export const LANGUAGE_STORAGE_KEY = 'languagePreference'
export const HOW_THIS_WORKS_STORAGE_KEY = 'howThisWorksDismissed'
export const PLAIN_EXPLANATIONS_STORAGE_KEY = 'plainExplanationsPreference'

export const THEME_OPTIONS = ['light', 'dark', 'system']

/** Mirrors of the localStorage keys so the server can render the right language and theme. */
const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function writePreferenceCookie(name, value) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; samesite=lax`
  } catch {
    // Ignore SSR / blocked cookies.
  }
}

export function isThemeOption(value) {
  return THEME_OPTIONS.includes(value)
}

export function isLanguageCode(value) {
  return LANGUAGES.some((item) => item.code === value)
}

export const LANGUAGES = [
  { code: 'en', dir: 'ltr', nativeLabel: 'English' },
  { code: 'ar', dir: 'rtl', nativeLabel: 'العربية' },
  { code: 'de', dir: 'ltr', nativeLabel: 'Deutsch' },
  { code: 'fr', dir: 'ltr', nativeLabel: 'Français' },
]

export function readThemePreference() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeOption(stored)) return stored
  } catch {
    // Ignore private-mode / SSR.
  }
  return 'system'
}

export function writeThemePreference(value) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    // Ignore quota / private-mode.
  }
  writePreferenceCookie(THEME_STORAGE_KEY, value)
}

export function readLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguageCode(stored)) return stored
  } catch {
    // Ignore private-mode / SSR.
  }
  return 'en'
}

export function writeLanguage(value) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
  } catch {
    // Ignore quota / private-mode.
  }
  writePreferenceCookie(LANGUAGE_STORAGE_KEY, value)
}

export function readHowThisWorksDismissed() {
  try {
    return localStorage.getItem(HOW_THIS_WORKS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeHowThisWorksDismissed() {
  try {
    localStorage.setItem(HOW_THIS_WORKS_STORAGE_KEY, '1')
  } catch {
    // Ignore quota / private-mode.
  }
}

/** Missing or unknown values default ON for first-time visitors. */
export function parsePlainExplanationsPreference(stored) {
  if (stored === '0' || stored === 'false' || stored === 'off') return false
  return true
}

export function readPlainExplanationsPreference() {
  try {
    return parsePlainExplanationsPreference(localStorage.getItem(PLAIN_EXPLANATIONS_STORAGE_KEY))
  } catch {
    return true
  }
}

export function writePlainExplanationsPreference(enabled) {
  try {
    localStorage.setItem(PLAIN_EXPLANATIONS_STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // Ignore quota / private-mode.
  }
}

export function languageMeta(code) {
  return LANGUAGES.find((item) => item.code === code) || LANGUAGES[0]
}

export function resolveColorMode(preference, systemDark) {
  if (preference === 'light' || preference === 'dark') return preference
  return systemDark ? 'dark' : 'light'
}

export function applyDocumentChrome({ language, direction, mode }) {
  const root = document.documentElement
  root.lang = language
  root.dir = direction
  root.dataset.theme = mode
  document.body.dir = direction
  document.body.lang = language
  const themeColor = mode === 'dark' ? '#121A17' : '#F3EBDA'
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', themeColor)
}
