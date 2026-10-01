import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createVerdictClient, isVerdictNetworkFailure } from './api.js'

function client(lookup, health = async () => null) {
  return createVerdictClient({ lookup, health })
}

describe('verdict server-action client classification', { concurrency: false }, () => {
  test('TypeError from the server action is a network failure', async () => {
    const { fetchVerdict } = client(async () => {
      throw new TypeError('Failed to fetch')
    })
    await assert.rejects(() => fetchVerdict('pork'), (error) => {
      assert.equal(error.code, 'NETWORK')
      assert.equal(isVerdictNetworkFailure(error), true)
      return true
    })
  })

  test('abort and rate limit are not network failures', async () => {
    const abort = new Error('The operation was aborted')
    abort.name = 'AbortError'
    assert.equal(isVerdictNetworkFailure(abort), false)

    await assert.rejects(
      () =>
        client(async () => {
          throw abort
        }).fetchVerdict('pork'),
      (error) => error.name === 'AbortError',
    )

    const controller = new AbortController()
    const pending = client(async () => {
      controller.abort()
      return { verdict: 'haram' }
    }).fetchVerdict('pork', 'en', { signal: controller.signal })
    await assert.rejects(() => pending, (error) => error.name === 'AbortError')

    await assert.rejects(
      () => client(async () => ({ error: 'Too many requests', code: 'rate_limited', status: 429 })).fetchVerdict('pork'),
      (error) => {
        assert.equal(error.status, 429)
        assert.equal(error.code, 'RATE_LIMIT')
        assert.equal(isVerdictNetworkFailure(error), false)
        return true
      },
    )
  })

  test('a no-key verdict is a normal response, not a network failure', async () => {
    const body = {
      sourcePath: 'unavailable',
      summary: 'OPENROUTER_API_KEY is not configured, so an AI lookup could not run.',
      verdict: 'unclear',
    }
    const result = await client(async () => body).fetchVerdict('soy sauce')
    assert.equal(result.sourcePath, 'unavailable')
    assert.equal(isVerdictNetworkFailure(result), false)
  })

  test('validation errors stay inline and are not classified as offline', async () => {
    await assert.rejects(
      () => client(async () => ({ error: 'Type at least two characters.', status: 400 })).fetchVerdict('p'),
      (error) => {
        assert.equal(error.message, 'Type at least two characters.')
        assert.equal(error.status, 400)
        assert.equal(isVerdictNetworkFailure(error), false)
        return true
      },
    )
  })

  test('health failures fall back to an empty library', async () => {
    const { fetchLibrary } = client(
      async () => ({}),
      async () => {
        throw new Error('boom')
      },
    )
    assert.deepEqual(await fetchLibrary('en'), [])
  })
})
