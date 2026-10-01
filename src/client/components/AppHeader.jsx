import { Box, Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../providers.jsx'
import BrandMark from './BrandMark.jsx'
import SettingsMenuButton from './SettingsMenuButton.jsx'

export default function AppHeader({ onHome }) {
  const { t } = useTranslation()
  const { direction } = useLocale()
  const rtl = direction === 'rtl'

  return (
    <Box
      component="header"
      data-app-header
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
            component="button"
            type="button"
            onClick={onHome}
            aria-label={t('brand')}
            sx={{
              border: 0,
              bgcolor: 'transparent',
              cursor: 'pointer',
              p: 0.5,
              my: -0.5,
              minWidth: 0,
              minHeight: 44,
              textAlign: 'start',
              color: 'inherit',
              borderRadius: 1,
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
