import { Box, Chip, Link, Stack, Tooltip, Typography } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useTranslation } from 'react-i18next'
import Kicker from './Kicker.jsx'
import { useLocale, usePlainExplanations } from '../providers.jsx'
import { useVerdictColors } from '../theme.js'
import BidiText, { BidiChipLabel } from './BidiText.jsx'
import { knownVerdict, shouldShowVerdictGloss } from '../verdictGloss.js'

const VERDICT_GLOSS_ID = 'verdict-status-gloss'

function sourcePathKey(sourcePath) {
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

function VerdictStanceChip({ verdict, glossId, ...chipProps }) {
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

function sourceChipLabel(source) {
  return source.authority || source.name || ''
}

function SourceList({ sources }) {
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
              gridTemplateColumns: '2.25rem minmax(0, 1fr)',
              gap: 1.1,
              py: 1.35,
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Fraunces, "Noto Naskh Arabic", Georgia, serif',
                fontSize: 16,
                color: 'text.secondary',
                lineHeight: 1.4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </Typography>
            <Box>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 0.6 }}>
                {source.authority ? (
                  <Chip size="small" variant="outlined" label={<BidiChipLabel>{source.authority}</BidiChipLabel>} />
                ) : null}
                {source.stance ? <VerdictStanceChip verdict={source.stance} /> : null}
              </Stack>
              <BidiText sx={{ fontWeight: 650, fontSize: 16, overflowWrap: 'anywhere' }}>{source.name}</BidiText>
              {source.excerpt ? (
                <BidiText
                  sx={{
                    mt: 0.5,
                    fontFamily: 'Fraunces, "Noto Naskh Arabic", Georgia, serif',
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    fontSize: 14.5,
                    lineHeight: 1.55,
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

function PositionCard({ position }) {
  const { t } = useTranslation()
  const verdictColors = useVerdictColors()
  const tone = verdictColors[position.stance] || verdictColors.unclear
  const sources = position.sources || []
  const hint = t(`verdict.chipHint.${knownVerdict(position.stance)}`)

  return (
    <Box
      sx={{
        borderRadius: 1,
        p: { xs: 1.75, sm: 2 },
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minWidth: 0,
        height: '100%',
      }}
    >
      <Tooltip title={hint} describeChild enterDelay={150} enterTouchDelay={0} leaveDelay={0}>
        <Typography sx={{ color: tone.main, fontWeight: 700, fontSize: 13, width: 'fit-content' }}>
          {t(`verdict.${position.stance}`, { defaultValue: position.stance })}
        </Typography>
      </Tooltip>
      <BidiText sx={{ mt: 0.75, fontWeight: 650, fontSize: 17, lineHeight: 1.35 }}>{position.title}</BidiText>
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
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
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

export default function VerdictCard({ result }) {
  const { t } = useTranslation()
  const { direction } = useLocale()
  const { plainExplanations } = usePlainExplanations()
  const verdictColors = useVerdictColors()
  const verdictKey = knownVerdict(result.verdict)
  const tone = verdictColors[verdictKey] || verdictColors.unclear
  const showConflict = result.conflict && result.positions?.length >= 2
  const pct = Math.round((result.confidence || 0) * 100)
  const showGloss = shouldShowVerdictGloss(plainExplanations)

  return (
    <Box
      component="article"
      className="folio-in"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 2.75, md: 3.25 }, pt: { xs: 2.25, md: 2.75 }, pb: { xs: 2, md: 2.25 } }}>
        <Typography className="print-only" component="p">
          {t('footer.note')}
        </Typography>
        <Typography
          aria-describedby={showGloss ? VERDICT_GLOSS_ID : undefined}
          sx={{
            fontFamily: 'Fraunces, "Noto Naskh Arabic", Georgia, serif',
            fontSize: { xs: 32, sm: 40, md: 48 },
            lineHeight: 1.15,
            letterSpacing: direction === 'rtl' ? 0 : '-0.03em',
            color: tone.main,
            fontWeight: 650,
            overflowWrap: 'break-word',
          }}
        >
          {t(`verdict.${result.verdict}`, { defaultValue: result.verdict })}
        </Typography>
        {showGloss ? (
          <Typography
            id={VERDICT_GLOSS_ID}
            color="text.secondary"
            sx={{ mt: 0.85, fontSize: 15, lineHeight: 1.5, maxWidth: '62ch' }}
          >
            {t(`verdict.gloss.${verdictKey}`)}
          </Typography>
        ) : null}
        <BidiText component="h2" variant="h2" sx={{ mt: 1.25, fontSize: { xs: 22, md: 26 }, overflowWrap: 'break-word' }}>
          {result.title}
        </BidiText>
        {result.query ? (
          <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 14.5 }} dir="auto">
            {t('verdict.searched', { query: result.query })}
          </Typography>
        ) : null}
        <Stack data-print-hide="" direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.75 }}>
          <VerdictStanceChip verdict={result.verdict} glossId={showGloss ? VERDICT_GLOSS_ID : undefined} />
          <Chip size="small" variant="outlined" label={t(sourcePathKey(result.sourcePath))} />
          <Chip
            size="small"
            variant="outlined"
            label={t('verdict.confidenceChip', { pct })}
            aria-label={t('verdict.confidence')}
          />
          {showConflict ? (
            <Chip size="small" variant="outlined" label={t('verdict.conflictTitle')} />
          ) : result.lowConfidence ? (
            <Chip size="small" variant="outlined" label={t('verdict.lowConfidenceChip')} />
          ) : null}
        </Stack>
      </Box>

      <Stack
        spacing={2.25}
        sx={{
          px: { xs: 2, sm: 2.75, md: 3.25 },
          pb: { xs: 2.5, md: 3 },
          borderTop: '1px solid',
          borderColor: 'divider',
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
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="baseline">
            <Kicker sx={{ color: 'text.secondary' }}>{t('verdict.accordingTo')}</Kicker>
            <FatwaHint />
          </Stack>
          <BidiText
            sx={{
              mt: 0.55,
              fontFamily: 'Fraunces, "Noto Naskh Arabic", Georgia, serif',
              fontStyle: 'italic',
              fontSize: { xs: 17, md: 19 },
              lineHeight: 1.45,
              fontWeight: 500,
              overflowWrap: 'anywhere',
            }}
          >
            {result.accordingTo}
          </BidiText>
        </Box>

        <BidiText sx={{ fontSize: 16.5, lineHeight: 1.7, overflowWrap: 'anywhere' }}>{result.summary}</BidiText>

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
            <Typography variant="h3" sx={{ fontSize: 20, mb: 0.25 }}>
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
