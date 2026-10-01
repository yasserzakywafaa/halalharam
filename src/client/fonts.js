/** Latin faces used on first paint. Arabic is loaded only when the UI is Arabic. */
export const LATIN_FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,650&family=Source+Sans+3:wght@400;600;700&display=swap'

export const ARABIC_FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap'

export function ensureArabicFont() {
  if (typeof document === 'undefined') return
  if (document.head.querySelector('link[data-arabic-font]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = ARABIC_FONT_STYLESHEET
  link.dataset.arabicFont = 'true'
  document.head.appendChild(link)
}
