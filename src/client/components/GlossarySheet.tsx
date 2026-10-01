import { useId, useState } from 'react'
import { Box, Button, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Close } from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

const TERMS = [
  { term: 'glossary.halalTerm', body: 'glossary.halalBody' },
  { term: 'glossary.haramTerm', body: 'glossary.haramBody' },
  { term: 'glossary.unclearTerm', body: 'glossary.unclearBody' },
  { term: 'glossary.fatwaTerm', body: 'glossary.fatwaBody' },
  { term: 'glossary.madhhabTerm', body: 'glossary.madhhabBody' },
  { term: 'glossary.bodiesTerm', body: 'glossary.bodiesBody' },
  { term: 'glossary.seedTerm', body: 'glossary.seedBody' },
  { term: 'glossary.millTerm', body: 'glossary.millBody' },
]

export default function GlossarySheet() {
  const { t } = useTranslation()
  const theme = useTheme()
  const rtl = theme.direction === 'rtl'
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const sheetId = 'glossary-sheet'
  const anchor = isNarrow ? 'bottom' : rtl ? 'left' : 'right'

  function close() {
    setOpen(false)
  }

  return (
    <>
      <Box sx={{ display: 'block' }}>
        <Button
          type="button"
          variant="text"
          color="inherit"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open ? 'true' : 'false'}
          aria-controls={open ? sheetId : undefined}
          sx={{
            mt: 0.75,
            px: 0.25,
            minHeight: 44,
            justifyContent: 'flex-start',
            color: 'text.secondary',
            fontSize: 14.5,
            fontWeight: 650,
            textDecoration: 'underline',
            textDecorationColor: 'divider',
            textUnderlineOffset: 4,
            borderRadius: 1,
            '&:hover': { color: 'primary.main', bgcolor: 'transparent', textDecorationColor: 'primary.main' },
          }}
        >
          {t('glossary.open')}
        </Button>
      </Box>
      <Drawer
        anchor={anchor}
        open={open}
        onClose={close}
        ModalProps={{ keepMounted: false }}
        slotProps={{
          paper: {
            id: sheetId,
            role: 'dialog',
            'aria-modal': true,
            'aria-labelledby': titleId,
            sx: {
              width: isNarrow ? '100%' : { xs: '100%', sm: 400 },
              maxWidth: '100%',
              maxHeight: isNarrow ? '85vh' : '100%',
              height: isNarrow ? 'auto' : '100%',
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              overflow: 'hidden',
              borderColor: 'divider',
              borderTopLeftRadius: isNarrow ? 12 : 0,
              borderTopRightRadius: isNarrow ? 12 : 0,
              boxShadow:
                theme.palette.mode === 'dark' ? '0 16px 40px rgba(0, 0, 0, 0.4)' : '0 12px 32px rgba(20, 44, 38, 0.12)',
              ...(isNarrow
                ? { borderTop: '1px solid' }
                : rtl
                  ? { borderRight: '1px solid' }
                  : { borderLeft: '1px solid' }),
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            height: isNarrow ? 'auto' : '100%',
            maxHeight: isNarrow ? '85vh' : '100%',
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              px: { xs: 2.25, sm: 2.5 },
              pt: 2,
              pb: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              id={titleId}
              component="h2"
              variant="h2"
              sx={{ fontSize: { xs: 20, sm: 22 }, lineHeight: 1.3, minWidth: 0, flex: 1, pr: 0.5 }}
            >
              {t('glossary.title')}
            </Typography>
            <IconButton
              type="button"
              onClick={close}
              aria-label={t('glossary.close')}
              edge="end"
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                color: 'text.primary',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.08) },
              }}
            >
              <Close />
            </IconButton>
          </Stack>
          <Box
            component="dl"
            sx={{
              m: 0,
              px: { xs: 2.25, sm: 2.5 },
              py: 0.5,
              overflow: 'auto',
              pb: 'max(16px, env(safe-area-inset-bottom))',
            }}
          >
            {TERMS.map((item, index) => (
              <Box
                key={item.term}
                component="div"
                sx={{
                  py: 1.35,
                  borderTop: index ? '1px solid' : 0,
                  borderColor: 'divider',
                }}
              >
                <Typography
                  component="dt"
                  sx={{
                    m: 0,
                    fontFamily: 'Fraunces, "Noto Naskh Arabic", Georgia, serif',
                    fontWeight: 650,
                    fontSize: 16,
                    lineHeight: 1.3,
                    color: 'text.primary',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {t(item.term)}
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    m: 0,
                    mt: 0.4,
                    fontSize: 14.5,
                    lineHeight: 1.5,
                    color: 'text.secondary',
                  }}
                >
                  {t(item.body)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}
