import { Box } from '@mui/material'

/** An eight-point star (two turned squares), the classic marker for a section of reference text. */
export default function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      sx={{ width: size, height: size, display: 'block', flexShrink: 0, color: 'primary.main' }}
    >
      <rect x="7" y="7" width="18" height="18" rx="1.5" fill="currentColor" />
      <rect x="7" y="7" width="18" height="18" rx="1.5" fill="currentColor" transform="rotate(45 16 16)" />
      <circle cx="16" cy="16" r="4.2" fill="none" stroke="var(--brand-mark-hole, var(--page-bg))" strokeWidth="2" />
    </Box>
  )
}
