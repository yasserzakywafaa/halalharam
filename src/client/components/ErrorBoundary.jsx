import { Component, Fragment } from 'react'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import BrandMark from './BrandMark.jsx'

function ErrorFallback({ onRetry }) {
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
        <Stack spacing={2.25} alignItems="flex-start">
          <BrandMark size={32} />
          <Typography variant="h1" sx={{ fontSize: { xs: 36, sm: 48 } }}>
            {t('errorBoundary.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.65, maxWidth: 460 }}>
            {t('errorBoundary.body')}
          </Typography>
          <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
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

export default class ErrorBoundary extends Component {
  state = { hasError: false, resetKey: 0 }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
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
