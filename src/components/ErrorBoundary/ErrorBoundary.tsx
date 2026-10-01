import { Component, Fragment, type ReactNode } from 'react'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import Logo from '../Logo.tsx'

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <Box
      role="alert"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Stack spacing={2.25} sx={{ alignItems: 'flex-start' }}>
          <Logo size={32} />
          <Typography variant="h1" sx={{ fontSize: { xs: 36, sm: 48 } }}>
            {t('errorBoundary.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.65, maxWidth: 460 }}>
            {t('errorBoundary.body')}
          </Typography>
          <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={onRetry}>
              {t('errorBoundary.retry')}
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              {t('errorBoundary.reload')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  resetKey: number
}

export default class ErrorBoundary extends Component<{ children?: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, resetKey: 0 }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Page render failed', error)
  }

  retry = () => {
    this.setState((state) => ({ hasError: false, resetKey: state.resetKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.retry} />
    }
    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>
  }
}
