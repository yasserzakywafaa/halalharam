import assert from 'node:assert/strict'
import test from 'node:test'
import { knownVerdict } from '../../utils/verdictGloss.ts'

test('unknown verdicts fall back to unclear', () => {
  assert.equal(knownVerdict('halal'), 'halal')
  assert.equal(knownVerdict('haram'), 'haram')
  assert.equal(knownVerdict('unclear'), 'unclear')
  assert.equal(knownVerdict('maybe'), 'unclear')
})
