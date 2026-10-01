export function normalizeQuery(input: unknown): string {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/0+[.,]?0*\s*%/g, ' alcohol free ')
    .replace(/\b0+[.,]0+\b/g, ' alcohol free ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
