import { useMemo, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { FONT_MONO, useVerdictColors } from '../../../../lib/application/shared/themes.ts'
import type { Verdict } from '../../../../lib/application/shared/types.ts'
import { knownVerdict } from '../../../../lib/utils/verdictGloss.ts'
import BidiText from '../../../../components/shared/BidiText.tsx'

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

type Filter = 'all' | 'halal' | 'haram' | 'unclear'

const FILTERS: Filter[] = ['all', 'haram', 'halal', 'unclear']

/** Rows shown on a phone before "Show all". Desktop always lists everything in a scrolling column. */
const PHONE_PREVIEW = 6

export default function StarterLibrary({ items, onOpen }: StarterLibraryProps) {
  const { t } = useTranslation()
  const verdictColors = useVerdictColors()
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState(false)
  const all = items || []

  const counts = useMemo(() => {
    const next: Record<Filter, number> = { all: all.length, halal: 0, haram: 0, unclear: 0 }
    for (const item of all) next[knownVerdict(item.verdict)] += 1
    return next
  }, [all])

  const visible = filter === 'all' ? all : all.filter((item) => knownVerdict(item.verdict) === filter)
  const collapsible = visible.length > PHONE_PREVIEW

  return (
    <Box
      component="aside"
      aria-labelledby="library-title"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: { md: 'calc(100vh - 6.5rem)' },
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Typography id="library-title" variant="h3" sx={{ fontSize: 19 }}>
          {t('library.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
          {t('library.lead')}
        </Typography>
        <Stack
          role="group"
          aria-label={t('library.filterAria')}
          direction="row"
          spacing={0.75}
          useFlexGap
          sx={{ mt: 1.5, flexWrap: 'wrap' }}
        >
          {FILTERS.map((key) => {
            const active = filter === key
            const tone = key === 'all' ? null : verdictColors[key]
            return (
              <Box
                key={key}
                component="button"
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(key)
                  setExpanded(false)
                }}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  minHeight: 36,
                  px: 1.25,
                  border: '1px solid',
                  borderColor: active ? 'text.primary' : 'divider',
                  borderRadius: 999,
                  bgcolor: active ? 'text.primary' : 'transparent',
                  color: active ? 'background.paper' : 'text.primary',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 140ms ease, color 140ms ease',
                }}
              >
                {tone ? <Box aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tone.main }} /> : null}
                {key === 'all' ? t('library.filterAll') : t(`verdict.${key}`)}
                <Box component="span" sx={{ fontFamily: FONT_MONO, fontSize: 11.5, opacity: 0.7 }}>
                  {counts[key]}
                </Box>
              </Box>
            )
          })}
        </Stack>
      </Box>

      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, overflowY: { md: 'auto' }, flex: { md: '1 1 auto' }, minHeight: 0 }}>
        {visible.map((item, index) => {
          const key = knownVerdict(item.verdict)
          const tone = verdictColors[key]
          const query = item.query || item.label || ''
          const hiddenOnPhone = collapsible && !expanded && index >= PHONE_PREVIEW
          return (
            <Box component="li" key={item.id || query} sx={{ display: { xs: hiddenOnPhone ? 'none' : 'block', md: 'block' } }}>
              <Box
                component="button"
                type="button"
                onClick={() => onOpen(query)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '0.5rem minmax(0, 1fr) auto',
                  columnGap: 1.25,
                  alignItems: 'center',
                  width: '100%',
                  textAlign: 'start',
                  border: 0,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  px: 2,
                  py: 1.25,
                  minHeight: 56,
                  color: 'inherit',
                  font: 'inherit',
                  transition: 'background-color 140ms ease',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:focus-visible': { outline: '3px solid var(--focus-ring)', outlineOffset: '-3px' },
                }}
              >
                <Box aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tone.main }} />
                <Box sx={{ minWidth: 0 }}>
                  <BidiText component="span" sx={{ display: 'block', fontWeight: 500, fontSize: 15, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                    {item.title || query}
                  </BidiText>
                  <Typography component="span" sx={{ display: 'block', mt: 0.25, fontFamily: FONT_MONO, fontSize: 11.5, color: 'text.secondary' }} dir="auto">
                    {query}
                    {item.conflict ? ` · ${t('library.bothSides')}` : ''}
                  </Typography>
                </Box>
                <Typography component="span" sx={{ fontSize: 12.5, fontWeight: 600, color: tone.main, whiteSpace: 'nowrap' }}>
                  {t(`verdict.${key}`, { defaultValue: item.verdict })}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>

      {collapsible ? (
        <Box sx={{ display: { xs: 'block', md: 'none' }, borderTop: '1px solid', borderColor: 'divider', p: 1 }}>
          <Button fullWidth onClick={() => setExpanded((open) => !open)} aria-expanded={expanded} sx={{ minHeight: 44 }}>
            {expanded ? t('library.showLess') : t('library.showAll', { count: visible.length })}
          </Button>
        </Box>
      ) : null}

      <Box sx={{ px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
          {t('library.footer')}
        </Typography>
      </Box>
    </Box>
  )
}
