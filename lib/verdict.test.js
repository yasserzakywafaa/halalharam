import assert from 'node:assert/strict'
import test from 'node:test'
import { getVerdict } from './verdict.js'

async function withoutOpenRouterKey(run) {
  const previous = process.env.OPENROUTER_API_KEY
  delete process.env.OPENROUTER_API_KEY
  try {
    return await run()
  } finally {
    if (previous == null) delete process.env.OPENROUTER_API_KEY
    else process.env.OPENROUTER_API_KEY = previous
  }
}

test('a miss without an OpenRouter key is not a cited ruling', async () => {
  await withoutOpenRouterKey(async () => {
    const result = await getVerdict('zaatar-widget-unknown')
    assert.equal(result.sourcePath, 'unavailable')
    assert.equal(result.unavailableReason, 'no_api_key')
    assert.equal(result.conflict, false)
    assert.deepEqual(result.sources, [])
    assert.equal(result.verdict, 'unclear')
  })
})

test('seed hits still resolve when the OpenRouter key is absent', async () => {
  await withoutOpenRouterKey(async () => {
    const result = await getVerdict('pork')
    assert.equal(result.sourcePath, 'seed')
    assert.equal(result.verdict, 'haram')
    assert.equal(result.unavailableReason, null)
    assert.ok(result.sources.length >= 1)
  })
})
