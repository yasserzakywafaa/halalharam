import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Alert, Box, Button, InputBase, LinearProgress, Snackbar, Stack, Typography, useTheme } from '@mui/material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { FONT_MONO } from '../theme.ts'
import { useTranslation } from 'react-i18next'
import AdSlot from '../components/AdSlot.tsx'
import GlossarySheet from '../components/GlossarySheet.tsx'
import HowThisWorks from '../components/HowThisWorks.tsx'
import LookupActions from '../components/LookupActions.tsx'
import LookupState from '../components/LookupState.tsx'
import StarterLibrary, { type LibraryCardItem } from '../components/StarterLibrary.tsx'
import type { LookupStateKind } from '../components/LookupState.tsx'
import type { CodedError, VerdictResponse } from '../../../lib/types.ts'
import VerdictCard from '../components/VerdictCard.tsx'
import { fetchHealth, fetchVerdict, isVerdictNetworkFailure } from '../verdictClient.ts'
import { useLocale } from '../providers.tsx'
import { NavLink, useRoute } from '../route.tsx'
import { queueScrollToVerdict, VERDICT_ID } from '../scrollToVerdict.ts'
import { isInsideOverlay, searchFieldEscapeAction, shouldFocusSearchOnSlash } from '../searchKeys.ts'

const EXAMPLES = [
  { query: 'pork', key: 'examples.pork' },
  { query: 'gelatin', key: 'examples.gelatin' },
  { query: 'alcohol', key: 'examples.alcohol' },
  { query: 'riba', key: 'examples.riba' },
  { query: 'shrimp', key: 'examples.shrimp' },
  { query: 'vanilla extract', key: 'examples.vanilla' },
  { query: 'music', key: 'examples.music' },
  { query: 'dates', key: 'examples.dates' },
]

const FALLBACK_LIBRARY: LibraryCardItem[] = [
  { query: 'gelatin', title: 'Gelatin (and gelatin-based sweets)', verdict: 'unclear', conflict: true },
  { query: 'pork', title: 'Pork and swine products', verdict: 'haram' },
  { query: 'music', title: 'Music', verdict: 'unclear', conflict: true },
  { query: 'vanilla extract', title: 'Vanilla extract', verdict: 'unclear', conflict: true },
  { query: 'shrimp', title: 'Shellfish (shrimp, crab, lobster)', verdict: 'unclear', conflict: true },
  { query: 'alcohol', title: 'Alcohol and intoxicants (khamr)', verdict: 'haram' },
  { query: 'cheese', title: 'Cheese and animal rennet', verdict: 'unclear', conflict: true },
  { query: 'riba', title: 'Riba (interest / usury)', verdict: 'haram' },
]

function writeQueryParam(value: string) {
  const url = new URL(window.location.href)
  if (value) url.searchParams.set('q', value)
  else url.searchParams.delete('q')
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(null, '', next)
}

function unavailableKind(result: VerdictResponse | null): Extract<LookupStateKind, 'missing_key' | 'lookup_failed'> | null {
  if (!result || result.sourcePath !== 'unavailable') return null
  // `missing_key` is a legacy reason some older payloads used.
  if (result.unavailableReason === 'no_api_key' || (result.unavailableReason as string) === 'missing_key') {
    return 'missing_key'
  }
  return 'lookup_failed'
}

export default function HomePage() {
  const { t } = useTranslation()
  const { language } = useLocale()
  const theme = useTheme()
  const rtl = theme.direction === 'rtl'
  const { registerHomeReset } = useRoute()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<VerdictResponse | null>(null)
  const [error, setError] = useState('')
  const [offlineNotice, setOfflineNotice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [library, setLibrary] = useState<LibraryCardItem[]>(FALLBACK_LIBRARY)
  const [openRouterConfigured, setOpenRouterConfigured] = useState<boolean | null>(null)
  const [pinnedVerdict, setPinnedVerdict] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const resultRef = useRef(result)
  const requestSeq = useRef(0)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  resultRef.current = result

  const canSearch = useMemo(() => query.trim().length >= 2 && !loading, [query, loading])
  const blocked = unavailableKind(result)
  const showingVerdict = Boolean(result) && !loading && !error && !blocked

  useEffect(() => {
    return registerHomeReset(() => {
      abortRef.current?.abort()
      requestSeq.current += 1
      setQuery('')
      setResult(null)
      setError('')
      setOfflineNotice(false)
      setLoading(false)
      setPinnedVerdict(false)
      writeQueryParam('')
    })
  }, [registerHomeReset])

  useEffect(() => {
    let cancelled = false
    fetchHealth(language)
      .then((data) => {
        if (cancelled || !data) return
        setOpenRouterConfigured(Boolean(data.openRouterConfigured ?? data.openRouterKeyPresent))
        const items = data.library || data.examples || []
        if (items.length) {
          setLibrary(
            items.map((item) => ({
              ...item,
              query: ('query' in item && item.query) || item.label,
            })),
          )
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [language])

  function focusSearch() {
    const node = searchRef.current
    if (!node) return
    node.focus()
    if (typeof node.select === 'function') node.select()
  }

  async function runSearch(value?: string) {
    const next = (value ?? query).trim()
    if (next.length < 2) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const seq = ++requestSeq.current
    setQuery(next)
    writeQueryParam(next)
    setLoading(true)
    setError('')
    setOfflineNotice(false)
    setResult(null)
    setFocusToken((token) => token + 1)
    try {
      const data = await fetchVerdict(next, language, { signal: controller.signal })
      if (seq !== requestSeq.current || controller.signal.aborted) return
      setResult(data)
      if (data?.sourcePath !== 'unavailable') setPinnedVerdict(true)
      setFocusToken((token) => token + 1)
    } catch (caught) {
      const err = caught as CodedError
      if (err?.name === 'AbortError' || controller.signal.aborted || seq !== requestSeq.current) return
      if (isVerdictNetworkFailure(err)) {
        setError('')
        setOfflineNotice(true)
      } else {
        setResult(null)
        setOfflineNotice(false)
        setError(err.status === 429 ? t('search.rateLimited') : err.message || t('search.failed'))
      }
      setFocusToken((token) => token + 1)
    } finally {
      if (abortRef.current === controller && seq === requestSeq.current) setLoading(false)
    }
  }

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q')?.trim() || ''
    if (initial.length >= 2) {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      requestSeq.current += 1
      const seq = requestSeq.current
      setQuery(initial)
      setLoading(true)
      fetchVerdict(initial, language, { signal: controller.signal })
        .then((data) => {
          if (seq !== requestSeq.current || controller.signal.aborted) return
          setResult(data)
          if (data?.sourcePath !== 'unavailable') setPinnedVerdict(true)
          setFocusToken((token) => token + 1)
        })
        .catch((err) => {
          if (err?.name === 'AbortError' || controller.signal.aborted || seq !== requestSeq.current) return
          if (isVerdictNetworkFailure(err)) {
            setError('')
            setOfflineNotice(true)
          } else {
            setError(err.message || t('search.failed'))
          }
        })
        .finally(() => {
          if (abortRef.current === controller && seq === requestSeq.current) setLoading(false)
        })
    }
    return () => {
      requestSeq.current += 1
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first paint only
  }, [])

  useEffect(() => {
    const current = resultRef.current
    const q = String(current?.query || '').trim()
    if (!q) return undefined
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const seq = ++requestSeq.current
    setLoading(true)
    setError('')
    setOfflineNotice(false)
    fetchVerdict(q, language, { signal: controller.signal })
      .then((data) => {
        if (seq !== requestSeq.current || controller.signal.aborted) return
        setResult(data)
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || controller.signal.aborted || seq !== requestSeq.current) return
        if (isVerdictNetworkFailure(err)) {
          setError('')
          setOfflineNotice(true)
        } else {
          setError(err.message || t('search.failed'))
        }
      })
      .finally(() => {
        if (abortRef.current === controller && seq === requestSeq.current) setLoading(false)
      })
    return () => {
      requestSeq.current += 1
      controller.abort()
    }
  }, [language, t])

  useEffect(() => {
    if (!focusToken) return undefined
    return queueScrollToVerdict()
  }, [focusToken])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSearch || loading) runSearch()
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (query.trim().length >= 2) runSearch()
      return
    }
    if (event.key !== 'Escape') return
    const action = searchFieldEscapeAction({ loading, query })
    event.preventDefault()
    if (action === 'abort') {
      abortRef.current?.abort()
      setLoading(false)
      return
    }
    if (action === 'clear') {
      setQuery('')
      setError('')
      setOfflineNotice(false)
      return
    }
    event.currentTarget.blur()
  }

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (shouldFocusSearchOnSlash(event)) {
        event.preventDefault()
        focusSearch()
        return
      }
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (isInsideOverlay(target)) return
      if (loading) {
        event.preventDefault()
        abortRef.current?.abort()
        setLoading(false)
        return
      }
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (offlineNotice) {
        event.preventDefault()
        setOfflineNotice(false)
        return
      }
      const verdict = document.getElementById(VERDICT_ID)
      if (verdict && target && (target === verdict || verdict.contains(target))) {
        event.preventDefault()
        focusSearch()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [offlineNotice, loading])

  useEffect(() => () => abortRef.current?.abort(), [])

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 340px' },
        gap: { xs: 3, md: 5 },
        alignItems: 'start',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box data-print-hide="">
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: 30, sm: 40, md: showingVerdict || (loading && pinnedVerdict) ? 40 : 52 },
              maxWidth: 740,
              textWrap: 'balance',
            }}
          >
            {showingVerdict || (loading && pinnedVerdict) ? t('hero.titleResult') : t('hero.title')}
          </Typography>
          <Typography sx={{ mt: 1.25, maxWidth: 560, fontSize: { xs: 15.5, md: 18 }, lineHeight: 1.6, color: 'text.secondary' }}>
            {t('hero.dek')}
          </Typography>
          <GlossarySheet />
        </Box>

        <AdSlot placement="banner" />

        <Box data-print-hide="" sx={{ mt: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75, px: 0.25 }}>
            <Typography
              component="label"
              htmlFor="lookup-query"
              sx={{
                fontFamily: FONT_MONO,
                fontSize: 11.5,
                lineHeight: 1.4,
                letterSpacing: rtl ? 0 : '0.08em',
                textTransform: rtl ? 'none' : 'uppercase',
                color: 'text.secondary',
              }}
            >
              {t('search.label')}
            </Typography>
            <Typography
              component="span"
              sx={{ display: { xs: 'none', md: 'inline-flex' }, alignItems: 'center', gap: 0.6, fontSize: 12, color: 'text.secondary' }}
            >
              <Box
                component="kbd"
                aria-hidden="true"
                sx={{
                  fontFamily: FONT_MONO,
                  fontSize: 11.5,
                  lineHeight: 1.2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 0.5,
                  px: 0.65,
                  py: 0.15,
                  color: 'text.primary',
                }}
              >
                /
              </Box>
              {t('search.shortcut')}
            </Typography>
          </Stack>
          <Box
            component="form"
            role="search"
            onSubmit={onSubmit}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'background.paper',
              border: '1.5px solid',
              borderColor: 'divider',
              borderRadius: 999,
              pl: { xs: 2, md: 2.75 },
              pr: 0.75,
              py: 0.75,
              overflow: 'hidden',
              boxShadow: (th) => (th.palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(17, 23, 41, 0.04), 0 8px 24px rgba(17, 23, 41, 0.06)'),
              transition: 'border-color 140ms ease, box-shadow 140ms ease',
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: (th) => `0 0 0 4px color-mix(in srgb, ${th.palette.primary.main} 18%, transparent)`,
              },
            }}
          >
            <InputBase
              id="lookup-query"
              fullWidth
              inputRef={searchRef}
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              readOnly={loading}
              inputProps={{
                maxLength: 200,
                enterKeyHint: 'search',
                autoComplete: 'off',
                autoCapitalize: 'none',
                spellCheck: false,
                'aria-label': t('search.aria'),
                'aria-keyshortcuts': '/',
                onKeyDown: onSearchKeyDown,
              }}
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                // 16px minimum keeps iOS Safari from zooming the page on focus.
                fontSize: { xs: 17, md: 20 },
                '& input': { py: 1, textOverflow: 'ellipsis' },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!canSearch}
              aria-label={loading ? t('search.looking') : t('search.submit')}
              endIcon={<ArrowForward sx={{ transform: rtl ? 'scaleX(-1)' : 'none' }} />}
              sx={{
                flexShrink: 0,
                minHeight: 46,
                px: { xs: 1.75, sm: 2.25 },
                '& .MuiButton-endIcon': { ml: { xs: 0, sm: 1 }, mr: 0 },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {loading ? t('search.looking') : t('search.submit')}
              </Box>
            </Button>
            {loading ? (
              <LinearProgress aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2 }} />
            ) : null}
          </Box>
        </Box>

        <Box
          data-print-hide=""
          component="ul"
          aria-label={t('examples.label')}
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: { xs: 'nowrap', md: 'wrap' },
            overflowX: { xs: 'auto', md: 'visible' },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            // Bleed to the screen edge on phones so the row reads as scrollable.
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            mt: 1.5,
            mb: 0,
            py: 0.5,
            listStyle: 'none',
          }}
        >
          {EXAMPLES.map((example) => (
            <Box component="li" key={example.query} sx={{ m: 0, flexShrink: 0 }}>
              <Box
                component="button"
                type="button"
                onClick={() => runSearch(example.query)}
                disabled={loading}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 999,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  font: 'inherit',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.55 : 1,
                  px: 1.5,
                  minHeight: 40,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  transition: 'border-color 140ms ease, color 140ms ease',
                  '&:hover': loading ? {} : { borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                {t(example.key)}
              </Box>
            </Box>
          ))}
        </Box>

        {!showingVerdict && !loading && !offlineNotice ? <HowThisWorks /> : null}

        <Box
          id={VERDICT_ID}
          tabIndex={-1}
          aria-busy={loading || undefined}
          aria-label={t('a11y.results')}
          sx={{
            mt: { xs: 2.5, md: 3 },
            scrollMarginTop: '5rem',
            outline: 'none',
            '&:focus-visible': { outline: 'none' },
          }}
        >
          {loading ? <LookupState kind="loading" /> : null}
          {!loading && error ? <LookupState kind="error" onRetry={() => runSearch(query)} /> : null}
          {!loading && !error && blocked ? (
            <LookupState
              kind={blocked}
              onRetry={blocked === 'lookup_failed' ? () => runSearch(query) : undefined}
            />
          ) : null}
          {!loading && !error && result && !blocked ? (
            <VerdictCard key={`${language}-${result.seedId || result.query}`} result={result} />
          ) : null}
          {!loading && !error && !result ? (
            <Box sx={{ pt: 0.5, maxWidth: 540 }}>
              <Typography variant="h2" sx={{ fontSize: 24, mb: 1 }}>
                {t('empty.title')}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 16, lineHeight: 1.65 }}>
                {t('empty.body')}
              </Typography>
              {openRouterConfigured === false ? (
                <Typography sx={{ mt: 1.5, fontSize: 15.5, lineHeight: 1.6 }}>{t('empty.liveOff')}</Typography>
              ) : null}
            </Box>
          ) : null}
        </Box>

        {showingVerdict && result ? <LookupActions query={result.query || query} title={result.title} result={result} /> : null}

        <Snackbar
          open={offlineNotice}
          autoHideDuration={6000}
          onClose={(_, reason) => {
            if (reason === 'clickaway') return
            setOfflineNotice(false)
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="warning"
            variant="outlined"
            role="status"
            onClose={() => setOfflineNotice(false)}
            sx={{ bgcolor: 'background.paper', color: 'text.primary', borderColor: 'divider' }}
          >
            {t('search.offline')}
          </Alert>
        </Snackbar>

        <AdSlot placement="banner" />

        <Stack
          data-print-hide=""
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' }, mt: 2.5 }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: 13 }}>
            {t('disclaimer.short')}
          </Typography>
        </Stack>

        <Box data-print-hide="" sx={{ mt: 2.75, maxWidth: 640 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.6 }}>{t('how.title')}</Typography>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.6, m: 0 }}>
            {t('how.body')}
          </Typography>
          <NavLink to="/about" sx={{ display: 'inline-block', mt: 1 }}>
            {t('how.more')}
          </NavLink>
        </Box>
      </Box>

      <Stack data-print-hide="" spacing={2} sx={{ position: { md: 'sticky' }, top: { md: 80 }, minWidth: 0 }}>
        <StarterLibrary items={library} onOpen={runSearch} />
        <AdSlot placement="sidebar" />
      </Stack>

    </Box>
  )
}
