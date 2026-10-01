import { Box, Container, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import BrandMark from './BrandMark.tsx'
import SettingsMenuButton from './SettingsMenuButton.tsx'
import { useLocale } from '../providers.tsx'
import { isPlainLeftClick, useRoute } from '../route.tsx'
import { FONT_MONO } from '../theme.ts'

/** Scrolls back to the lookup field and focuses it. Used by the header search button. */
function focusLookup() {
  const input = document.getElementById('lookup-query') as HTMLInputElement | null
  if (!input) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
  input.focus({ preventScroll: true })
  input.select()
}

export default function SiteHeader() {
  const { t } = useTranslation()
  const { goHome, path } = useRoute()
  const { direction } = useLocale()
  const rtl = direction === 'rtl'

  return (
    <Box
      component="header"
      data-app-header
      data-print-hide=""
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'color-mix(in srgb, var(--page-bg) 86%, transparent)',
        backdropFilter: 'saturate(1.4) blur(12px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(12px)',
        pt: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 0.75, md: 1 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            spacing={1.25}
            component="a"
            href="/"
            onClick={(event) => {
              if (!isPlainLeftClick(event)) return
              event.preventDefault()
              goHome()
            }}
            aria-label={t('brand')}
            sx={{
              alignItems: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              minWidth: 0,
              minHeight: 44,
              color: 'inherit',
              borderRadius: 1,
              '--brand-mark-hole': 'var(--page-bg)',
              '&:focus-visible': { outline: '3px solid var(--focus-ring)', outlineOffset: 3 },
            }}
          >
            <BrandMark size={26} />
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'baseline', minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 17, lineHeight: 1.1, letterSpacing: rtl ? 0 : '-0.02em' }}>
                {t('brand')}
              </Typography>
              <Typography
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  lineHeight: 1.35,
                  letterSpacing: rtl ? 0 : '0.06em',
                  textTransform: rtl ? 'none' : 'uppercase',
                  color: 'text.secondary',
                }}
              >
                {t('brandLine')}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {path === '/' ? (
              <Tooltip title={t('search.label')}>
                <IconButton onClick={focusLookup} aria-label={t('search.aria')} sx={{ width: 44, height: 44, display: { md: 'none' } }}>
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            <SettingsMenuButton />
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
