import { Typography, useTheme } from '@mui/material'

export default function Kicker({ children, sx }) {
  const theme = useTheme()
  const rtl = theme.direction === 'rtl'

  return (
    <Typography
      component="p"
      sx={{
        m: 0,
        fontSize: 12,
        lineHeight: 1.4,
        fontWeight: 700,
        letterSpacing: rtl ? 0 : '0.08em',
        textTransform: rtl ? 'none' : 'uppercase',
        color: 'secondary.main',
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}
