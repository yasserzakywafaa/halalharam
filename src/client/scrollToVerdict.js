const VERDICT_ID = 'verdict'

function headerOffset() {
  const header = document.querySelector('[data-app-header]')
  if (!header) return 16
  return Math.round(header.getBoundingClientRect().height) + 8
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
}

function isNarrowViewport() {
  return Boolean(window.matchMedia?.('(max-width: 900px)')?.matches)
}

export function scrollToVerdict() {
  const node = document.getElementById(VERDICT_ID)
  if (!node) return false

  const offset = headerOffset()
  node.style.scrollMarginTop = `${offset}px`

  try {
    if (document.activeElement && document.activeElement !== node && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur()
    }
    node.focus({ preventScroll: true })
  } catch {
    // Focus is best-effort; scrolling still proceeds.
  }

  // iOS smooth scrollIntoView is unreliable; jump on narrow viewports.
  const behavior = prefersReducedMotion() || isNarrowViewport() ? 'auto' : 'smooth'
  const top = Math.max(0, window.scrollY + node.getBoundingClientRect().top - offset)

  try {
    node.scrollIntoView({ behavior, block: 'start', inline: 'nearest' })
  } catch {
    // Older browsers: fall through to window.scrollTo.
  }

  try {
    window.scrollTo({ top, behavior })
  } catch {
    window.scrollTo(0, top)
  }

  try {
    const url = new URL(window.location.href)
    if (url.hash !== `#${VERDICT_ID}`) {
      url.hash = VERDICT_ID
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    }
  } catch {
    // Ignore malformed location.
  }

  return true
}

/** Retry after paint — the verdict node may not exist until React commits. */
export function queueScrollToVerdict() {
  let cancelled = false
  const timers = []

  const run = () => {
    if (cancelled) return
    scrollToVerdict()
  }

  const raf = requestAnimationFrame(() => {
    requestAnimationFrame(run)
  })
  timers.push(setTimeout(run, 50))
  timers.push(setTimeout(run, 180))
  timers.push(setTimeout(run, 400))

  return () => {
    cancelled = true
    cancelAnimationFrame(raf)
    for (const timer of timers) clearTimeout(timer)
  }
}

export { VERDICT_ID }
