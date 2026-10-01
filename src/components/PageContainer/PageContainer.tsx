'use client'

import { useEffect, type ReactNode } from 'react'
import { Box, Container } from '@mui/material'
import { useTranslation } from 'react-i18next'
import Footer from '../Footer/Footer.tsx'
import ApplicationBar from '../ApplicationBar/ApplicationBar.tsx'
import Lookup from '../../app/features/Lookup/Lookup.tsx'
import { RouteProvider, useRoute } from '../../lib/application/router.tsx'
import { routes } from '../../lib/application/routes.ts'

/** Title / description follow the active language after hydration (server HTML is the cookie language). */
function useLocalizedDocumentMeta(path: string) {
  const { t } = useTranslation()

  useEffect(() => {
    document.title =
      path === routes.about
        ? `${t('nav.about')} · ${t('brand')}`
        : path === routes.privacyPolicy
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
      <ApplicationBar />
      <Box component="main" id="main" sx={{ flex: 1 }}>
        {/* Home stays mounted across routes so a lookup survives a trip to About / Privacy. */}
        <Box sx={{ display: path === routes.main ? 'block' : 'none' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
            <Lookup />
          </Container>
        </Box>
        {path === routes.main ? children : <Container maxWidth="lg" sx={{ py: { xs: 3.5, md: 6 } }}>{children}</Container>}
      </Box>
      <Footer />
    </Box>
  )
}

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <RouteProvider>
      <Shell>{children}</Shell>
    </RouteProvider>
  )
}
