import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  FOCUS_RING_DARK,
  FOCUS_RING_LIGHT,
  FOCUS_RING_OFFSET_PX,
  FOCUS_RING_WIDTH_PX,
  FOCUS_SURFACES,
} from './focusRing.ts'

function channel(hex: string, index: number): number {
  const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [0, 1, 2].map((index) => channel(hex, index))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const lighter = Math.max(luminance(a), luminance(b))
  const darker = Math.min(luminance(a), luminance(b))
  return (lighter + 0.05) / (darker + 0.05)
}

test('focus rings meet WCAG AA non-text contrast on page surfaces', () => {
  assert.ok(FOCUS_RING_WIDTH_PX >= 2)
  assert.ok(FOCUS_RING_OFFSET_PX >= 2)
  for (const surface of FOCUS_SURFACES.light) {
    assert.ok(contrast(FOCUS_RING_LIGHT, surface) >= 3, `${FOCUS_RING_LIGHT} on ${surface}`)
  }
  for (const surface of FOCUS_SURFACES.dark) {
    assert.ok(contrast(FOCUS_RING_DARK, surface) >= 3, `${FOCUS_RING_DARK} on ${surface}`)
  }
})

test('stylesheet uses the same focus ring colors', () => {
  const css = readFileSync(new URL('../App.scss', import.meta.url), 'utf8')
  assert.match(css, new RegExp(FOCUS_RING_LIGHT, 'i'))
  assert.match(css, new RegExp(FOCUS_RING_DARK, 'i'))
  assert.match(css, /:focus-visible/)
})
