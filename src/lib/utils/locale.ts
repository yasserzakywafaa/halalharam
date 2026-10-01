import type { Direction, Locale, Verdict } from '../application/shared/types.ts'

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'ar', 'de', 'fr']
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_META: Record<Locale, { languageName: string; dir: Direction }> = {
  en: { languageName: 'English', dir: 'ltr' },
  ar: { languageName: 'Arabic', dir: 'rtl' },
  de: { languageName: 'German', dir: 'ltr' },
  fr: { languageName: 'French', dir: 'ltr' },
}

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function resolveLocale(value?: unknown): Locale {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
  if (!raw) return DEFAULT_LOCALE
  const short = raw.split('-')[0]
  if (isLocale(short)) return short
  return DEFAULT_LOCALE
}

export function localeFromAcceptLanguage(header?: string | string[] | null): Locale {
  const raw = String(header || '')
  if (!raw) return DEFAULT_LOCALE
  const ranked = raw
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const qParam = params.find((item) => item.trim().startsWith('q='))
      const q = qParam ? Number(qParam.trim().slice(2)) : 1
      return { tag: (tag ?? '').trim(), q: Number.isFinite(q) ? q : 0 }
    })
    .filter((item) => item.tag)
    .sort((a, b) => b.q - a.q)

  for (const item of ranked) {
    const resolved = resolveLocale(item.tag)
    if (resolved !== DEFAULT_LOCALE || item.tag.toLowerCase().startsWith('en')) {
      return resolved
    }
  }
  return DEFAULT_LOCALE
}

export function isRtlLocale(locale?: unknown): boolean {
  return LOCALE_META[resolveLocale(locale)].dir === 'rtl'
}

export function languageName(locale?: unknown): string {
  return LOCALE_META[resolveLocale(locale)].languageName || 'English'
}

export function hasArabicScript(text: unknown): boolean {
  return ARABIC_SCRIPT.test(String(text || ''))
}

export function completionMatchesLocale(
  parsed: { title?: unknown; summary?: unknown } | null | undefined,
  locale?: unknown,
): boolean {
  const resolved = resolveLocale(locale)
  if (resolved !== 'ar') return true
  return hasArabicScript(parsed?.title) && hasArabicScript(parsed?.summary)
}

export interface LocaleCopy {
  queryTooShort: string
  queryTooLong: string
  appDisclaimer: string
  noAuthority: string
  missingLookup: string
  noKey: string
  aiBusy: string
  aiFailedPrefix: string
  aiFailedSuffix: string
  accordingToFallback: string
  unnamedDropped: string
  noCitationsReturned: string
  stanceMismatch: string
  oneSidedConflict: string
  positionHalal: string
  positionHaram: string
  positionUnclear: string
}

const COPY: Record<Locale, LocaleCopy> = {
  en: {
    queryTooShort: 'Query must be at least 2 characters.',
    queryTooLong: 'Query is too long (max 200 characters).',
    appDisclaimer:
      'This tool summarizes published positions of named authorities. It is not a personal fatwa, not ijma unless a source says so, and not a substitute for a qualified scholar who knows your situation.',
    noAuthority: 'No named authority could be retrieved for this query.',
    missingLookup: 'Do not treat a missing lookup as a ruling.',
    noKey:
      'Nothing in the curated library matches this search, and AI lookup is not enabled on this server. That is a gap in coverage, not a ruling.',
    aiBusy:
      'Nothing in the curated library matches this search, and the live lookup is busy right now. Try again in a moment, or ask a local scholar.',
    aiFailedPrefix: 'Nothing in the curated library matches this search, and the sourced lookup did not finish',
    aiFailedSuffix: 'Try again in a moment, or ask a local scholar.',
    accordingToFallback: 'Named sources below, not a personal fatwa',
    unnamedDropped: 'No named scholar or certifying body could be verified on the returned citations.',
    noCitationsReturned: 'No citation was returned, so this cannot be shown as a ruling.',
    stanceMismatch: 'The named citations do not support the drafted answer, so this stays unclear.',
    oneSidedConflict:
      'A disagreement was claimed, but only one side had a named citation, so both positions are not shown.',
    positionHalal: 'Position: lawful',
    positionHaram: 'Position: prohibited',
    positionUnclear: 'Position: qualified / unclear',
  },
  ar: {
    queryTooShort: 'يجب أن يكون البحث حرفين على الأقل.',
    queryTooLong: 'نص البحث طويل جدًا (الحد الأقصى 200 حرف).',
    appDisclaimer:
      'يلخّص هذا الأداة مواقف منشورة لجهات مسمّاة. ليست فتوى شخصية، وليست إجماعًا إلا إذا صرّح المصدر بذلك، ولا تغني عن عالم مؤهّل يعرف حالك.',
    noAuthority: 'تعذّر جلب جهة مسمّاة لهذا البحث.',
    missingLookup: 'لا تعامل غياب نتيجة البحث على أنه حكم.',
    noKey:
      'لا توجد مادة مطابقة في المكتبة المحرَّرة، وبحث الذكاء الاصطناعي غير مفعّل على هذا الخادم. هذا فراغ في التغطية، وليس حكمًا.',
    aiBusy:
      'لا توجد مادة مطابقة في المكتبة المحرَّرة، والبحث المباشر مشغول الآن. أعد المحاولة بعد قليل، أو اسأل عالمًا محليًا.',
    aiFailedPrefix: 'لا توجد مادة مطابقة في المكتبة المحرَّرة، ولم يكتمل البحث الموثّق',
    aiFailedSuffix: 'أعد المحاولة بعد قليل، أو اسأل عالمًا محليًا.',
    accordingToFallback: 'المصادر المسمّاة أدناه، وليست فتوى شخصية',
    unnamedDropped: 'تعذّر التحقق من عالم أو جهة اعتماد مسمّاة في الاستشهادات المُرجَعة.',
    noCitationsReturned: 'لم يُرجع أي استشهاد، فلا يُعرض هذا على أنه حكم.',
    stanceMismatch: 'الاستشهادات المسمّاة لا تسند الجواب المقترح، فيبقى الحكم غير واضح.',
    oneSidedConflict: 'ادُّعي خلاف، لكن طرفًا واحدًا فقط له استشهاد مسمّى، فلا يُعرض الموقفان.',
    positionHalal: 'موقف: جائز',
    positionHaram: 'موقف: محرّم',
    positionUnclear: 'موقف: مقيّد / غير واضح',
  },
  de: {
    queryTooShort: 'Die Suche muss mindestens 2 Zeichen haben.',
    queryTooLong: 'Die Suche ist zu lang (höchstens 200 Zeichen).',
    appDisclaimer:
      'Dieses Werkzeug fasst veröffentlichte Positionen benannter Autoritäten zusammen. Es ist keine persönliche Fatwa, kein Idschma, sofern eine Quelle das nicht sagt, und kein Ersatz für einen qualifizierten Gelehrten, der Ihre Lage kennt.',
    noAuthority: 'Für diese Suche konnte keine benannte Autorität ermittelt werden.',
    missingLookup: 'Behandeln Sie ein fehlendes Nachschlagen nicht als Urteil.',
    noKey:
      'Nichts in der kuratierten Bibliothek passt zu dieser Suche, und die KI-Suche ist auf diesem Server nicht aktiv. Das ist eine Lücke in der Abdeckung, kein Urteil.',
    aiBusy:
      'Nichts in der kuratierten Bibliothek passt zu dieser Suche, und die Live-Suche ist gerade ausgelastet. Versuchen Sie es gleich noch einmal, oder fragen Sie einen lokalen Gelehrten.',
    aiFailedPrefix: 'Nichts in der kuratierten Bibliothek passt zu dieser Suche, und die belegte Suche wurde nicht fertig',
    aiFailedSuffix: 'Versuchen Sie es gleich noch einmal, oder fragen Sie einen lokalen Gelehrten.',
    accordingToFallback: 'Benannte Quellen unten, keine persönliche Fatwa',
    unnamedDropped: 'Auf den zurückgegebenen Belegen ließ sich kein benannter Gelehrter oder keine Zertifizierungsstelle prüfen.',
    noCitationsReturned: 'Es wurde kein Beleg zurückgegeben, daher wird dies nicht als Urteil gezeigt.',
    stanceMismatch: 'Die benannten Belege stützen die vorgeschlagene Antwort nicht, daher bleibt das Ergebnis unklar.',
    oneSidedConflict:
      'Ein Widerspruch wurde behauptet, aber nur eine Seite hatte einen benannten Beleg, daher werden nicht beide Positionen gezeigt.',
    positionHalal: 'Position: erlaubt',
    positionHaram: 'Position: verboten',
    positionUnclear: 'Position: eingeschränkt / unklar',
  },
  fr: {
    queryTooShort: 'La recherche doit compter au moins 2 caractères.',
    queryTooLong: 'La recherche est trop longue (200 caractères maximum).',
    appDisclaimer:
      'Cet outil résume des positions publiées d’autorités nommées. Ce n’est pas une fatwa personnelle, pas un ijmâ sauf si une source le dit, et pas un substitut à un savant qualifié qui connaît votre situation.',
    noAuthority: 'Aucune autorité nommée n’a pu être obtenue pour cette recherche.',
    missingLookup: 'N’interprétez pas une recherche manquante comme un avis.',
    noKey:
      'Rien dans la bibliothèque curatée ne correspond à cette recherche, et la recherche IA n’est pas activée sur ce serveur. C’est une lacune de couverture, pas un avis.',
    aiBusy:
      'Rien dans la bibliothèque curatée ne correspond à cette recherche, et la recherche en direct est occupée pour le moment. Réessayez dans un instant, ou demandez à un savant local.',
    aiFailedPrefix: 'Rien dans la bibliothèque curatée ne correspond à cette recherche, et la recherche sourcée ne s’est pas terminée',
    aiFailedSuffix: 'Réessayez dans un instant, ou demandez à un savant local.',
    accordingToFallback: 'Sources nommées ci-dessous, pas une fatwa personnelle',
    unnamedDropped: 'Aucun savant ni organisme certificateur nommé n’a pu être vérifié sur les citations renvoyées.',
    noCitationsReturned: 'Aucune citation n’a été renvoyée, donc ceci n’est pas présenté comme un avis.',
    stanceMismatch: 'Les citations nommées ne soutiennent pas la réponse proposée, donc le résultat reste incertain.',
    oneSidedConflict:
      'Un désaccord a été affirmé, mais un seul côté avait une citation nommée, donc les deux positions ne sont pas affichées.',
    positionHalal: 'Position : licite',
    positionHaram: 'Position : illicite',
    positionUnclear: 'Position : nuancée / incertaine',
  },
}

export function localeCopy(locale?: unknown): LocaleCopy {
  const resolved = resolveLocale(locale)
  return COPY[resolved] || COPY.en
}

export function aiFailedMessage(locale?: unknown): string {
  const copy = localeCopy(locale)
  return `${copy.aiFailedPrefix}. ${copy.aiFailedSuffix}`
}

export function positionTitleForStance(stance: Verdict | string, locale?: unknown): string {
  const copy = localeCopy(locale)
  if (stance === 'halal') return copy.positionHalal
  if (stance === 'haram') return copy.positionHaram
  return copy.positionUnclear
}
