import assert from 'node:assert/strict'
import test from 'node:test'
import { searchFieldEscapeAction, shouldFocusSearchOnSlash } from './searchKeys.js'

function target({ tag = 'DIV', editable = false, overlay = false, role } = {}) {
  return {
    tagName: tag,
    isContentEditable: editable,
    role,
    getAttribute: (name) => (name === 'role' ? role || null : null),
    closest: () => (overlay ? {} : null),
  }
}

function key(overrides = {}) {
  return {
    key: '/',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    isComposing: false,
    repeat: false,
    defaultPrevented: false,
    target: target(),
    ...overrides,
  }
}

test('slash focuses search from a non-input', () => {
  assert.equal(shouldFocusSearchOnSlash(key()), true)
  assert.equal(shouldFocusSearchOnSlash(key({ target: target({ tag: 'BUTTON' }) })), true)
})

test('slash does not steal focus from inputs, editors, or overlays', () => {
  assert.equal(shouldFocusSearchOnSlash(key({ target: target({ tag: 'INPUT' }) })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ target: target({ tag: 'TEXTAREA' }) })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ target: target({ tag: 'SELECT' }) })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ target: target({ editable: true }) })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ target: target({ role: 'searchbox' }) })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ target: target({ overlay: true }) })), false)
})

test('slash ignores shortcuts, repeat, and composition', () => {
  assert.equal(shouldFocusSearchOnSlash(key({ metaKey: true })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ ctrlKey: true })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ altKey: true })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ repeat: true })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ isComposing: true })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ key: '?' })), false)
  assert.equal(shouldFocusSearchOnSlash(key({ defaultPrevented: true })), false)
})

test('escape on the lookup field cancels, then clears, then blurs', () => {
  assert.equal(searchFieldEscapeAction({ loading: true, query: 'pork' }), 'abort')
  assert.equal(searchFieldEscapeAction({ loading: false, query: 'pork' }), 'clear')
  assert.equal(searchFieldEscapeAction({ loading: false, query: '' }), 'blur')
  assert.equal(searchFieldEscapeAction({ loading: false, query: '   ' }), 'clear')
})
