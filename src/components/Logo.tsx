import { Box } from '@mui/material'

/** An open book on a lapis tile: a reference you read, with a source on each page. */
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      sx={{ width: size, height: size, display: 'block', flexShrink: 0, color: 'primary.main' }}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M16 10.4c-2.2-1.5-4.8-2-7.6-1.8v12.8c2.8-.2 5.4.3 7.6 1.8 2.2-1.5 4.8-2 7.6-1.8V8.6c-2.8-.2-5.4.3-7.6 1.8Z"
        fill="none"
        stroke="var(--brand-mark-ink, var(--page-bg))"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M16 10.4v12.8" stroke="var(--brand-mark-ink, var(--page-bg))" strokeWidth="1.9" strokeLinecap="round" />
    </Box>
  )
}
