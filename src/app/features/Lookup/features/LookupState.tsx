import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export type LookupStateKind = 'loading' | 'missing_key' | 'lookup_failed' | 'error'

const COPY: Record<LookupStateKind, { title: string; body: string; accent: string }> = {
  loading: { title: 'status.loadingTitle', body: 'status.loadingBody', accent: 'primary.main' },
  missing_key: { title: 'status.missingTitle', body: 'status.missingBody', accent: 'secondary.main' },
  lookup_failed: { title: 'status.failedTitle', body: 'status.failedBody', accent: 'error.main' },
  error: { title: 'status.errorTitle', body: 'status.errorBody', accent: 'error.main' },
}

export default function LookupState({ kind, onRetry }: { kind: LookupStateKind; onRetry?: () => void }) {
  const { t } = useTranslation()
  const copy = COPY[kind] ?? COPY.error
  const isAlert = kind === 'error' || kind === 'lookup_failed'
  const showRetry = isAlert && typeof onRetry === 'function'

  return (
    <Box
      className={kind === 'loading' ? undefined : 'folio-in'}
      role={isAlert ? 'alert' : 'status'}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: copy.accent,
        borderRadius: 1,
        px: { xs: 2.25, md: 3 },
        py: { xs: 2.25, md: 2.75 },
      }}
    >
      <Typography variant="h3" sx={{ fontSize: { xs: 22, md: 24 } }}>
        {t(copy.title)}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560, fontSize: 16, lineHeight: 1.6 }}>
        {t(copy.body)}
      </Typography>
      {kind === 'loading' ? (
        <Stack spacing={1} sx={{ mt: 2.25, maxWidth: 480 }} aria-hidden="true">
          <Skeleton variant="rounded" animation="wave" height={12} width="68%" />
          <Skeleton variant="rounded" animation="wave" height={12} width="100%" />
          <Skeleton variant="rounded" animation="wave" height={12} width="84%" />
        </Stack>
      ) : null}
      {kind === 'missing_key' ? (
        <Typography sx={{ mt: 1.75, fontSize: 15, fontWeight: 700 }}>{t('status.notARuling')}</Typography>
      ) : null}
      {showRetry ? (
        <Button variant="outlined" onClick={onRetry} sx={{ mt: 2, minHeight: 44 }}>
          {t('status.retry')}
        </Button>
      ) : null}
    </Box>
  )
}
