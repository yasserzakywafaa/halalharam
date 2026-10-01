import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PLAIN_EXPLANATIONS_STORAGE_KEY,
  parsePlainExplanationsPreference,
  readPlainExplanationsPreference,
  writePlainExplanationsPreference,
} from './preferences.js'
import { knownVerdict, shouldShowVerdictGloss } from './verdictGloss.js'

const memory = new Map()

function installMemoryStorage() {
  globalThis.localStorage = {
    getItem(key) {
      return memory.has(key) ? memory.get(key) : null
    },
    setItem(key, value) {
      memory.set(key, String(value))
    },
    removeItem(key) {
      memory.delete(key)
    },
    clear() {
      memory.clear()
    },
  }
}

test('plain explanations default ON for new visitors', () => {
  assert.equal(parsePlainExplanationsPreference(null), true)
  assert.equal(parsePlainExplanationsPreference(undefined), true)
  assert.equal(parsePlainExplanationsPreference(''), true)
  assert.equal(parsePlainExplanationsPreference('1'), true)
  assert.equal(parsePlainExplanationsPreference('true'), true)
  assert.equal(parsePlainExplanationsPreference('on'), true)
})

test('plain explanations OFF only when stored as an explicit off value', () => {
  assert.equal(parsePlainExplanationsPreference('0'), false)
  assert.equal(parsePlainExplanationsPreference('false'), false)
  assert.equal(parsePlainExplanationsPreference('off'), false)
})

test('plain explanations preference persists through localStorage', () => {
  memory.clear()
  installMemoryStorage()
  assert.equal(PLAIN_EXPLANATIONS_STORAGE_KEY, 'plainExplanationsPreference')
  assert.equal(readPlainExplanationsPreference(), true)
  writePlainExplanationsPreference(false)
  assert.equal(localStorage.getItem(PLAIN_EXPLANATIONS_STORAGE_KEY), '0')
  assert.equal(readPlainExplanationsPreference(), false)
  writePlainExplanationsPreference(true)
  assert.equal(localStorage.getItem(PLAIN_EXPLANATIONS_STORAGE_KEY), '1')
  assert.equal(readPlainExplanationsPreference(), true)
})

test('verdict gloss shows by default and hides when the preference is off', () => {
  assert.equal(shouldShowVerdictGloss(true), true)
  assert.equal(shouldShowVerdictGloss(undefined), true)
  assert.equal(shouldShowVerdictGloss(false), false)
  assert.equal(knownVerdict('halal'), 'halal')
  assert.equal(knownVerdict('haram'), 'haram')
  assert.equal(knownVerdict('unclear'), 'unclear')
  assert.equal(knownVerdict('maybe'), 'unclear')
})
