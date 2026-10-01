const NAMED_MARKERS = [
  'qur\'an',
  'quran',
  'sahih',
  'sunan',
  'sunnah.com',
  'bukhari',
  'muslim',
  'tirmidhi',
  'nasai',
  "nasa'i",
  'abu dawud',
  'abudawud',
  'ibn majah',
  'islamqa',
  'dar al-ifta',
  'dar-alifta',
  'darulifta',
  'darul ifta',
  'deoband',
  'seekersguidance',
  'amja',
  'askimam',
  'islamweb',
  'aaoifi',
  'jakim',
  'ifanca',
  'al-azhar',
  'standing committee',
  'permanent committee',
  'lajnah',
  'european council',
  'fiqh academy',
  'assembly of muslim jurists',
  'muwatta',
  'musnad',
  'ibn hibban',
  'bayhaqi',
  'darul uloom',
  'abi dawud',
  'mufti',
  'shaykh',
  'sheikh',
  'imam ',
  'قرآن',
  'القرآن',
  'البخاري',
  'مسلم',
  'الترمذي',
  'ابن ماجه',
  'أبي داود',
  'أبو داود',
  'دار الإفتاء',
  'الإسلام سؤال',
  'سؤال وجواب',
  'إسلام ويب',
  'جاكيم',
  'إيفانكا',
  'المفتي',
  'الشيخ',
  'الأزهر',
  'اللجنة الدائمة',
  'مجمع الفقه',
  'سيكرز',
  'أسك إمام',
  'ديوبند',
  'صحيح',
  'سنن',
  'موطأ',
  'مسند',
]

// Hosts already cited by the model. The label names the desk; it does not invent a URL.
const KNOWN_AUTHORITY_HOSTS = [
  ['islamqa.info', 'IslamQA'],
  ['quran.com', "Qur'an"],
  ['sunnah.com', 'Sunnah.com'],
  ['dar-alifta.org', 'Dar al-Ifta'],
  ['seekersguidance.org', 'SeekersGuidance'],
  ['amjaonline.org', 'AMJA'],
  ['askimam.org', 'Askimam'],
  ['islamweb.net', 'Islamweb'],
  ['darulifta-deoband.com', 'Darul Ifta Deoband'],
  ['ifanca.org', 'IFANCA'],
  ['halal.gov.my', 'JAKIM'],
  ['aaoifi.com', 'AAOIFI'],
]

const VAGUE_ONLY = /^(widely accepted|most scholars|many scholars|generally accepted|common view|consensus|mainstream|people say|some say)\b/i

export function isNamedAuthority(authority) {
  const text = String(authority || '').trim()
  if (text.length < 3) return false
  const lower = text.toLowerCase()
  if (VAGUE_ONLY.test(text) && !NAMED_MARKERS.some((marker) => lower.includes(marker))) {
    return false
  }
  return NAMED_MARKERS.some((marker) => lower.includes(marker))
}

export function authorityFromCitationUrl(url) {
  let host = ''
  try {
    host = new URL(String(url)).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
  for (const [suffix, label] of KNOWN_AUTHORITY_HOSTS) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return label
  }
  return ''
}

export function sourceHasNamedAuthority(source) {
  if (!source || typeof source !== 'object') return false
  if (isNamedAuthority(source.authority) || isNamedAuthority(source.name)) return true
  return Boolean(authorityFromCitationUrl(source.url))
}

/** Keep a citation the model already returned; name the desk from its URL when the text is vague. */
export function recognizeCitation(source) {
  if (!source || typeof source !== 'object') return source
  if (isNamedAuthority(source.authority) || isNamedAuthority(source.name)) return source
  const label = authorityFromCitationUrl(source.url)
  if (!label) return source
  return { ...source, authority: label }
}

export function collectSources(item) {
  const fromPositions = (item.positions || []).flatMap((position) => position.sources || [])
  const direct = item.sources || []
  const seen = new Set()
  const out = []
  for (const source of [...direct, ...fromPositions]) {
    const key = `${source?.url || ''}|${source?.name || ''}|${source?.authority || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(source)
  }
  return out
}
