import { Box, useTheme } from '@mui/material'

/** Simple ask-mark: the product is a question with sources. */
export default function BrandMark({ size = 28 }) {
  const theme = useTheme()

  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        color: 'primary.main',
        transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none',
      }}
    >
      <path
        d="M10.4 11.3c0-3.6 3-6.5 6.7-6.5 3.55 0 6.4 2.55 6.4 5.95 0 2.25-1.1 3.75-3.25 5.1-1.9 1.2-2.9 2.25-2.9 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.15"
        strokeLinecap="round"
      />
      <circle cx="17.35" cy="24.85" r="2.1" fill="currentColor" />
    </Box>
  )
}
