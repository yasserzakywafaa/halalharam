import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { SHOW_AD_SLOTS } from '../ads.ts'

/**
 * Reserved sponsored slot. No ad network is connected and no ad script is injected.
 *
 * Do not create ad-network accounts from this repo. OPENROUTER_API_KEY stays unset
 * here; Yasser adds it on Vercel himself.
 *
 * AD POLICY (enforce when a network is added):
 * Block alcohol, gambling, pork, and adult ads. This product must never
 * monetize with those categories. Filter at the network dashboard and in
 * the slot config — do not ship unfiltered demand.
 */
export default function AdSlot({ placement = 'banner' }) {
  const { t } = useTranslation()
  if (!SHOW_AD_SLOTS) return null

  const isSidebar = placement === 'sidebar'

  return (
    <Box
      component="aside"
      aria-label={t('ad.sponsored')}
      data-print-hide=""
      sx={{ mt: isSidebar ? 0 : 2.5 }}
    >
      <Typography
        sx={{
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'secondary.main',
          fontWeight: 700,
          mb: 0.45,
        }}
      >
        {t('ad.sponsored')}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, lineHeight: 1.45 }}>
        {t('ad.disclosure')}
      </Typography>
      <Box
        aria-hidden="true"
        sx={{
          borderRadius: 1,
          minHeight: isSidebar ? 72 : 48,
          display: 'grid',
          placeItems: 'center',
          px: 2,
          py: 1.25,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
          {t('ad.label')}
        </Typography>
      </Box>
    </Box>
  )
}
