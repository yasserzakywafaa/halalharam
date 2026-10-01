import { useState } from 'react'
import { Box, Button } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { buildVerdictShare, canUseWebShare, copyText } from '../shareVerdict.js'

export default function LookupActions({ query, title, result }) {
  const { t } = useTranslation()
  const [notice, setNotice] = useState('')

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2000)
  }

  async function onShare() {
    const payload = buildVerdictShare({
      query,
      title,
      verdictLabel: result ? t(`verdict.${result.verdict}`, { defaultValue: result.verdict }) : '',
      summary: result?.summary,
      accordingTo: result?.accordingTo,
      notFatwa: t('share.notFatwa', { defaultValue: t('disclaimer.short') }),
      origin: window.location.origin,
    })
    if (canUseWebShare()) {
      try {
        await navigator.share({ title: payload.title, text: payload.text, url: payload.url })
        setNotice('')
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    const copied = await copyText(payload.clipboard)
    showNotice(copied ? t('share.copied') : t('share.failed'))
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        mt: 2,
      }}
      data-print-hide=""
    >
      <Button
        className="lookup-action"
        variant="outlined"
        onClick={onShare}
        aria-label={t('share.aria')}
        sx={{
          minHeight: 48,
          px: 2.25,
          flex: { xs: '1 1 0', sm: '0 0 auto' },
          whiteSpace: 'normal',
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        {notice || t('share.button')}
      </Button>
    </Box>
  )
}
