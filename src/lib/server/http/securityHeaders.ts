/**
 * Share-ready response headers. Applied to every response by `src/proxy.ts`.
 * The browser may only talk to this origin plus the Google Fonts hosts.
 * OpenRouter stays server-side and is never allowed in the browser policy.
 */
export const STATIC_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

/** Fresh per request. Next.js reads it from the request CSP and stamps its own inline scripts. */
export function createNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/**
 * Nonce-based CSP. Inline scripts (Next.js bootstrap + theme/language boot script)
 * carry the nonce; there is no `script-src 'unsafe-inline'`.
 * `style-src 'unsafe-inline'` stays for MUI / Emotion injected styles.
 */
export function buildContentSecurityPolicy({ nonce, dev = false }: { nonce?: string; dev?: boolean } = {}): string {
  if (!nonce) throw new Error('A CSP nonce is required')
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
  // React Refresh / Turbopack need eval in development only.
  if (dev) scriptSrc.push("'unsafe-eval'")

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com${dev ? ' ws: wss:' : ''}`,
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}
