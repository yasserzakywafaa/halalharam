import { Box, Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import BrandMark from './BrandMark.jsx'
import SettingsMenuButton from './SettingsMenuButton.jsx'
import { useLocale } from '../providers.jsx'
import { isPlainLeftClick, useRoute } from '../route.jsx'

export default function SiteHeader() {
  const { t } = useTranslation()
  const { goHome } = useRoute()
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
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 1.35 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack
            direction="row"
            spacing={1.15}
            alignItems="center"
            component="a"
            href="/"
            onClick={(event) => {
              if (!isPlainLeftClick(event)) return
              event.preventDefault()
              goHome()
            }}
            aria-label={t('brand')}
            sx={{
              textDecoration: 'none',
              cursor: 'pointer',
              minWidth: 0,
              minHeight: 44,
              textAlign: 'start',
              color: 'inherit',
              borderRadius: 1,
              '&:focus-visible': {
                outline: '3px solid var(--focus-ring)',
                outlineOffset: 3,
              },
            }}
          >
            <BrandMark size={28} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'Fraunces, "Noto Naskh Arabic", Georgia, serif',
                  fontWeight: 650,
                  fontSize: 17,
                  lineHeight: 1.1,
                }}
              >
                {t('brand')}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  lineHeight: 1.35,
                  letterSpacing: rtl ? 0 : '0.08em',
                  textTransform: rtl ? 'none' : 'uppercase',
                  color: 'secondary.main',
                  fontWeight: 700,
                  mt: 0.25,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {t('brandLine')}
              </Typography>
            </Box>
          </Stack>
          <SettingsMenuButton />
        </Stack>
      </Container>
    </Box>
  )
}
