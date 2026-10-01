import { Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { NavLink } from '../../lib/application/router.tsx'
import { routes } from '../../lib/application/routes.ts'

export default function Footer() {
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
          <NavLink to={routes.about}>{t('nav.about')}</NavLink>
          <NavLink to={routes.privacyPolicy}>{t('nav.privacy')}</NavLink>
        </Stack>
      </Stack>
    </Container>
  )
}
