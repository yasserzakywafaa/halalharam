import type { ElementType, ReactNode } from 'react'
import { Box, Typography, type TypographyProps } from '@mui/material'
import { segmentMixedBidi } from '../../lib/utils/bidi.ts'

function MixedCopy({ text }: { text: ReactNode }) {
  if (typeof text !== 'string' && typeof text !== 'number') return text
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
export type BidiTextProps = Omit<TypographyProps, 'children'> & {
  children?: ReactNode
  component?: ElementType
}

export default function BidiText({ children, sx, component, variant, color, className, ...rest }: BidiTextProps) {
  if (children == null || children === '') return null
  return (
    <Typography
      component={component ?? 'p'}
      variant={variant}
      color={color}
      className={className}
      dir="auto"
      sx={[{ unicodeBidi: 'plaintext' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      <MixedCopy text={children} />
    </Typography>
  )
}

export function BidiChipLabel({ children }: { children?: ReactNode }) {
  if (children == null || children === '') return null
  return (
    <Box component="span" dir="auto" sx={{ unicodeBidi: 'isolate', display: 'inline' }}>
      <MixedCopy text={children} />
    </Box>
  )
}
