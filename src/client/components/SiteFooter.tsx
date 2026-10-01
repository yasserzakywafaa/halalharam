import { Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { NavLink } from '../route.tsx'

export default function SiteFooter() {
  const { t } = useTranslation()

  return (
    <Container
      component="footer"
      data-print-hide=""
      maxWidth="lg"
      sx={{
        py: 2.5,
        mt: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.25}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, maxWidth: 560 }}>
          {t('footer.note')}
        </Typography>
        <Stack component="nav" aria-label={t('footer.navAria')} direction="row" spacing={2}>
          <NavLink to="/about">{t('nav.about')}</NavLink>
          <NavLink to="/privacy">{t('nav.privacy')}</NavLink>
        </Stack>
      </Stack>
    </Container>
  )
}
