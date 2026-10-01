import assert from 'node:assert/strict'
import test from 'node:test'
import seedI18nJson from '../data/seed-rulings.i18n.json' with { type: 'json' }
import {
  completionMatchesLocale,
  hasArabicScript,
  localeCopy,
  localeFromAcceptLanguage,
  resolveLocale,
} from './locale.ts'
import { localizeSeedItem } from './localize.ts'
import { matchSeed, normalizeQuery } from './match-seed.ts'
import { buildSystemPrompt, normalizeModelResult } from './openrouter.ts'
import { getVerdict } from './verdict.ts'
import { expectVerdict, must, seedFile } from './test-helpers.ts'

const seedI18n = seedI18nJson as unknown as {
  items?: Record<string, { ar?: { title?: string; summary?: string; accordingTo?: string } }>
}

test('resolves locale tags and Accept-Language', () => {
  assert.equal(resolveLocale('ar'), 'ar')
  assert.equal(resolveLocale('AR-SA'), 'ar')
  assert.equal(resolveLocale('de-DE'), 'de')
  assert.equal(resolveLocale('xx'), 'en')
  assert.equal(localeFromAcceptLanguage('ar-SA,en;q=0.8'), 'ar')
  assert.equal(localeFromAcceptLanguage('fr-FR,en;q=0.4'), 'fr')
})

test('keeps Arabic letters when normalizing queries', () => {
  assert.equal(normalizeQuery('  بيرة!! '), 'بيرة')
  assert.equal(normalizeQuery('Pork!!'), 'pork')
})

test('Arabic aliases hit the same seed items', () => {
  assert.equal(matchSeed('خنزير')?.seedId, 'pork')
  assert.equal(matchSeed('بيرة')?.seedId, 'alcohol')
  assert.equal(matchSeed('جيلاتين')?.seedId, 'gelatin')
})

test('Arabic locale localizes alcohol/beer seed payload', () => {
  const result = must(matchSeed('beer', 'ar'))
  assert.equal(result?.seedId, 'alcohol')
  assert.equal(result.locale, 'ar')
  assert.equal(result.verdict, 'haram')
  assert.ok(hasArabicScript(result.title), result.title)
  assert.ok(hasArabicScript(result.summary), result.summary)
  assert.ok(hasArabicScript(result.accordingTo), result.accordingTo)
  assert.doesNotMatch(result.accordingTo, /^\./)
  assert.doesNotMatch(result.summary, /^\./)
  assert.ok(result.sources.every((source) => hasArabicScript(source.authority) && hasArabicScript(source.name)))
  assert.ok(result.sources.every((source) => String(source.url).startsWith('http')))
})

test('English locale still returns English alcohol seed copy', () => {
  const result = must(matchSeed('beer'))
  assert.equal(result?.title, 'Alcohol and intoxicants (khamr)')
  assert.match(result.summary, /intoxicants/i)
  assert.match(result.accordingTo, /IslamQA fatwa 1814/i)
})

test('Arabic locale localizes pork seed payload', () => {
  const result = must(matchSeed('pork', 'ar'))
  assert.equal(result.seedId, 'pork')
  assert.ok(hasArabicScript(result.title))
  assert.ok(hasArabicScript(result.summary))
  assert.ok(result.sources[0]?.url.startsWith('http'))
})

test('conflict seed positions are Arabic when locale is ar', () => {
  const result = must(matchSeed('gelatin', 'ar'))
  assert.equal(result.conflict, true)
  assert.ok(result.positions.length >= 2)
  for (const position of result.positions) {
    assert.ok(hasArabicScript(position.title), position.title)
    assert.ok(hasArabicScript(position.summary), position.summary)
    assert.ok(hasArabicScript(position.accordingTo), position.accordingTo)
  }
})

test('every seed item has Arabic title, summary, accordingTo, and citation display names', () => {
  for (const item of seedFile.items) {
    const translated = seedI18n.items?.[item.id]?.ar
    assert.ok(translated, `${item.id} missing ar translation`)
    assert.ok(hasArabicScript(translated.title), `${item.id} title`)
    assert.ok(hasArabicScript(translated.summary), `${item.id} summary`)
    assert.ok(hasArabicScript(translated.accordingTo), `${item.id} accordingTo`)

    const localized = localizeSeedItem(item, 'ar')
    const sources = [...(localized.sources || []), ...(localized.positions || []).flatMap((p) => p.sources || [])]
    assert.ok(sources.length, `${item.id} has no sources after localize`)
    for (const source of sources) {
      assert.ok(hasArabicScript(source.authority) || hasArabicScript(source.name), `${item.id} source ${source.url}`)
      assert.match(String(source.url), /^https?:\/\//)
    }
  }
})

test('getVerdict Arabic beer is seed-localized', async () => {
  const result = expectVerdict(await getVerdict('beer', { locale: 'ar' }))
  assert.equal(result.seedId, 'alcohol')
  assert.equal(result.locale, 'ar')
  assert.ok(hasArabicScript(result.title))
  assert.ok(hasArabicScript(result.disclaimer))
  assert.equal(result.lowConfidence, false)
})

test('getVerdict German still returns English seed copy and German disclaimer', async () => {
  const result = expectVerdict(await getVerdict('beer', { locale: 'de' }))
  assert.equal(result.title, 'Alcohol and intoxicants (khamr)')
  assert.match(result.disclaimer, /Fatwa/)
})

test('OpenRouter prompt names the active language', () => {
  assert.match(buildSystemPrompt('ar'), /Arabic/)
  assert.match(buildSystemPrompt('ar'), /locale: ar/)
  assert.match(buildSystemPrompt('de'), /German/)
  assert.match(buildSystemPrompt('en'), /English/)
})

test('completionMatchesLocale requires Arabic script for ar', () => {
  assert.equal(completionMatchesLocale({ title: 'Beer', summary: 'Haram' }, 'ar'), false)
  assert.equal(completionMatchesLocale({ title: 'الكحول', summary: 'الخمر محرّمة' }, 'ar'), true)
  assert.equal(completionMatchesLocale({ title: 'Beer', summary: 'Haram' }, 'en'), true)
})

test('OpenRouter normalizer fallback copy follows locale', () => {
  const result = normalizeModelResult(
    'widget',
    {
      verdict: 'halal',
      confidence: 0.9,
      title: 'أداة',
      summary: 'نص عربي كافٍ للملخص',
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
    'ar',
  )
  assert.equal(result.locale, 'ar')
  assert.equal(result.verdict, 'unclear')
  assert.ok(hasArabicScript(result.caveats.at(-1)))
})

test('Arabic copy strings exist', () => {
  assert.ok(hasArabicScript(localeCopy('ar').accordingToFallback))
  assert.ok(hasArabicScript(localeCopy('ar').appDisclaimer))
  assert.ok(hasArabicScript(localeCopy('ar').aiBusy))
})

test('locale copy has no em dashes', () => {
  for (const locale of ['en', 'ar', 'de', 'fr']) {
    const copy = localeCopy(locale)
    assert.doesNotMatch(JSON.stringify(copy), /—/, locale)
    assert.equal(typeof copy.aiBusy, 'string')
    assert.ok(copy.aiBusy.length > 20, locale)
  }
})
