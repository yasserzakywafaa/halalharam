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
  halal: { main: '#16704A', surface: '#E5F3EC', ink: '#0B3D27' },
  haram: { main: '#A32A2A', surface: '#F9E7E6', ink: '#5E1313' },
  unclear: { main: '#8C5A0B', surface: '#F7EEDB', ink: '#55360A' },
}

const darkVerdict: VerdictColors = {
  halal: { main: '#74D3A4', surface: '#10302A', ink: '#D5F4E4' },
  haram: { main: '#F0958F', surface: '#3A1A24', ink: '#FAD6D3' },
  unclear: { main: '#E8BE6E', surface: '#322A14', ink: '#F7E7C6' },
}

/**
 * Lapis ink on cool paper. The brand accent is blue on purpose: green, red and amber
 * belong to the verdicts, so the chrome never reads as a ruling.
 */
export const palette = {
  light: {
    bg: '#F1F3F7',
    paper: '#FFFFFF',
    raised: '#F7F8FB',
    ink: '#111729',
    muted: '#545E78',
    line: 'rgba(17, 23, 41, 0.12)',
    lineStrong: 'rgba(17, 23, 41, 0.22)',
    lapis: '#2840A0',
    lapisSoft: '#E6EAF8',
    onLapis: '#FFFFFF',
    gold: '#94702E',
  },
  dark: {
    bg: '#0B0F1D',
    paper: '#131929',
    raised: '#192035',
    ink: '#ECEEF6',
    muted: '#9CA4BD',
    line: 'rgba(236, 238, 246, 0.13)',
    lineStrong: 'rgba(236, 238, 246, 0.26)',
    lapis: '#9DB1FF',
    lapisSoft: '#1D2650',
    onLapis: '#0B0F1D',
    gold: '#DDBE78',
  },
} as const

export type PaletteTokens = (typeof palette)[ColorMode]

export function usePalette(): PaletteTokens {
  return palette[useTheme().palette.mode]
}

/** Readex Pro covers Latin and Arabic in one family, so both scripts share one voice. */
export const FONT_SANS = '"Readex Pro", "Segoe UI", Tahoma, system-ui, sans-serif'
export const FONT_MONO = '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace'

export function getVerdictColors(mode: ColorMode = 'light'): VerdictColors {
  return mode === 'dark' ? darkVerdict : lightVerdict
}

export function useVerdictColors(): VerdictColors {
  const theme = useTheme()
  return getVerdictColors(theme.palette.mode)
}

export const verdictColors = lightVerdict

export function createAppTheme(mode: ColorMode = 'light', direction: Direction = 'ltr') {
  const isDark = mode === 'dark'
  const isRtl = direction === 'rtl'
  const p = palette[mode]
  const ring = isDark ? FOCUS_RING_DARK : FOCUS_RING_LIGHT
  const tight = (em: string) => (isRtl ? '0' : em)

  return createTheme({
    direction,
    palette: {
      mode,
      primary: { main: p.lapis, contrastText: p.onLapis },
      secondary: { main: p.gold, contrastText: isDark ? p.bg : '#FFFFFF' },
      background: { default: p.bg, paper: p.paper },
      text: { primary: p.ink, secondary: p.muted },
      divider: p.line,
      error: { main: isDark ? darkVerdict.haram.main : lightVerdict.haram.main },
      action: {
        hover: isDark ? 'rgba(157, 177, 255, 0.08)' : 'rgba(40, 64, 160, 0.05)',
        selected: isDark ? 'rgba(157, 177, 255, 0.16)' : 'rgba(40, 64, 160, 0.09)',
        disabled: isDark ? 'rgba(236, 238, 246, 0.38)' : 'rgba(17, 23, 41, 0.38)',
        disabledBackground: isDark ? 'rgba(157, 177, 255, 0.16)' : 'rgba(40, 64, 160, 0.16)',
      },
    },
    typography: {
      fontFamily: FONT_SANS,
      h1: { fontWeight: 600, letterSpacing: tight('-0.035em'), lineHeight: 1.08 },
      h2: { fontWeight: 600, letterSpacing: tight('-0.025em'), lineHeight: 1.18 },
      h3: { fontWeight: 600, letterSpacing: tight('-0.015em'), lineHeight: 1.25 },
      overline: { fontFamily: FONT_MONO, letterSpacing: tight('0.08em'), fontWeight: 500, fontSize: 11 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': { outline: `${FOCUS_RING_WIDTH_PX}px solid ${ring}`, outlineOffset: FOCUS_RING_OFFSET_PX },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            '&:focus-visible': { outline: 'none' },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: p.bg, transition: 'background-color 180ms ease, color 180ms ease' },
          '::selection': { backgroundColor: isDark ? 'rgba(157, 177, 255, 0.32)' : 'rgba(40, 64, 160, 0.18)' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 18, minHeight: 44 },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
            '&.Mui-disabled': { color: p.onLapis, backgroundColor: p.lapis, opacity: 0.45 },
          },
          outlined: { borderColor: p.lineStrong, color: p.ink, '&:hover': { borderColor: p.lapis, backgroundColor: 'transparent' } },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiMenu: {
        styleOverrides: {
          paper: {
            minWidth: 240,
            border: `1px solid ${p.line}`,
            boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.45)' : '0 12px 32px rgba(17, 23, 41, 0.12)',
          },
        },
      },
      MuiMenuItem: { styleOverrides: { root: { minHeight: 44, gap: 12 } } },
      MuiTooltip: {
        defaultProps: { enterDelay: 180, enterNextDelay: 80, enterTouchDelay: 0, leaveDelay: 0 },
        styleOverrides: {
          tooltip: {
            backgroundColor: p.paper,
            color: p.ink,
            border: `1px solid ${p.line}`,
            boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.4)' : '0 8px 20px rgba(17, 23, 41, 0.10)',
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
          root: { height: 26, fontWeight: 500, letterSpacing: '0.01em' },
          outlined: { borderColor: p.lineStrong, backgroundColor: 'transparent' },
          sizeSmall: { height: 24, fontSize: 12 },
        },
      },
      MuiDialog: { styleOverrides: { paper: { backgroundImage: 'none' } } },
      MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
      MuiLinearProgress: { styleOverrides: { root: { backgroundColor: p.lapisSoft }, bar: { backgroundColor: p.lapis } } },
    },
  })
}
