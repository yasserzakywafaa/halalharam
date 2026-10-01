export const SITE_ORIGIN = 'https://halalharam.vercel.app'

/** Pages a crawler may treat as documents. No per-item lookup URLs. */
export const PUBLIC_PATHS = ['/', '/about', '/privacy-policy'] as const
export type PublicPath = (typeof PUBLIC_PATHS)[number]

export function normalizePath(pathname: unknown): string {
  const raw = String(pathname || '/')
  const path = raw.split('?')[0]?.split('#')[0] ?? ''
  if (!path.startsWith('/')) return '/'
  const trimmed = path.replace(/\/+$/, '')
  return trimmed || '/'
}

export function isPublicPath(pathname: unknown): pathname is PublicPath {
  return (PUBLIC_PATHS as readonly string[]).includes(normalizePath(pathname))
}

export function publicUrl(pathname: string): string {
  const path = normalizePath(pathname)
  if (!isPublicPath(path)) {
    throw new Error(`Not a public page: ${pathname}`)
  }
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`
}
