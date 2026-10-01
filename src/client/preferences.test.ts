import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PLAIN_EXPLANATIONS_STORAGE_KEY,
  parsePlainExplanationsPreference,
  readPlainExplanationsPreference,
  writePlainExplanationsPreference,
} from './preferences.ts'
import { knownVerdict, shouldShowVerdictGloss } from './verdictGloss.ts'

const memory = new Map<string, string>()

function installMemoryStorage() {
  const storage: Storage = {
    get length() {
      return memory.size
    },
    key(index: number) {
      return [...memory.keys()][index] ?? null
    },
    getItem(key: string) {
      return memory.get(key) ?? null
    },
    setItem(key: string, value: string) {
      memory.set(key, String(value))
    },
    removeItem(key: string) {
      memory.delete(key)
    },
    clear() {
      memory.clear()
    },
  }
  globalThis.localStorage = storage
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
