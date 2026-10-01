/**
 * Split mixed copy so Latin/digit runs (fatwa numbers, verse refs) keep
 * their trailing punctuation inside RTL instead of rendering as ".10528".
 */
const LTR_RUN = /[A-Za-z0-9](?:[A-Za-z0-9:/.,;+\-'’ ]*[A-Za-z0-9])?(?:\.+)?/g

export interface BidiSegment {
  dir: 'ltr' | 'auto'
  text: string
}

export function segmentMixedBidi(text: unknown): BidiSegment[] {
  const value = String(text ?? '')
  const parts: BidiSegment[] = []
  let lastIndex = 0
  for (const match of value.matchAll(LTR_RUN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push({ dir: 'auto', text: value.slice(lastIndex, index) })
    }
    parts.push({ dir: 'ltr', text: match[0] })
    lastIndex = index + match[0].length
  }
  if (lastIndex < value.length) {
    parts.push({ dir: 'auto', text: value.slice(lastIndex) })
  }
  return parts
}
