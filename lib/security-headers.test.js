import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildContentSecurityPolicy, createNonce, STATIC_SECURITY_HEADERS } from './security-headers.js'

function directives(csp) {
  return Object.fromEntries(
    csp
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...rest] = part.split(/\s+/)
        return [name, rest.join(' ')]
      }),
  )
}

test('share-ready headers are set without exposing OpenRouter to the browser', () => {
  const headers = STATIC_SECURITY_HEADERS
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
  assert.equal(headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(headers['X-Frame-Options'], 'DENY')

  const permissions = headers['Permissions-Policy']
  assert.match(permissions, /(^|,\s*)camera=\(\)/)
  assert.match(permissions, /(^|,\s*)microphone=\(\)/)
  assert.match(permissions, /(^|,\s*)geolocation=\(\)/)

  const nonce = createNonce()
  const csp = buildContentSecurityPolicy({ nonce })
  assert.equal(csp.includes('openrouter.ai'), false)
  const policy = directives(csp)
  assert.equal(policy['default-src'], "'self'")
  assert.equal(policy['base-uri'], "'self'")
  assert.equal(policy['object-src'], "'none'")
  assert.equal(policy['frame-ancestors'], "'none'")
  assert.equal(policy['frame-src'], "'none'")
  assert.equal(policy['form-action'], "'self'")
  assert.equal(policy['script-src-attr'], "'none'")
  assert.equal(policy['script-src'].includes("'unsafe-inline'"), false)
  assert.equal(policy['script-src'].includes("'unsafe-eval'"), false)
  assert.ok(policy['script-src'].includes("'self'"))
  assert.ok(policy['script-src'].includes(`'nonce-${nonce}'`))
  assert.ok(policy['style-src'].includes("'self'"))
  assert.ok(policy['style-src'].includes("'unsafe-inline'"))
  assert.ok(policy['style-src'].includes('https://fonts.googleapis.com'))
  assert.ok(policy['font-src'].includes("'self'"))
  assert.ok(policy['font-src'].includes('https://fonts.gstatic.com'))
  assert.ok(policy['img-src'].includes("'self'"))
  assert.ok(policy['img-src'].includes('data:'))
  assert.ok(policy['connect-src'].includes("'self'"))
  assert.equal(policy['connect-src'].includes('openrouter.ai'), false)
  assert.ok(csp.includes('upgrade-insecure-requests'))
})

test('every response gets a fresh nonce', () => {
  assert.notEqual(createNonce(), createNonce())
  assert.throws(() => buildContentSecurityPolicy({}))
})

test('the proxy applies the policy and the layout stamps the boot script with the nonce', () => {
  const proxy = readFileSync(new URL('../src/proxy.ts', import.meta.url), 'utf8')
  assert.match(proxy, /buildContentSecurityPolicy/)
  assert.match(proxy, /STATIC_SECURITY_HEADERS/)
  assert.match(proxy, /x-nonce/)
  const layout = readFileSync(new URL('../src/app/layout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /nonce=\{nonce\}/)
})
