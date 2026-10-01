import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material'
import { InfoOutlined } from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { NavLink, useRoute } from '../route.jsx'
import { readHowThisWorksDismissed, writeHowThisWorksDismissed } from '../preferences.js'

export default function HowThisWorks() {
  const { t, i18n } = useTranslation()
  const { path } = useRoute()
  const bannerRef = useRef(null)
  // Closed on the server and the hydration pass; opened from localStorage after mount.
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(!readHowThisWorksDismissed())
  }, [])
  const visible = open && path === '/'
  const lines = [t('how.noticeSeed'), t('how.noticeConflict'), t('how.noticeLimit')].filter(
    (line) => typeof line === 'string' && line.trim(),
  )

  useEffect(() => {
    const node = bannerRef.current
    if (!visible || !node) return undefined
    const apply = () => {
      const height = Math.ceil(node.getBoundingClientRect().height)
      document.body.style.paddingBottom = height > 0 ? `${height}px` : ''
    }
    apply()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply)
    observer?.observe(node)
    return () => {
      observer?.disconnect()
      document.body.style.paddingBottom = ''
    }
  }, [visible, i18n.language, lines.length])

  if (!visible) return null

  function dismiss() {
    writeHowThisWorksDismissed()
    setOpen(false)
  }

  return createPortal(
    <Box
      ref={bannerRef}
      data-print-hide=""
      sx={{
        position: 'fixed',
        zIndex: 30,
        left: 0,
        right: 0,
        bottom: 0,
        '@keyframes noticeIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'none' },
        },
        animation: 'noticeIn 180ms ease-out',
      }}
    >
      <Alert
        severity="info"
        variant="standard"
        role="note"
        icon={false}
        aria-label={t('how.noticeTitle')}
        sx={(theme) => ({
          borderRadius: 0,
          alignItems: 'flex-start',
          color: theme.palette.text.primary,
          bgcolor: `color-mix(in srgb, ${theme.palette.primary.main} ${theme.palette.mode === 'dark' ? 14 : 10}%, ${theme.palette.background.default})`,
          border: 0,
          borderTop: '1px solid',
          borderTopColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.55 : 0.4),
          boxShadow:
            theme.palette.mode === 'dark' ? '0 -10px 28px rgba(0, 0, 0, 0.35)' : '0 -8px 24px rgba(20, 36, 30, 0.08)',
          px: { xs: 2, sm: 3 },
          py: 1.25,
          pb: 'max(12px, env(safe-area-inset-bottom))',
          '& .MuiAlert-message': {
            width: '100%',
            maxWidth: 1120,
            mx: 'auto',
            py: 0,
            color: theme.palette.text.primary,
          },
        })}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <InfoOutlined aria-hidden="true" sx={{ color: 'primary.main', fontSize: 20, mt: '1px', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <AlertTitle sx={{ mb: 0, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
                {t('how.noticeTitle')}
              </AlertTitle>
              <Button
                type="button"
                size="small"
                variant="text"
                color="primary"
                onClick={dismiss}
                sx={{ flexShrink: 0, minHeight: 36, px: 1, py: 0.25 }}
              >
                {t('how.dismiss')}
              </Button>
            </Stack>
            <Stack spacing={0.35} sx={{ mt: 0.35 }}>
              {lines.map((line) => (
                <Typography
                  key={line}
                  component="p"
                  sx={{ m: 0, fontSize: 13.5, lineHeight: 1.45, color: 'text.secondary' }}
                >
                  {line}
                </Typography>
              ))}
            </Stack>
            <NavLink to="/about" sx={{ display: 'inline-block', mt: 0.75, fontSize: 13.5 }}>
              {t('how.more')}
            </NavLink>
          </Box>
        </Stack>
      </Alert>
    </Box>,
    document.body,
  )
}
