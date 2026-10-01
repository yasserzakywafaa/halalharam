import assert from 'node:assert/strict'
import test from 'node:test'
import { handleVerdictRequest } from '../services/verdictService.ts'
import { clientKey, createRateLimiter } from './rateLimit.ts'

function mockReq({ method = 'GET', url = '/api/v1/verdict?q=pork', headers = {}, body = null } = {}) {
  return new Request(new URL(url, 'http://localhost'), {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  })
}

test('client key prefers the first forwarded hop and falls back to a coarse bucket', () => {
  assert.equal(
    clientKey({ headers: { 'x-forwarded-for': '198.51.100.8, 10.0.0.1' } }),
    'ip:198.51.100.8',
  )
  assert.equal(clientKey({ headers: {} }), 'coarse:anonymous')
})

test('verdict returns 429 JSON after the soft limit', async () => {
  const limiter = createRateLimiter({
    now: () => 1_700_000_000_000,
    limits: { verdict: { limit: 2, windowMs: 60_000 } },
  })
  const headers = { 'x-forwarded-for': '198.51.100.20' }

  for (let i = 0; i < 2; i += 1) {
    const res = await handleVerdictRequest(mockReq({ headers }), { limiter })
    assert.equal(res.status, 200)
  }

  const blocked = await handleVerdictRequest(mockReq({ headers }), { limiter })
  assert.equal(blocked.status, 429)
  assert.equal(blocked.headers.get('retry-after'), '60')
  const payload = await blocked.json()
  assert.equal(payload.code, 'rate_limited')
  assert.match(payload.error, /too many requests/i)
  assert.equal(payload.retryAfterSeconds, 60)
})

test('verdict OPTIONS is not counted against the soft limit', async () => {
  const limiter = createRateLimiter({
    now: () => 1_700_000_000_000,
    limits: { verdict: { limit: 1, windowMs: 60_000 } },
  })
  const headers = { 'x-forwarded-for': '198.51.100.21' }

  const preflight = await handleVerdictRequest(mockReq({ method: 'OPTIONS', headers }), { limiter })
  assert.equal(preflight.status, 204)

  const first = await handleVerdictRequest(mockReq({ headers }), { limiter })
  assert.equal(first.status, 200)
})
