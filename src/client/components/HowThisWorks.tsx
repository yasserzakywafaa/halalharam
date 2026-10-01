import { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { useTranslation } from 'react-i18next'
import { NavLink } from '../route.tsx'
import { readHowThisWorksDismissed, writeHowThisWorksDismissed } from '../preferences.ts'

/** An inline, dismissible note under the lookup. It never covers the page on a phone. */
export default function HowThisWorks() {
  const { t } = useTranslation()
  // Closed on the server and the hydration pass; opened from localStorage after mount.
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(!readHowThisWorksDismissed())
  }, [])

  if (!open) return null

  function dismiss() {
    writeHowThisWorksDismissed()
    setOpen(false)
  }

  const details = [t('how.noticeSeed'), t('how.noticeConflict')].filter((line) => typeof line === 'string' && line.trim())

  return (
    <Box
      role="note"
      aria-label={t('how.noticeTitle')}
      data-print-hide=""
      sx={{
        mt: 2,
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr)',
        gap: 1.25,
        alignItems: 'start',
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        borderRadius: 1,
        bgcolor: 'color-mix(in srgb, var(--focus-ring) 7%, transparent)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <InfoOutlined aria-hidden="true" sx={{ color: 'primary.main', fontSize: 20, mt: '2px' }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ m: 0, fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>{t('how.noticeLimit')}</Typography>
        <Stack spacing={0.35} sx={{ mt: 0.5, display: { xs: 'none', sm: 'flex' } }}>
          {details.map((line) => (
            <Typography key={line} component="p" sx={{ m: 0, fontSize: 13.5, lineHeight: 1.5, color: 'text.secondary' }}>
              {line}
            </Typography>
          ))}
        </Stack>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 0.75 }}>
          <NavLink to="/about" sx={{ fontSize: 13.5 }}>
            {t('how.more')}
          </NavLink>
          <Button type="button" size="small" variant="text" onClick={dismiss} sx={{ minHeight: 36, px: 1.25, fontSize: 13.5 }}>
            {t('how.dismiss')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
