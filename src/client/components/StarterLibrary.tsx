import { Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useVerdictColors } from '../theme.ts'
import type { Verdict } from '../../../lib/types.ts'
import { knownVerdict } from '../verdictGloss.ts'
import BidiText from './BidiText.tsx'

/** A starter-library row: a server `LibraryEntry` or the built-in fallback list. */
export interface LibraryCardItem {
  id?: string
  label?: string
  query?: string
  title: string
  verdict: Verdict | string
  conflict?: boolean
}

export interface StarterLibraryProps {
  items?: LibraryCardItem[] | null
  onOpen: (query: string) => void
}

export default function StarterLibrary({ items, onOpen }: StarterLibraryProps) {
  const { t } = useTranslation()
  const verdictColors = useVerdictColors()
  const ranked = items || []

  return (
    <Box
      component="aside"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.1, pt: 2, pb: 1.35 }}>
        <Typography variant="h3" sx={{ fontSize: 22, letterSpacing: '-0.02em' }}>
          {t('library.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65, lineHeight: 1.5 }}>
          {t('library.lead')}
        </Typography>
      </Box>

      <Stack>
        {ranked.map((item, index) => {
          const tone = verdictColors[knownVerdict(item.verdict)]
          const query = item.query || item.label || ''
          return (
            <Box
              key={item.id || query}
              component="button"
              type="button"
              onClick={() => onOpen(query)}
              sx={{
                display: 'grid',
                gridTemplateColumns: '2rem minmax(0, 1fr)',
                gap: 0.75,
                width: '100%',
                textAlign: 'start',
                border: 0,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'transparent',
                cursor: 'pointer',
                px: 1.6,
                py: 1.15,
                minHeight: 44,
                color: 'inherit',
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: 'action.hover' },
                '&:focus-visible': {
                  outline: '3px solid var(--focus-ring)',
                  outlineOffset: '-3px',
                  zIndex: 1,
                },
              }}
            >
              <Typography
                sx={{
                  pt: 0.15,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'secondary.main',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'Fraunces, "Noto Naskh Arabic", Georgia, serif',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <BidiText component="span" sx={{ fontWeight: 650, fontSize: 14.5, letterSpacing: '-0.01em', display: 'block', overflowWrap: 'anywhere' }}>
                  {item.title || query}
                </BidiText>
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.35 }}>
                  <Typography variant="caption" color="text.secondary">
                    {query}
                  </Typography>
                  <Chip
                    component="span"
                    size="small"
                    variant="outlined"
                    label={t(`verdict.${item.verdict}`, { defaultValue: item.verdict })}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      color: tone.main,
                      borderColor: tone.main,
                    }}
                  />
                  {item.conflict ? (
                    <Chip
                      component="span"
                      size="small"
                      variant="outlined"
                      label={t('library.bothSides')}
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  ) : null}
                </Stack>
              </Box>
            </Box>
          )
        })}
      </Stack>

      <Box sx={{ px: 2.1, py: 1.4, bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
          {t('library.footer')}
        </Typography>
      </Box>
    </Box>
  )
}
