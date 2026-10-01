import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('glossary sheet is a dialog and the trigger stays on the home hero', () => {
  const sheet = readFileSync(new URL('./components/GlossarySheet.tsx', import.meta.url), 'utf8')
  assert.match(sheet, /aria-haspopup="dialog"/)
  assert.match(sheet, /role: 'dialog'/)
  assert.match(sheet, /aria-modal/)
  assert.match(sheet, /aria-labelledby/)
  assert.match(sheet, /glossary.open/)
  assert.match(sheet, /TERMS/)
  assert.match(sheet, /glossary.millTerm/)
  assert.doesNotMatch(sheet, /Suggest/)

  const home = readFileSync(new URL('./pages/HomePage.tsx', import.meta.url), 'utf8')
  assert.match(home, /GlossarySheet/)
  assert.match(home, /empty\.body/)
  assert.match(home, /HowThisWorks/)
})

test('first-visit notice still dismisses with howThisWorksDismissed', () => {
  const notice = readFileSync(new URL('./components/HowThisWorks.tsx', import.meta.url), 'utf8')
  assert.match(notice, /readHowThisWorksDismissed/)
  assert.match(notice, /writeHowThisWorksDismissed/)
  assert.match(notice, /how\.dismiss/)
  assert.match(notice, /how\.noticeSeed/)

  const prefs = readFileSync(new URL('./preferences.ts', import.meta.url), 'utf8')
  assert.match(prefs, /howThisWorksDismissed/)
})
