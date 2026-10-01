import assert from 'node:assert/strict'
import test from 'node:test'
import { segmentMixedBidi } from './bidi.js'

test('keeps trailing fatwa period inside an LTR isolate', () => {
  const parts = segmentMixedBidi('الإسلام سؤال وجواب، الفتوى 10528.')
  const lastLtr = [...parts].reverse().find((part) => part.dir === 'ltr')
  assert.ok(lastLtr)
  assert.equal(lastLtr.text, '10528.')
})

test('isolates verse refs without swallowing Arabic commas', () => {
  const parts = segmentMixedBidi('القرآن الكريم (2:173، 5:3)')
  const texts = parts.filter((part) => part.dir === 'ltr').map((part) => part.text)
  assert.deepEqual(texts, ['2:173', '5:3'])
})

test('English sentences stay a single LTR run including the period', () => {
  const parts = segmentMixedBidi('IslamQA fatwa 1814.')
  assert.equal(parts.length, 1)
  assert.equal(parts[0].dir, 'ltr')
  assert.equal(parts[0].text, 'IslamQA fatwa 1814.')
})
