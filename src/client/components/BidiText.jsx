import { Box, Typography } from '@mui/material'
import { segmentMixedBidi } from '../../../lib/bidi.js'

function MixedCopy({ text }) {
  const parts = segmentMixedBidi(text)
  if (parts.length <= 1 && parts[0]?.dir !== 'ltr') return text
  return parts.map((part, index) =>
    part.dir === 'ltr' ? (
      <Box
        key={`${part.dir}-${index}-${part.text}`}
        component="span"
        dir="ltr"
        sx={{ unicodeBidi: 'isolate', display: 'inline' }}
      >
        {part.text}
      </Box>
    ) : (
      <Box key={`${part.dir}-${index}-${part.text}`} component="span">
        {part.text}
      </Box>
    ),
  )
}

/**
 * Isolate mixed copy so LTR English or fatwa numbers inside an RTL page
 * keep their trailing punctuation instead of leaking a leading period.
 */
export default function BidiText({
  children,
  sx,
  component,
  variant,
  color,
  className,
  ...rest
}) {
  if (children == null || children === '') return null
  return (
    <Typography
      component={component}
      variant={variant}
      color={color}
      className={className}
      dir="auto"
      sx={{ unicodeBidi: 'plaintext', ...sx }}
      {...rest}
    >
      <MixedCopy text={children} />
    </Typography>
  )
}

export function BidiChipLabel({ children }) {
  if (children == null || children === '') return null
  return (
    <Box component="span" dir="auto" sx={{ unicodeBidi: 'isolate', display: 'inline' }}>
      <MixedCopy text={children} />
    </Box>
  )
}
