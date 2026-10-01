import { createTheme, useTheme } from '@mui/material/styles'
import type { Direction } from '../../lib/types.ts'
import type { ColorMode } from './preferences.ts'
import { FOCUS_RING_DARK, FOCUS_RING_LIGHT, FOCUS_RING_OFFSET_PX, FOCUS_RING_WIDTH_PX } from './focusRing.ts'

export interface VerdictTone {
  main: string
  surface: string
  ink: string
}

export type VerdictColors = Record<'halal' | 'haram' | 'unclear', VerdictTone>

const lightVerdict: VerdictColors = {
  halal: { main: '#1B6B45', surface: '#E7F3EC', ink: '#0F3D28' },
  haram: { main: '#9E2B22', surface: '#F7E8E6', ink: '#5C1612' },
  unclear: { main: '#8A5110', surface: '#F6EEDC', ink: '#5C3408' },
}

const darkVerdict: VerdictColors = {
  halal: { main: '#7DD1A3', surface: '#163326', ink: '#D8F3E4' },
  haram: { main: '#E39288', surface: '#3A1C1A', ink: '#F8D4D0' },
  unclear: { main: '#E2B66A', surface: '#33280F', ink: '#F6E6C8' },
}

export function getVerdictColors(mode: ColorMode = 'light'): VerdictColors {
  return mode === 'dark' ? darkVerdict : lightVerdict
}

export function useVerdictColors(): VerdictColors {
  const theme = useTheme()
  return getVerdictColors(theme.palette.mode)
}

export const verdictColors = lightVerdict

const latinSans = '"Source Sans 3", "Segoe UI", sans-serif'
const arabicSans = '"Noto Naskh Arabic", "Source Sans 3", "Segoe UI", sans-serif'
const latinSerif = 'Fraunces, Georgia, serif'
const arabicSerif = '"Noto Naskh Arabic", Fraunces, Georgia, serif'

export function createAppTheme(mode: ColorMode = 'light', direction: Direction = 'ltr') {
  const isDark = mode === 'dark'
  const isRtl = direction === 'rtl'
  const sans = isRtl ? arabicSans : latinSans
  const serif = isRtl ? arabicSerif : latinSerif

  return createTheme({
    direction,
    palette: {
      mode,
      primary: isDark
        ? { main: '#8FCBB0', contrastText: '#0E1A16' }
        : { main: '#1C4A3E', contrastText: '#F7F1E4' },
      secondary: { main: isDark ? '#D4B56A' : '#6B5220', contrastText: isDark ? '#14241E' : '#FFF9F0' },
      background: isDark
        ? { default: '#121A17', paper: '#1C2622' }
        : { default: '#F3EBDA', paper: '#FFF9F0' },
      text: isDark
        ? { primary: '#F3EDE1', secondary: '#A8B5AE' }
        : { primary: '#14241E', secondary: '#5A6A62' },
      divider: isDark ? 'rgba(243, 237, 225, 0.16)' : 'rgba(20, 36, 30, 0.14)',
      error: { main: isDark ? '#E39288' : '#9E2B22' },
      action: {
        hover: isDark ? 'rgba(143, 203, 176, 0.08)' : 'rgba(28, 74, 62, 0.05)',
        selected: isDark ? 'rgba(143, 203, 176, 0.16)' : 'rgba(28, 74, 62, 0.08)',
        disabled: isDark ? 'rgba(243, 237, 225, 0.38)' : 'rgba(20, 44, 38, 0.38)',
        disabledBackground: isDark ? 'rgba(143, 203, 176, 0.16)' : 'rgba(28, 74, 62, 0.18)',
      },
    },
    typography: {
      fontFamily: sans,
      h1: {
        fontFamily: serif,
        fontWeight: 650,
        letterSpacing: isRtl ? '0' : '-0.04em',
        lineHeight: 1.05,
      },
      h2: {
        fontFamily: serif,
        fontWeight: 650,
        letterSpacing: isRtl ? '0' : '-0.03em',
        lineHeight: 1.15,
      },
      h3: {
        fontFamily: serif,
        fontWeight: 600,
        letterSpacing: isRtl ? '0' : '-0.02em',
      },
      overline: {
        letterSpacing: '0.18em',
        fontWeight: 700,
        fontSize: 11,
      },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `${FOCUS_RING_WIDTH_PX}px solid ${isDark ? FOCUS_RING_DARK : FOCUS_RING_LIGHT}`,
              outlineOffset: FOCUS_RING_OFFSET_PX,
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            '&:focus-visible': {
              outline: `${FOCUS_RING_WIDTH_PX}px solid ${isDark ? FOCUS_RING_DARK : FOCUS_RING_LIGHT}`,
              outlineOffset: FOCUS_RING_OFFSET_PX,
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#121A17' : '#F3EBDA',
            transition: 'background-color 180ms ease, color 180ms ease',
          },
          '::selection': {
            backgroundColor: isDark ? 'rgba(212, 181, 106, 0.38)' : 'rgba(196, 163, 90, 0.35)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 18, minHeight: 44 },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
            '&.Mui-disabled': {
              color: isDark ? '#0E1A16' : '#F7F1E4',
              backgroundColor: isDark ? '#6EAF92' : '#3D6356',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            minWidth: 240,
            border: '1px solid',
            borderColor: isDark ? 'rgba(243, 237, 225, 0.16)' : 'rgba(20, 36, 30, 0.14)',
            boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 12px 32px rgba(20, 44, 38, 0.12)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            minHeight: 44,
            gap: 12,
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          enterDelay: 180,
          enterNextDelay: 80,
          enterTouchDelay: 0,
          leaveDelay: 0,
        },
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1C2622' : '#FFF9F0',
            color: isDark ? '#F3EDE1' : '#14241E',
            border: '1px solid',
            borderColor: isDark ? 'rgba(243, 237, 225, 0.16)' : 'rgba(20, 36, 30, 0.14)',
            boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.38)' : '0 8px 20px rgba(20, 44, 38, 0.10)',
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.45,
            padding: '8px 10px',
            maxWidth: 260,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: 26,
            fontWeight: 600,
            letterSpacing: '0.01em',
          },
          outlined: {
            borderColor: isDark ? 'rgba(243, 237, 225, 0.28)' : 'rgba(20, 36, 30, 0.22)',
            backgroundColor: isDark ? 'rgba(243, 237, 225, 0.04)' : 'rgba(20, 44, 38, 0.03)',
          },
          sizeSmall: {
            height: 24,
            fontSize: 12,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
    },
  })
}
