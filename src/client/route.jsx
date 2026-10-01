'use client'

import { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Box } from '@mui/material'
import { normalizePath } from '../../lib/public-pages.js'

const RouteContext = createContext(null)

/**
 * Thin layer over the App Router so components keep the same `useRoute()` /
 * `NavLink` API they had in the Vite build. `goHome` also clears the home search.
 */
export function RouteProvider({ children }) {
  const router = useRouter()
  const path = normalizePath(usePathname())
  const homeResetRef = useRef(() => {})

  const navigate = useCallback(
    (to) => {
      router.push(normalizePath(to))
      window.scrollTo(0, 0)
    },
    [router],
  )

  const goHome = useCallback(() => {
    const atHome = normalizePath(window.location.pathname) === '/'
    const hasQuery = Boolean(window.location.search || window.location.hash)
    if (!atHome || hasQuery) {
      router.push('/')
    }
    homeResetRef.current()
    window.scrollTo(0, 0)
  }, [router])

  const registerHomeReset = useCallback((fn) => {
    homeResetRef.current = fn
    return () => {
      if (homeResetRef.current === fn) homeResetRef.current = () => {}
    }
  }, [])

  const value = useMemo(
    () => ({ path, navigate, goHome, registerHomeReset }),
    [path, navigate, goHome, registerHomeReset],
  )

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
}

export function useRoute() {
  const value = useContext(RouteContext)
  if (!value) throw new Error('useRoute must be used inside RouteProvider')
  return value
}

export function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

export function NavLink({ to, children, sx, ...rest }) {
  const { path } = useRoute()
  const current = path === normalizePath(to)
  return (
    <Box
      component={NextLink}
      href={to}
      aria-current={current ? 'page' : undefined}
      sx={{
        color: current ? 'primary.main' : 'text.secondary',
        fontWeight: current ? 700 : 600,
        fontSize: 14,
        textDecoration: 'underline',
        textDecorationColor: 'divider',
        textUnderlineOffset: 4,
        '&:hover': { color: 'primary.main' },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  )
}
