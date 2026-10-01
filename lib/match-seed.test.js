import assert from 'node:assert/strict'
import test from 'node:test'
import seedFile from '../data/seed-rulings.json' with { type: 'json' }
import { aliasIsNegated, matchSeed, normalizeQuery, queryNegatesIntoxicant } from './match-seed.js'

test('normalizes punctuation and case', () => {
  assert.equal(normalizeQuery('  Pork!! '), 'pork')
})

test('pork is a seed haram hit without AI', () => {
  const result = matchSeed('pork')
  assert.ok(result)
  assert.equal(result.verdict, 'haram')
  assert.equal(result.sourcePath, 'seed')
  assert.equal(result.seedId, 'pork')
  assert.ok(result.sources.length >= 1)
  assert.ok(result.sources[0].url.startsWith('http'))
})

test('bacon maps to pork seed', () => {
  const result = matchSeed('Is bacon allowed?')
  assert.equal(result?.seedId, 'pork')
  assert.equal(result.verdict, 'haram')
})

test('ham does not match hamburger', () => {
  const result = matchSeed('hamburger')
  assert.notEqual(result?.seedId, 'pork')
  assert.equal(matchSeed('ham')?.seedId, 'pork')
  assert.equal(matchSeed('ham')?.verdict, 'haram')
  assert.notEqual(matchSeed('ham-free')?.seedId, 'pork')
  assert.notEqual(matchSeed('hamburger-free')?.seedId, 'pork')
  assert.equal(aliasIsNegated(normalizeQuery('hamburger'), 'ham'), false)
  assert.equal(aliasIsNegated(normalizeQuery('ham-free'), 'ham'), true)
})

test('gelatin is curated as unclear', () => {
  const result = matchSeed('gelatin')
  assert.equal(result?.seedId, 'gelatin')
  assert.equal(result.verdict, 'unclear')
  assert.ok(result.accordingTo)
  assert.ok(result.sources.some((source) => /islamqa/i.test(source.authority) || /islamqa/i.test(source.url)))
})

test('gelatin conflict shows both named sides', () => {
  const result = matchSeed('gelatin')
  assert.equal(result.conflict, true)
  assert.ok(result.positions.length >= 2)
  assert.ok(result.positions.some((p) => p.stance === 'halal'))
  assert.ok(result.positions.some((p) => p.stance === 'haram'))
})

test('unknown queries miss the seed file', () => {
  assert.equal(matchSeed('xyzzy-not-a-food-item-123'), null)
})

test('beer without alcohol is not the intoxicant haram seed', () => {
  for (const query of ['beer without alcohol', 'beer without Alcohol', 'non-alcoholic beer', 'alcohol-free beer', 'alcohol free beer']) {
    const result = matchSeed(query)
    assert.ok(result, query)
    assert.notEqual(result.seedId, 'alcohol', query)
    assert.notEqual(result.verdict, 'haram', query)
    assert.equal(result.verdict, 'unclear', query)
    assert.equal(result.conflict, true, query)
    assert.ok(['non-alcoholic-beer', 'alcohol-free-beer'].includes(result.seedId), query)
  }
})

test('plain beer and alcohol still hit the intoxicant seed', () => {
  assert.equal(matchSeed('beer')?.seedId, 'alcohol')
  assert.equal(matchSeed('beer')?.verdict, 'haram')
  assert.equal(matchSeed('alcohol')?.seedId, 'alcohol')
  assert.equal(matchSeed('wine')?.seedId, 'alcohol')
})

test('Arabic and 0.0% alcohol-free phrases skip khamr', () => {
  assert.ok(['non-alcoholic-beer', 'alcohol-free-beer'].includes(matchSeed('بيرة بدون كحول')?.seedId))
  assert.ok(['non-alcoholic-beer', 'alcohol-free-beer'].includes(matchSeed('بدون كحول')?.seedId))
  assert.ok(['non-alcoholic-beer', 'alcohol-free-beer'].includes(matchSeed('0.0% beer')?.seedId))
  assert.notEqual(matchSeed('بيرة')?.seedId, 'non-alcoholic-beer')
  assert.equal(matchSeed('بيرة')?.seedId, 'alcohol')
})

test('non-alcoholic beer seed shows both named sides', () => {
  const result = matchSeed('non-alcoholic beer')
  assert.ok(result.positions.length >= 2)
  assert.ok(result.positions.some((p) => p.stance === 'halal'))
  assert.ok(result.positions.some((p) => p.stance === 'haram'))
  assert.ok(result.positions.every((p) => p.sources?.length && p.accordingTo))
})

test('alcohol-free beer does not inherit the intoxicant ruling', () => {
  const beer = matchSeed('beer')
  assert.equal(beer?.seedId, 'alcohol')
  assert.equal(beer.verdict, 'haram')

  for (const query of ['alcohol-free beer', 'non-alcoholic beer', '0.0% beer', 'halal beer']) {
    const result = matchSeed(query)
    assert.ok(result, query)
    assert.notEqual(result.seedId, 'alcohol', query)
    assert.equal(result.conflict, true, query)
    assert.equal(result.verdict, 'unclear', query)
    assert.ok(result.positions.some((position) => position.stance === 'halal'))
    assert.ok(result.positions.some((position) => position.stance === 'haram'))
  }

  assert.equal(matchSeed('gluten-free beer')?.seedId, 'alcohol')
})

test('negated labels do not select the positive seed', () => {
  assert.equal(matchSeed('pork-free sausage'), null)
  assert.equal(matchSeed('gelatin-free marshmallows'), null)
  assert.equal(matchSeed('interest-free loan'), null)
  assert.equal(matchSeed('without interest'), null)
  assert.equal(matchSeed('bacon')?.seedId, 'pork')
})

test('longer finance and personal-care aliases beat the shorter seed', () => {
  assert.equal(matchSeed('cooking wine')?.seedId, 'cooking-wine')
  assert.notEqual(matchSeed('cooking wine')?.seedId, 'alcohol')
  assert.equal(matchSeed('islamic insurance')?.seedId, 'takaful')
  assert.equal(matchSeed('life insurance')?.seedId, 'commercial-insurance')
  assert.equal(matchSeed('henna tattoo')?.seedId, 'henna')
  assert.equal(matchSeed('permanent tattoo')?.seedId, 'tattoos')
  assert.equal(matchSeed('bitcoin')?.conflict, true)
  assert.equal(matchSeed('horse meat')?.conflict, true)
})

test('whole-word matching still rejects aliases buried in a longer word', () => {
  assert.equal(matchSeed('ham')?.seedId, 'pork')
  assert.notEqual(matchSeed('hamburger')?.seedId, 'pork')
  assert.equal(matchSeed('silkworm'), null)
  assert.equal(matchSeed('golden retriever'), null)
  assert.notEqual(matchSeed('perfume with alcohol')?.seedId, 'alcohol')
  assert.equal(matchSeed('perfume with alcohol')?.seedId, 'perfume-alcohol')
})

test('alcohol-free beer and alcohol in medicine stay on their own seeds', () => {
  assert.ok(['non-alcoholic-beer', 'alcohol-free-beer'].includes(matchSeed('non alcoholic beer')?.seedId))
  assert.notEqual(matchSeed('non alcoholic beer')?.seedId, 'alcohol')
  assert.equal(matchSeed('cologne')?.seedId, 'perfume-alcohol')
  assert.equal(matchSeed('alcohol in medicine')?.seedId, 'alcohol-in-medicine')
  assert.equal(matchSeed('alcohol')?.seedId, 'alcohol')
})

test('travel, medicine, and grooming seeds keep named conflicts on both sides', () => {
  const travel = matchSeed('travel without mahram')
  assert.equal(travel?.seedId, 'woman-travel-mahram')
  assert.equal(travel.conflict, true)
  assert.equal(travel.verdict, 'unclear')
  assert.ok(travel.positions.some((position) => position.stance === 'haram'))
  assert.ok(travel.positions.some((position) => position.stance === 'halal'))

  const join = matchSeed('combining prayers')
  assert.equal(join?.seedId, 'combining-prayers')
  assert.equal(join.conflict, true)
  assert.ok(join.sources.every((source) => source.url.startsWith('https://')))

  const niqab = matchSeed('niqab')
  assert.equal(niqab.conflict, true)
  assert.equal(niqab.verdict, 'unclear')

  assert.equal(matchSeed('collagen supplement')?.seedId, 'gelatin')
  assert.equal(matchSeed('qasr')?.verdict, 'halal')
  assert.equal(matchSeed('tattoo')?.verdict, 'haram')
})

test('negated alcohol beer uses the conflict seed, never khamr', () => {
  for (const query of [
    'beer without alcohol',
    'nonalcoholic beer',
    '0.0 beer',
    'beer that has no alcohol',
    'cold beer with no alcohol',
  ]) {
    const result = matchSeed(query)
    assert.ok(result, query)
    assert.ok(['non-alcoholic-beer', 'alcohol-free-beer'].includes(result.seedId), query)
    assert.notEqual(result.seedId, 'alcohol', query)
    assert.equal(result.verdict, 'unclear', query)
    assert.equal(result.conflict, true, query)
  }
})

test('plain intoxicants still hit khamr when another drink is negated', () => {
  assert.equal(matchSeed('beer with alcohol')?.seedId, 'alcohol')
  assert.equal(matchSeed('alcoholic beer')?.seedId, 'alcohol')
  assert.equal(matchSeed('beer-free wine')?.seedId, 'alcohol')
  assert.equal(matchSeed('gin without rum')?.seedId, 'alcohol')
  assert.equal(queryNegatesIntoxicant('beer'), false)
  assert.equal(queryNegatesIntoxicant('non-alcoholic beer'), true)
  assert.equal(queryNegatesIntoxicant('beer without alcohol'), true)
})

test('other negated intoxicant phrasing does not inherit khamr', () => {
  for (const query of ['wine without alcohol', 'non-alcoholic wine', 'alcohol-free', 'without alcohol']) {
    const result = matchSeed(query)
    assert.notEqual(result?.seedId, 'alcohol', query)
    assert.notEqual(result?.verdict, 'haram', query)
  }
})

test('gelatin-free and interest-free do not inherit the positive seeds', () => {
  assert.equal(matchSeed('gelatin')?.seedId, 'gelatin')
  assert.equal(matchSeed('interest')?.seedId, 'riba')
  assert.equal(matchSeed('pork-free gelatin')?.seedId, 'gelatin')
  assert.notEqual(matchSeed('pork-free gelatin')?.seedId, 'pork')
  for (const query of [
    'gelatin-free',
    'gelatin free',
    'without gelatin',
    'gelatin-free gummies',
    'gelatin-free marshmallow',
    'interest-free',
    'without interest',
    'interest-free mortgage',
    'zero interest',
  ]) {
    const result = matchSeed(query)
    assert.notEqual(result?.seedId, 'gelatin', query)
    assert.notEqual(result?.seedId, 'riba', query)
    assert.notEqual(result?.seedId, 'alcohol', query)
  }
})

test('X-free and without-X never inherit that seed for single-token aliases', () => {
  for (const item of seedFile.items) {
    for (const alias of item.aliases) {
      const normalized = normalizeQuery(alias)
      if (!/^[a-z0-9]{3,}$/.test(normalized)) continue
      for (const query of [`${normalized}-free`, `${normalized} free`, `without ${normalized}`, `non-${normalized}`]) {
        const result = matchSeed(query)
        assert.notEqual(result?.seedId, item.id, `${query} inherited ${item.id}`)
      }
    }
  }
})
