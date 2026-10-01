import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { buildHealthPayload, handleHealthRequest } from './health.js'
import {
  chatCompletionBody,
  HANDLER_SLACK_MS,
  lookupWithOpenRouter,
  MAX_OUTPUT_TOKENS,
  normalizeModelResult,
  openRouterPublicStatus,
  reasoningPreference,
  REQUEST_BUDGET_MS,
} from './openrouter.js'
import { getVerdict } from './verdict.js'

const SECRET = 'sk-or-v1-super-secret-value'
const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'

function oliveOilCompletion() {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            verdict: 'halal',
            confidence: 0.84,
            title: 'Olive oil',
            summary: "A lawful food named in the Qur'an.",
            accordingTo: "The Qur'an 16:11",
            sources: [
              {
                authority: "The Qur'an",
                name: 'Surah al-Nahl 16:11',
                stance: 'halal',
                url: 'https://quran.com/16/11',
                excerpt: 'olives',
              },
            ],
          }),
        },
      },
    ],
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function hungAbortableFetch(_url, init) {
  return new Promise((_resolve, reject) => {
    const fail = () => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      reject(error)
    }
    if (init?.signal?.aborted) fail()
    else init?.signal?.addEventListener('abort', fail, { once: true })
  })
}

function withEnv(values, fn) {
  const previous = new Map()
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key])
    if (value == null) delete process.env[key]
    else process.env[key] = value
  }
  const restore = () => {
    for (const [key, value] of previous) {
      if (value == null) delete process.env[key]
      else process.env[key] = value
    }
  }
  const result = fn()
  if (result && typeof result.then === 'function') {
    return result.finally(restore)
  }
  restore()
  return result
}

test('seed lookup is the fast path and does not call OpenRouter', async () => {
  let called = false
  const original = globalThis.fetch
  globalThis.fetch = async () => {
    called = true
    throw new Error('OpenRouter must not run for a seed hit')
  }
  try {
    const result = await getVerdict('pork')
    assert.equal(result.sourcePath, 'seed')
    assert.equal(result.seedId, 'pork')
    assert.equal(result.verdict, 'haram')
    assert.equal(called, false)
  } finally {
    globalThis.fetch = original
  }
})

test('health status reports key presence and hides the secret', () => {
  withEnv({ OPENROUTER_API_KEY: SECRET, OPENROUTER_MODEL: 'openai/gpt-4o-mini' }, () => {
    const status = openRouterPublicStatus()
    assert.equal(status.openRouterKeyPresent, true)
    assert.equal(status.openRouterConfigured, true)
    assert.equal(status.model, 'openai/gpt-4o-mini')
    assert.equal('apiKey' in status, false)
    assert.equal(JSON.stringify(status).includes(SECRET), false)

    const payload = buildHealthPayload('en')
    const encoded = JSON.stringify(payload)
    assert.equal(payload.openRouterKeyPresent, true)
    assert.equal(encoded.includes(SECRET), false)
    assert.equal(encoded.includes('apiKey'), false)
    assert.ok(Array.isArray(payload.library))
  })

  withEnv({ OPENROUTER_API_KEY: '   ', OPENROUTER_MODEL: '  ' }, () => {
    const status = openRouterPublicStatus()
    assert.equal(status.openRouterKeyPresent, false)
    assert.equal(status.model, 'nvidia/nemotron-3-ultra-550b-a55b:free')
  })
})

test('health never returns the OpenRouter key', async () => {
  await withEnv({ OPENROUTER_API_KEY: 'sk-or-health-secret' }, async () => {
    const response = handleHealthRequest(new Request('http://localhost/api/health'))
    const body = await response.text()
    const json = JSON.parse(body)
    assert.equal(json.openRouterConfigured, true)
    assert.equal(json.apiKey, undefined)
    assert.equal(body.includes('sk-or-health-secret'), false)
    assert.equal(typeof json.model, 'string')
  })
})

test('missing key soft-fails without leaking configuration', async () => {
  await withEnv({ OPENROUTER_API_KEY: '' }, async () => {
    const result = await getVerdict('xyzzy-not-a-food-item-123')
    assert.equal(result.sourcePath, 'unavailable')
    assert.equal(result.unavailableReason, 'no_api_key')
    assert.equal(result.verdict, 'unclear')
    assert.equal(result.sources.length, 0)
    assert.equal(result.conflict, false)
    assert.doesNotMatch(JSON.stringify(result), /OPENROUTER_API_KEY/)
    assert.match(result.summary, /gap in coverage/i)
  })
})

test('OpenRouter client is plain fetch to the chat completions URL', async () => {
  const original = globalThis.fetch
  let seen
  globalThis.fetch = async (url, init) => {
    seen = { url: String(url), init }
    return jsonResponse(oliveOilCompletion())
  }
  try {
    await withEnv({ OPENROUTER_API_KEY: 'sk-or-test-not-a-real-key' }, async () => {
      const result = await lookupWithOpenRouter('olive oil', { locale: 'en' })
      assert.equal(seen.url, CHAT_URL)
      assert.equal(seen.init.method, 'POST')
      assert.equal(seen.init.headers.Authorization, 'Bearer sk-or-test-not-a-real-key')
      assert.equal(seen.init.headers['Content-Type'], 'application/json')
      const body = JSON.parse(seen.init.body)
      assert.equal(typeof body.model, 'string')
      assert.ok(Array.isArray(body.messages))
      assert.equal(body.max_tokens, MAX_OUTPUT_TOKENS)
      assert.deepEqual(body.reasoning, reasoningPreference())
      assert.equal(body.response_format.type, 'json_object')
      assert.equal(result.sourcePath, 'ai')
      assert.equal(result.verdict, 'halal')
      assert.equal(result.sources[0].authority, "The Qur'an")
      assert.equal(result.sources[0].url, 'https://quran.com/16/11')
    })
  } finally {
    globalThis.fetch = original
  }
})

test('lookup posts to chat completions and hides upstream bodies', async () => {
  const original = globalThis.fetch
  await withEnv({ OPENROUTER_API_KEY: SECRET, OPENROUTER_MODEL: '' }, async () => {
    let called = ''
    globalThis.fetch = async (url, init) => {
      called = String(url)
      assert.equal(init.headers.Authorization, `Bearer ${SECRET}`)
      assert.equal(JSON.parse(init.body).model, 'nvidia/nemotron-3-ultra-550b-a55b:free')
      return {
        ok: false,
        status: 401,
        text: async () => `leaked ${SECRET} upstream-body`,
        json: async () => ({}),
      }
    }
    await assert.rejects(lookupWithOpenRouter('xyzzy-not-a-food-item-123'), (error) => {
      assert.equal(error.code, 'OPENROUTER_HTTP')
      assert.equal(error.status, 401)
      assert.doesNotMatch(error.message, /upstream-body/)
      assert.doesNotMatch(error.message, /super-secret/)
      return true
    })
    assert.equal(called, 'https://openrouter.ai/api/v1/chat/completions')

    const result = await getVerdict('xyzzy-not-a-food-item-123')
    assert.equal(result.unavailableReason, 'ai_error')
    assert.equal(result.verdict, 'unclear')
    assert.doesNotMatch(JSON.stringify(result), /super-secret/)
    assert.doesNotMatch(JSON.stringify(result), /upstream-body/)
  }).finally(() => {
    globalThis.fetch = original
  })
})

test('a hung OpenRouter call times out inside the request budget', async () => {
  const original = globalThis.fetch
  await withEnv({ OPENROUTER_API_KEY: SECRET }, async () => {
    globalThis.fetch = hungAbortableFetch
    await assert.rejects(lookupWithOpenRouter('xyzzy-not-a-food-item-123', { timeoutMs: 30 }), (error) => {
      assert.equal(error.code, 'OPENROUTER_TIMEOUT')
      return true
    })

    const result = await getVerdict('xyzzy-not-a-food-item-123', { timeoutMs: 30 })
    assert.equal(result.status, undefined)
    assert.equal(result.sourcePath, 'unavailable')
    assert.equal(result.unavailableReason, 'ai_error')
    assert.equal(result.verdict, 'unclear')
  }).finally(() => {
    globalThis.fetch = original
  })
})

test('a hung fetch that ignores abort still returns before the function budget', async () => {
  const original = globalThis.fetch
  await withEnv({ OPENROUTER_API_KEY: SECRET }, async () => {
    globalThis.fetch = () => new Promise(() => {})
    const started = Date.now()
    await assert.rejects(lookupWithOpenRouter('xyzzy-not-a-food-item-123', { timeoutMs: 40 }), (error) => {
      assert.equal(error.code, 'OPENROUTER_TIMEOUT')
      return true
    })
    assert.ok(Date.now() - started < 1000)

    const result = await getVerdict('xyzzy-not-a-food-item-123', { timeoutMs: 40 })
    assert.equal(result.sourcePath, 'unavailable')
    assert.equal(result.unavailableReason, 'ai_error')
    assert.ok(Date.now() - started < 2000)
  }).finally(() => {
    globalThis.fetch = original
  })
})

test('OpenRouter fetch budget stays below the verdict function maxDuration', () => {
  // Route Handler (`/api/verdict`) and the root layout (server action `lookupVerdict`) both declare it.
  const maxDurationOf = (path) => {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
    return Number(source.match(/export const maxDuration = (\d+)/)?.[1])
  }
  assert.equal(maxDurationOf('src/app/api/verdict/route.ts'), 60)
  assert.equal(maxDurationOf('src/app/layout.tsx'), 60)
  const functionMs = 60 * 1000
  assert.equal(REQUEST_BUDGET_MS, 55_000)
  assert.equal(HANDLER_SLACK_MS, 2_000)
  assert.ok(REQUEST_BUDGET_MS < functionMs)
  assert.ok(REQUEST_BUDGET_MS + HANDLER_SLACK_MS < functionMs)
})

test('chat completions cap output tokens and prefer reasoning off or low', () => {
  const body = chatCompletionBody({ model: 'google/gemini-2.5-flash-lite', locale: 'en', query: 'nutmeg' })
  assert.equal(body.max_tokens, 2048)
  assert.equal(body.reasoning.enabled, false)
  assert.equal(body.reasoning.effort, 'low')
  assert.equal(body.reasoning.exclude, true)
  assert.equal(body.response_format.type, 'json_object')
  assert.ok(body.messages.length >= 2)
})

test('OpenRouter 429 fails fast by default without retrying', async () => {
  const original = globalThis.fetch
  let calls = 0
  await withEnv({ OPENROUTER_API_KEY: SECRET }, async () => {
    globalThis.fetch = async () => {
      calls += 1
      return { ok: false, status: 429, text: async () => 'rate', json: async () => ({}) }
    }
    const started = Date.now()
    await assert.rejects(lookupWithOpenRouter('xyzzy-not-a-food-item-123', { timeoutMs: 2000 }), (error) => {
      assert.equal(error.code, 'OPENROUTER_HTTP')
      assert.equal(error.status, 429)
      return true
    })
    assert.equal(calls, 1)
    assert.ok(Date.now() - started < 1000)

    const result = await getVerdict('xyzzy-not-a-food-item-123', { timeoutMs: 2000 })
    assert.equal(calls, 2)
    assert.equal(result.sourcePath, 'unavailable')
    assert.equal(result.unavailableReason, 'ai_rate_limited')
  }).finally(() => {
    globalThis.fetch = original
  })
})

test('OpenRouter 429 is retried then succeeds when retries are enabled', async () => {
  const original = globalThis.fetch
  let calls = 0
  await withEnv({ OPENROUTER_API_KEY: SECRET }, async () => {
    globalThis.fetch = async () => {
      calls += 1
      if (calls === 1) {
        return { ok: false, status: 429, text: async () => 'rate', json: async () => ({}) }
      }
      return jsonResponse(oliveOilCompletion())
    }
    const result = await lookupWithOpenRouter('olive oil', {
      timeoutMs: 2000,
      rateLimitRetries: 1,
      rateLimitBackoffMs: [1, 1],
    })
    assert.equal(calls, 2)
    assert.equal(result.sourcePath, 'ai')
    assert.equal(result.verdict, 'halal')
  }).finally(() => {
    globalThis.fetch = original
  })
})

test('OpenRouter 429 after retries returns a friendly unavailable payload', async () => {
  const original = globalThis.fetch
  let calls = 0
  await withEnv({ OPENROUTER_API_KEY: SECRET }, async () => {
    globalThis.fetch = async () => {
      calls += 1
      return { ok: false, status: 429, text: async () => 'rate', json: async () => ({}) }
    }
    await assert.rejects(
      lookupWithOpenRouter('xyzzy-not-a-food-item-123', {
        timeoutMs: 2000,
        rateLimitRetries: 2,
        rateLimitBackoffMs: [1, 1],
      }),
      (error) => {
        assert.equal(error.code, 'OPENROUTER_HTTP')
        assert.equal(error.status, 429)
        return true
      },
    )
    assert.equal(calls, 3)

    calls = 0
    const result = await getVerdict('xyzzy-not-a-food-item-123', {
      timeoutMs: 2000,
      rateLimitRetries: 1,
      rateLimitBackoffMs: [1],
    })
    assert.equal(calls, 2)
    assert.equal(result.sourcePath, 'unavailable')
    assert.equal(result.unavailableReason, 'ai_rate_limited')
    assert.equal(result.verdict, 'unclear')
    assert.match(result.summary, /busy/i)
    assert.doesNotMatch(JSON.stringify(result), /upstream-body/)
  }).finally(() => {
    globalThis.fetch = original
  })
})

test('OpenRouter 429 does not sleep past the request budget', async () => {
  const original = globalThis.fetch
  let calls = 0
  await withEnv({ OPENROUTER_API_KEY: SECRET }, async () => {
    globalThis.fetch = async () => {
      calls += 1
      return { ok: false, status: 429, text: async () => 'rate', json: async () => ({}) }
    }
    const started = Date.now()
    await assert.rejects(
      lookupWithOpenRouter('xyzzy-not-a-food-item-123', {
        timeoutMs: 40,
        rateLimitRetries: 2,
        rateLimitBackoffMs: [5_000, 5_000],
      }),
      (error) => error.code === 'OPENROUTER_HTTP' && error.status === 429,
    )
    assert.ok(Date.now() - started < 1000)
    assert.equal(calls, 1)
  }).finally(() => {
    globalThis.fetch = original
  })
})

test('a known desk URL is kept when the authority text is vague', () => {
  const result = normalizeModelResult(
    'gelatin',
    {
      verdict: 'haram',
      confidence: 0.8,
      title: 'Gelatin',
      summary: 'From the linked fatwa.',
      accordingTo: 'widely accepted',
      sources: [
        {
          authority: 'Widely accepted',
          name: 'Common view',
          stance: 'haram',
          url: 'https://islamqa.info/en/answers/219137',
          excerpt: 'porcine origin',
        },
      ],
    },
    'test-model',
  )
  assert.equal(result.verdict, 'haram')
  assert.equal(result.conflict, false)
  assert.equal(result.sources[0].authority, 'IslamQA')
  assert.match(result.accordingTo, /IslamQA/)
})

test('a drafted verdict that contradicts its named citation stays unclear', () => {
  const result = normalizeModelResult(
    'gelatin',
    {
      verdict: 'halal',
      confidence: 0.9,
      title: 'Gelatin',
      summary: 'Called it lawful anyway.',
      sources: [
        {
          authority: 'IslamQA',
          name: 'fatwa 219137',
          stance: 'haram',
          url: 'https://islamqa.info/en/answers/219137',
          excerpt: 'porcine origin',
        },
      ],
    },
    'test-model',
  )
  assert.equal(result.verdict, 'unclear')
  assert.equal(result.conflict, false)
  assert.ok(result.caveats.some((caveat) => /named citations/i.test(caveat)))
})

test('a conflict flag without named authorities on both sides is not both-sides', () => {
  const result = normalizeModelResult(
    'widget',
    {
      verdict: 'unclear',
      conflict: true,
      confidence: 0.8,
      title: 'Widget',
      summary: 'People disagree.',
      positions: [
        {
          stance: 'halal',
          title: 'Yes',
          summary: 'Fine',
          accordingTo: 'most scholars',
          sources: [
            {
              authority: 'most scholars',
              name: 'Common view',
              stance: 'halal',
              url: 'https://example.com/a',
              excerpt: 'ok',
            },
          ],
        },
        {
          stance: 'haram',
          title: 'No',
          summary: 'Not fine',
          accordingTo: 'many scholars',
          sources: [
            {
              authority: 'many scholars',
              name: 'Other view',
              stance: 'haram',
              url: 'https://example.com/b',
              excerpt: 'no',
            },
          ],
        },
      ],
    },
    'test-model',
  )
  assert.equal(result.conflict, false)
  assert.equal(result.verdict, 'unclear')
  assert.equal(result.positions.length, 0)
  assert.equal(result.sources.length, 0)
})
