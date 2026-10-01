import assert from 'node:assert/strict'
import test from 'node:test'
import seedFile from '../data/seed-rulings.json' with { type: 'json' }
import { collectSources, isNamedAuthority, sourceHasNamedAuthority } from './authorities.js'
import { matchSeed } from './match-seed.js'
import { namedSourceCount } from './positions.js'
import { normalizeModelResult } from './openrouter.js'
import { localizeSeedItem } from './localize.js'

test('every seed item has at least one named scholar, body, or primary text', () => {
  for (const item of seedFile.items) {
    const sources = collectSources(item)
    assert.ok(sources.length >= 1, `${item.id} has no sources`)
    assert.ok(
      sources.every(sourceHasNamedAuthority),
      `${item.id} has an unnamed source: ${sources.map((s) => s.authority).join(' | ')}`,
    )
    assert.ok(namedSourceCount(item) >= 1, `${item.id} failed namedSourceCount`)
  }
})

test('Arabic-localized seed sources remain named authorities', () => {
  for (const item of seedFile.items) {
    const localized = localizeSeedItem(item, 'ar')
    const sources = collectSources(localized)
    assert.ok(
      sources.every(sourceHasNamedAuthority),
      `${item.id} lost a named authority in AR: ${sources.map((s) => s.authority).join(' | ')}`,
    )
  }
})

test('every seed source is a real https link', () => {
  for (const item of seedFile.items) {
    for (const source of collectSources(item)) {
      assert.match(source.url || '', /^https:\/\/\S+$/, `${item.id} source is missing a real url`)
      assert.doesNotMatch(source.url, /example\.com|placeholder|localhost/i, item.id)
    }
  }
})

test('known desk URLs count even when the authority text is vague', () => {
  assert.equal(isNamedAuthority('Muwatta Malik'), true)
  assert.equal(isNamedAuthority('Permanent Committee'), true)
  assert.equal(isNamedAuthority('Widely accepted'), false)
  assert.equal(
    sourceHasNamedAuthority({
      authority: 'Widely accepted',
      name: 'Common view',
      url: 'https://islamqa.info/en/answers/219137',
    }),
    true,
  )
  assert.equal(
    sourceHasNamedAuthority({
      authority: 'Widely accepted',
      name: 'Common view',
      url: 'https://example.com/fatwa',
    }),
    false,
  )
})

test('Arabic Qur\'an and IslamQA display names count as named authorities', () => {
  assert.equal(isNamedAuthority('القرآن الكريم'), true)
  assert.equal(isNamedAuthority('الإسلام سؤال وجواب'), true)
  assert.equal(isNamedAuthority('صحيح البخاري'), true)
  assert.equal(isNamedAuthority('دار الإفتاء المصرية'), true)
  assert.equal(isNamedAuthority('Darul Ifta, Darul Uloom Deoband'), true)
})

test('no seed authority is only "widely accepted"', () => {
  assert.equal(isNamedAuthority('Widely accepted'), false)
  assert.equal(isNamedAuthority('most scholars'), false)
  assert.equal(isNamedAuthority('IslamQA / Shaykh Muhammad Salih al-Munajjid'), true)
  assert.equal(isNamedAuthority('The Qur\'an'), true)
  for (const item of seedFile.items) {
    for (const source of collectSources(item)) {
      assert.doesNotMatch(String(source.authority), /^(widely accepted|most scholars)$/i)
    }
  }
})

test('conflict seed entries expose both sides and do not pick a winner', () => {
  const gelatin = matchSeed('gelatin')
  assert.equal(gelatin.verdict, 'unclear')
  assert.equal(gelatin.conflict, true)
  assert.ok(gelatin.positions.length >= 2)
  const stances = new Set(gelatin.positions.map((p) => p.stance))
  assert.ok(stances.has('halal'))
  assert.ok(stances.has('haram'))
  assert.ok(gelatin.positions.every((p) => p.sources?.length && p.accordingTo))

  const music = matchSeed('music')
  assert.equal(music.verdict, 'unclear')
  assert.equal(music.conflict, true)
  assert.ok(music.positions.length >= 2)
})

test('non-conflict pork stays haram with named citations', () => {
  const pork = matchSeed('pork')
  assert.equal(pork.conflict, false)
  assert.equal(pork.verdict, 'haram')
  assert.ok(pork.sources.some((s) => /islamqa/i.test(s.authority)))
})

test('OpenRouter normalizer forces unclear + both sides when named sources conflict', () => {
  const result = normalizeModelResult(
    'gelatin',
    {
      verdict: 'halal',
      confidence: 0.9,
      title: 'Gelatin',
      summary: 'Picked a winner incorrectly',
      accordingTo: 'widely accepted',
      sources: [
        {
          authority: 'IslamQA',
          name: 'fatwa',
          stance: 'haram',
          url: 'https://islamqa.info/en/answers/219137',
          excerpt: 'haram origin',
        },
        {
          authority: 'Dar al-Ifta Egypt',
          name: 'fatwa 6891',
          stance: 'halal',
          url: 'https://www.dar-alifta.org/en/fatwa/details/6891/what-is-the-ruling-regarding-eating-products-made-out-of-gelatin',
          excerpt: 'istihala',
        },
      ],
    },
    'test-model',
  )
  assert.equal(result.verdict, 'unclear')
  assert.equal(result.conflict, true)
  assert.ok(result.positions.length >= 2)
})

test('OpenRouter drops widely-accepted-only authorities', () => {
  const result = normalizeModelResult(
    'widget',
    {
      verdict: 'halal',
      confidence: 0.9,
      title: 'Widget',
      summary: 'Fine',
      accordingTo: 'widely accepted',
      sources: [
        {
          authority: 'Widely accepted',
          name: 'Common view',
          stance: 'halal',
          url: 'https://example.com',
          excerpt: 'everyone says so',
        },
      ],
    },
    'test-model',
  )
  assert.equal(result.verdict, 'unclear')
  assert.ok(result.confidence <= 0.35)
})
