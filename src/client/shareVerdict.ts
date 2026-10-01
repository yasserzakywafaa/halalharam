export interface VerdictShareInput {
  query?: string
  title?: string
  verdictLabel?: string
  summary?: string
  accordingTo?: string
  notFatwa?: string
  origin?: string
}

export interface VerdictShare {
  title: string
  text: string
  url: string
  clipboard: string
}

function clean(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function verdictShareUrl(query: unknown, origin = 'https://halal-or-haram.vercel.app'): string {
  const url = new URL('/', origin)
  const q = clean(query)
  if (q) url.searchParams.set('q', q)
  url.hash = 'verdict'
  return url.toString()
}

export function buildVerdictShare({
  query,
  title,
  verdictLabel,
  summary,
  accordingTo,
  notFatwa,
  origin,
}: VerdictShareInput = {}): VerdictShare {
  const subject = clean(title) || clean(query)
  const label = clean(verdictLabel)
  const headline = subject && label ? `${subject} (${label})` : subject || label
  const lines: string[] = []
  if (headline) lines.push(headline)
  const body = clean(summary)
  if (body) lines.push(body)
  const who = clean(accordingTo)
  if (who) lines.push(who)
  const note = clean(notFatwa)
  if (note) lines.push(note)
  const text = lines.join('\n')
  const url = verdictShareUrl(query || title, origin)
  const clipboard = [text, url].filter(Boolean).join('\n\n')

  return {
    title: headline || subject || 'Halal-Haram',
    text,
    url,
    clipboard,
  }
}

export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function copyText(value: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fall through when the clipboard API is blocked.
    }
  }

  if (typeof document === 'undefined') return false

  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.focus()
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  return ok
}
