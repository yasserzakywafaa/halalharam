export const SITE_ORIGIN = 'https://halal-or-haram.vercel.app'

/** Pages a crawler may treat as documents. No per-item lookup URLs. */
export const PUBLIC_PATHS = ['/', '/about', '/privacy']

export function normalizePath(pathname) {
  const raw = String(pathname || '/')
  const path = raw.split('?')[0].split('#')[0]
  if (!path.startsWith('/')) return '/'
  const trimmed = path.replace(/\/+$/, '')
  return trimmed || '/'
}

export function isPublicPath(pathname) {
  return PUBLIC_PATHS.includes(normalizePath(pathname))
}

export function publicUrl(pathname) {
  const path = normalizePath(pathname)
  if (!isPublicPath(path)) {
    throw new Error(`Not a public page: ${pathname}`)
  }
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`
}
