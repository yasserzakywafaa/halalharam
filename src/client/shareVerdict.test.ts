import assert from 'node:assert/strict'
import test from 'node:test'
import { buildVerdictShare, verdictShareUrl } from './shareVerdict.ts'

test('share url carries the lookup query', () => {
  const url = verdictShareUrl('vanilla extract', 'https://halal-or-haram.vercel.app')
  const parsed = new URL(url)
  assert.equal(parsed.origin, 'https://halal-or-haram.vercel.app')
  assert.equal(parsed.pathname, '/')
  assert.equal(parsed.searchParams.get('q'), 'vanilla extract')
  assert.equal(parsed.hash, '#verdict')
})

test('share text includes the query, verdict, and summary', () => {
  const share = buildVerdictShare({
    query: 'gelatin',
    title: 'Gelatin',
    verdictLabel: 'Unclear',
    summary: 'Schools differ on animal-derived gelatin.',
    accordingTo: 'According to named fatwa bodies.',
    notFatwa: 'Not a fatwa.',
    origin: 'https://example.test',
  })

  assert.equal(share.title, 'Gelatin (Unclear)')
  assert.match(share.text, /Gelatin \(Unclear\)/)
  assert.match(share.text, /Schools differ on animal-derived gelatin/)
  assert.match(share.text, /According to named fatwa bodies/)
  assert.match(share.text, /Not a fatwa/)
  assert.equal(new URL(share.url).searchParams.get('q'), 'gelatin')
  assert.match(share.clipboard, /Schools differ on animal-derived gelatin/)
  assert.ok(share.clipboard.includes(share.url))
})

test('share url encodes characters that appear in a query', () => {
  const parsed = new URL(verdictShareUrl('riba & interest', 'https://example.test'))
  assert.equal(parsed.searchParams.get('q'), 'riba & interest')
})
