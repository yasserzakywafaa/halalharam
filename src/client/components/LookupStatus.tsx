import { Box, LinearProgress, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { VerdictResponse } from '../../../lib/types.ts'
import BidiText from './BidiText.tsx'

export function LookupProgress({ slow }: { slow?: boolean }) {
  const { t } = useTranslation()

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      sx={{
        px: { xs: 2.25, md: 3 },
        py: { xs: 2.25, md: 2.75 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <LinearProgress color="secondary" sx={{ mb: 1.75, height: 2, borderRadius: 99 }} />
      <Typography sx={{ fontWeight: 650, fontSize: 18 }}>
        {slow ? t('search.loadingAiTitle') : t('search.loadingTitle')}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 15.5, lineHeight: 1.65, maxWidth: 560 }}>
        {slow ? t('search.loadingAi') : t('search.loading')}
      </Typography>
    </Box>
  )
}

export function UnavailableNotice({ result }: { result?: VerdictResponse | null }) {
  const { t } = useTranslation()
  const noKey = result?.unavailableReason === 'no_api_key'

  return (
    <Box
      component="section"
      role="status"
      sx={{
        px: { xs: 2.25, md: 3 },
        py: { xs: 2.25, md: 2.75 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h2" sx={{ fontSize: { xs: 26, md: 32 } }}>
        {noKey ? t('search.noKeyTitle') : t('search.aiFailTitle')}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.25, fontSize: 16, lineHeight: 1.65, maxWidth: 580 }}>
        {noKey ? t('search.noKeyBody') : t('search.aiFailBody')}
      </Typography>
      {result?.query ? (
        <BidiText color="text.secondary" sx={{ display: 'block', mt: 1.75, fontSize: 14.5 }}>
          {t('verdict.searched', { query: result.query })}
        </BidiText>
      ) : null}
      {result?.disclaimer ? (
        <BidiText variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.25, lineHeight: 1.55 }}>
          {result.disclaimer}
        </BidiText>
      ) : null}
    </Box>
  )
}
