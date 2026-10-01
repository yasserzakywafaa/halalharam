'use client'

import { useEffect, type ReactNode } from 'react'
import { Box, Container } from '@mui/material'
import { useTranslation } from 'react-i18next'
import SiteFooter from './components/SiteFooter.tsx'
import SiteHeader from './components/SiteHeader.tsx'
import HomePage from './pages/HomePage.tsx'
import { RouteProvider, useRoute } from './route.tsx'

/** Title / description follow the active language after hydration (server HTML is the cookie language). */
function useLocalizedDocumentMeta(path: string) {
  const { t } = useTranslation()

  useEffect(() => {
    document.title =
      path === '/about'
        ? `${t('nav.about')} · ${t('brand')}`
        : path === '/privacy'
          ? `${t('nav.privacy')} · ${t('brand')}`
          : t('seo.title')

    const description = t('seo.description')
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      document.querySelector(selector)?.setAttribute('content', description)
    }
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      document.querySelector(selector)?.setAttribute('content', t('seo.title'))
    }
  }, [path, t])
}

function Shell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { path } = useRoute()
  useLocalizedDocumentMeta(path)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box component="a" href="#main" className="skip-link">
        {t('a11y.skip')}
      </Box>
      <SiteHeader />
      <Box component="main" id="main" sx={{ flex: 1 }}>
        {/* Home stays mounted across routes so a lookup survives a trip to About / Privacy. */}
        <Box sx={{ display: path === '/' ? 'block' : 'none' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
            <HomePage />
          </Container>
        </Box>
        {path === '/' ? children : <Container maxWidth="lg" sx={{ py: { xs: 3.5, md: 6 } }}>{children}</Container>}
      </Box>
      <SiteFooter />
    </Box>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <RouteProvider>
      <Shell>{children}</Shell>
    </RouteProvider>
  )
}
