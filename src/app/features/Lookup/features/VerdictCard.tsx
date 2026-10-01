import { Box, Chip, Link, Stack, Tooltip, Typography, type ChipProps } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useTranslation } from 'react-i18next'
import Kicker from '../../../../components/shared/Kicker.tsx'
import { useLocale } from '../../../../lib/application/AppContextProviders.tsx'
import { FONT_MONO, useVerdictColors } from '../../../../lib/application/shared/themes.ts'
import BidiText, { BidiChipLabel } from '../../../../components/shared/BidiText.tsx'
import { knownVerdict } from '../../../../lib/utils/verdictGloss.ts'
import type { Citation, Position, SourcePath, VerdictResponse } from '../../../../lib/application/shared/types.ts'

const VERDICT_GLOSS_ID = 'verdict-status-gloss'

function sourcePathKey(sourcePath: SourcePath | string | undefined): string {
  if (sourcePath === 'seed') return 'verdict.sourceSeed'
  if (sourcePath === 'ai') return 'verdict.sourceAi'
  return 'verdict.sourceNone'
}

function FatwaHint() {
  const { t } = useTranslation()
  const term = t('verdict.fatwa.term')
  const hint = t('verdict.fatwa.hint')

  return (
    <Tooltip title={hint} describeChild placement="top" enterDelay={150} enterTouchDelay={0} leaveDelay={0}>
      <Box
        component="button"
        type="button"
        aria-label={`${term}. ${hint}`}
        sx={{
          appearance: 'none',
          background: 'none',
          border: 0,
          m: 0,
          px: 0.25,
          py: 0.25,
          font: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.4,
          color: 'text.secondary',
          cursor: 'help',
          textDecoration: 'underline dotted',
          textUnderlineOffset: '0.18em',
        }}
      >
        {term}
      </Box>
    </Tooltip>
  )
}

type VerdictStanceChipProps = Omit<ChipProps, 'label'> & {
  verdict: string | undefined
  glossId?: string
}

function VerdictStanceChip({ verdict, glossId, ...chipProps }: VerdictStanceChipProps) {
  const { t } = useTranslation()
  const verdictColors = useVerdictColors()
  const key = knownVerdict(verdict)
  const tone = verdictColors[key] || verdictColors.unclear
  const label = t(`verdict.${key}`, { defaultValue: verdict })
  const hint = t(`verdict.chipHint.${key}`)

  return (
    <Tooltip title={hint} describeChild enterDelay={150} enterTouchDelay={0} leaveDelay={0}>
      <Chip
        size="small"
        variant="outlined"
        label={label}
        aria-describedby={glossId}
        sx={{ color: tone.main, borderColor: tone.main }}
        {...chipProps}
      />
    </Tooltip>
  )
}

function sourceChipLabel(source: Citation): string {
  return source.authority || source.name || ''
}

function SourceList({ sources }: { sources: Citation[] }) {
  const { t } = useTranslation()

  if (!sources?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('verdict.noCitations')}
      </Typography>
    )
  }

  return (
    <Stack spacing={0} divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
      {sources.map((source, index) => {
        return (
          <Box
            key={`${source.url}-${source.name}-${index}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: '2rem minmax(0, 1fr)',
              gap: 1,
              py: 1.5,
            }}
          >
            <Typography
              sx={{
                fontFamily: FONT_MONO,
                fontSize: 12.5,
                color: 'primary.main',
                lineHeight: 1.9,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              [{index + 1}]
            </Typography>
            <Box>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mb: 0.6 }}>
                {source.authority ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={<BidiChipLabel>{source.authority}</BidiChipLabel>}
                    sx={{ maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.35, py: 0.4 } }}
                  />
                ) : null}
                {source.stance ? <VerdictStanceChip verdict={source.stance} /> : null}
              </Stack>
              <BidiText sx={{ fontWeight: 600, fontSize: 15.5, lineHeight: 1.4, overflowWrap: 'anywhere' }}>{source.name}</BidiText>
              {source.excerpt ? (
                <BidiText
                  sx={{
                    mt: 0.75,
                    pl: 1.25,
                    borderLeft: '2px solid',
                    borderColor: 'divider',
                    color: 'text.secondary',
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {source.excerpt}
                </BidiText>
              ) : null}
              {source.url ? (
                <Link
                  className="print-append-url"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  dir="ltr"
                  aria-label={`${t('verdict.readCitation')}: ${source.name}. ${t('a11y.newTab')}`}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.75,
                    fontSize: 15,
                    overflowWrap: 'anywhere',
                    unicodeBidi: 'isolate',
                  }}
                >
                  {t('verdict.readCitation')}
                  <OpenInNewIcon aria-hidden="true" sx={{ fontSize: 14 }} />
                </Link>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.65 }}>
                  {t('verdict.noUrl')}
                </Typography>
              )}
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}

function PositionCard({ position }: { position: Position }) {
  const { t } = useTranslation()
  const verdictColors = useVerdictColors()
  const tone = verdictColors[knownVerdict(position.stance)]
  const sources = position.sources || []
  const hint = t(`verdict.chipHint.${knownVerdict(position.stance)}`)

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        p: { xs: 1.75, sm: 2 },
        border: '1px solid',
        borderColor: 'divider',
        borderTop: '3px solid',
        borderTopColor: tone.main,
        bgcolor: 'background.default',
        minWidth: 0,
        height: '100%',
      }}
    >
      <Tooltip title={hint} describeChild enterDelay={150} enterTouchDelay={0} leaveDelay={0}>
        <Typography sx={{ color: tone.main, fontWeight: 600, fontSize: 13, width: 'fit-content', fontFamily: FONT_MONO, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {t(`verdict.${position.stance}`, { defaultValue: position.stance })}
        </Typography>
      </Tooltip>
      <BidiText sx={{ mt: 0.75, fontWeight: 600, fontSize: 16.5, lineHeight: 1.35 }}>{position.title}</BidiText>
      {position.summary ? (
        <BidiText sx={{ mt: 1, fontSize: 15, lineHeight: 1.6 }}>{position.summary}</BidiText>
      ) : null}
      {position.accordingTo ? (
        <BidiText sx={{ mt: 1, color: 'text.secondary', fontSize: 14, lineHeight: 1.5 }}>
          {position.accordingTo}
        </BidiText>
      ) : null}
      <Typography sx={{ mt: 1.5, mb: 0.75, fontSize: 13, color: 'text.secondary' }}>
        {t('verdict.sourcesLabel')}
      </Typography>
      {sources.length ? (
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {sources.map((source, index) => {
            const label = sourceChipLabel(source)
            const detail = source.name && source.name !== label ? source.name : ''
            const chipProps = source.url
              ? {
                  component: 'a',
                  href: source.url,
                  target: '_blank',
                  rel: 'noreferrer',
                  clickable: true,
                }
              : { component: 'span' }
            return (
              <Chip
                key={`${source.url}-${label}-${index}`}
                size="small"
                variant="outlined"
                label={<BidiChipLabel>{label}</BidiChipLabel>}
                title={detail || label}
                aria-label={detail ? `${label}. ${detail}` : label}
                {...chipProps}
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  '& .MuiChip-label': {
                    whiteSpace: 'normal',
                    textAlign: 'start',
                    lineHeight: 1.35,
                    py: 0.5,
                  },
                }}
              />
            )
          })}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('verdict.noCitations')}
        </Typography>
      )}
    </Box>
  )
}

export default function VerdictCard({ result }: { result: VerdictResponse }) {
  const { t } = useTranslation()
  const { direction } = useLocale()
  const verdictColors = useVerdictColors()
  const verdictKey = knownVerdict(result.verdict)
  const tone = verdictColors[verdictKey] || verdictColors.unclear
  const showConflict = result.conflict && result.positions?.length >= 2
  const pct = Math.round((result.confidence || 0) * 100)

  return (
    <Box
      component="article"
      className="folio-in"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 2.75, md: 3.25 },
          pt: { xs: 2, md: 2.75 },
          pb: { xs: 2, md: 2.5 },
          bgcolor: tone.surface,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography className="print-only" component="p">
          {t('footer.note')}
        </Typography>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box aria-hidden="true" sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tone.main, flexShrink: 0 }} />
          <Tooltip title={t(`verdict.chipHint.${verdictKey}`)} describeChild enterDelay={150} enterTouchDelay={0} leaveDelay={0}>
            <Typography
              aria-describedby={VERDICT_GLOSS_ID}
              sx={{
                fontSize: { xs: 34, sm: 42, md: 48 },
                lineHeight: 1.05,
                letterSpacing: direction === 'rtl' ? 0 : '-0.035em',
                color: tone.main,
                fontWeight: 700,
                overflowWrap: 'break-word',
                width: 'fit-content',
              }}
            >
              {t(`verdict.${result.verdict}`, { defaultValue: result.verdict })}
            </Typography>
          </Tooltip>
        </Stack>
        <Typography id={VERDICT_GLOSS_ID} sx={{ mt: 0.75, fontSize: 15, lineHeight: 1.5, maxWidth: '62ch', color: tone.ink }}>
          {t(`verdict.gloss.${verdictKey}`)}
        </Typography>
        <BidiText component="h2" variant="h2" sx={{ mt: 1.5, fontSize: { xs: 21, md: 25 }, overflowWrap: 'break-word', color: tone.ink }}>
          {result.title}
        </BidiText>
        {result.query ? (
          <Typography sx={{ mt: 0.5, fontSize: 13, fontFamily: FONT_MONO, color: tone.ink, opacity: 0.75 }} dir="auto">
            {t('verdict.searched', { query: result.query })}
          </Typography>
        ) : null}
        <Box
          data-print-hide=""
          component="dl"
          sx={{
            m: 0,
            mt: 1.75,
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: 2.5,
            rowGap: 1,
            fontSize: 13,
            color: tone.ink,
            '& dt': { fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: direction === 'rtl' ? 0 : '0.08em', textTransform: 'uppercase', opacity: 0.7 },
            '& dd': { m: 0, mt: 0.25, fontWeight: 600 },
          }}
        >
          <Box>
            <dt>{t('verdict.sourceLabel')}</dt>
            <dd>{t(sourcePathKey(result.sourcePath))}</dd>
          </Box>
          <Box>
            <dt>{t('verdict.confidence')}</dt>
            <Box component="dd" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label={t('verdict.confidence')}
                sx={{ width: 64, height: 6, borderRadius: 99, bgcolor: 'color-mix(in srgb, currentColor 16%, transparent)', overflow: 'hidden' }}
              >
                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: tone.main, borderRadius: 99 }} />
              </Box>
              <Box component="span" sx={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>
                {pct}%
              </Box>
            </Box>
          </Box>
          {showConflict || result.lowConfidence ? (
            <Box>
              <dt>{t('verdict.noteLabel')}</dt>
              <dd>{showConflict ? t('verdict.conflictTitle') : t('verdict.lowConfidenceChip')}</dd>
            </Box>
          ) : null}
        </Box>
      </Box>

      <Stack
        spacing={2.25}
        sx={{
          px: { xs: 2, sm: 2.75, md: 3.25 },
          pb: { xs: 2.5, md: 3 },
          pt: { xs: 2, md: 2.5 },
        }}
      >
        {showConflict ? (
          <Box>
            <Typography component="h3" sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 650, lineHeight: 1.3 }}>
              {t('verdict.conflictTitle')}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 15, lineHeight: 1.6, maxWidth: '62ch' }}>
              {t('verdict.conflictBody')}
            </Typography>
          </Box>
        ) : result.lowConfidence ? (
          <Typography color="text.secondary" sx={{ fontSize: 14.5, lineHeight: 1.55 }}>
            {t('verdict.lowConfidence')}
          </Typography>
        ) : null}

        <Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Kicker sx={{ color: 'text.secondary' }}>{t('verdict.accordingTo')}</Kicker>
            <FatwaHint />
          </Stack>
          <BidiText
            sx={{
              mt: 0.75,
              pl: 1.5,
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              fontSize: { xs: 16.5, md: 18 },
              lineHeight: 1.5,
              fontWeight: 500,
              overflowWrap: 'anywhere',
            }}
          >
            {result.accordingTo}
          </BidiText>
        </Box>

        <BidiText sx={{ fontSize: { xs: 15.5, md: 16.5 }, lineHeight: 1.7, overflowWrap: 'anywhere', maxWidth: '68ch' }}>{result.summary}</BidiText>

        {result.caveats?.length ? (
          <Stack spacing={0.55}>
            <Kicker sx={{ color: 'text.secondary' }}>{t('verdict.caveats')}</Kicker>
            {result.caveats.map((caveat) => (
              <BidiText key={caveat} sx={{ fontSize: 14.5, color: 'text.secondary' }}>
                {caveat}
              </BidiText>
            ))}
          </Stack>
        ) : null}

        {showConflict ? (
          <Box
            data-conflict-columns
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))',
              gap: { xs: 1.5, sm: 2 },
              alignItems: 'stretch',
            }}
          >
            {result.positions.map((position) => (
              <PositionCard key={`${position.stance}-${position.title}`} position={position} />
            ))}
          </Box>
        ) : (
          <Box>
            <Typography variant="h3" sx={{ fontSize: 18, mb: 0.25 }}>
              {t('verdict.citedSources')}
            </Typography>
            <SourceList sources={result.sources} />
          </Box>
        )}

        <BidiText variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
          {result.disclaimer}
        </BidiText>
      </Stack>
    </Box>
  )
}
