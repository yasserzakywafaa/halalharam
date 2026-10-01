import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SHOW_AD_SLOTS } from './ads.js'

test('sponsored slots stay off and the disclosure markup is still in AdSlot', () => {
  assert.equal(SHOW_AD_SLOTS, false)
  const source = readFileSync(new URL('./components/AdSlot.jsx', import.meta.url), 'utf8')
  assert.match(source, /if \(!SHOW_AD_SLOTS\) return null/)
  assert.match(source, /ad\.sponsored/)
  assert.match(source, /ad\.disclosure/)
  assert.match(source, /data-print-hide/)
})
