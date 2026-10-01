import { Box, Typography } from '@mui/material'

export function ProsePage({ title, lead, children }) {
  return (
    <Box component="article" sx={{ maxWidth: 720, pb: 1 }}>
      <Typography variant="h1" sx={{ fontSize: { xs: 34, sm: 48 }, maxWidth: 680 }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 1.75, fontSize: { xs: 16, md: 18 }, lineHeight: 1.65, color: 'text.secondary' }}>
        {lead}
      </Typography>
      {children}
    </Box>
  )
}

export function ProseSection({ title, children }) {
  return (
    <Box sx={{ mt: 3.5 }}>
      <Typography variant="h2" sx={{ fontSize: { xs: 22, md: 26 }, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

export function ProseBody({ children }) {
  return (
    <Typography sx={{ fontSize: 16.5, lineHeight: 1.7, color: 'text.primary' }}>{children}</Typography>
  )
}
