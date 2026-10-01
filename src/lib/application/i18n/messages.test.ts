import assert from 'node:assert/strict'
import test from 'node:test'
import { messages } from './messages.ts'

const LOCALES = ['en', 'ar', 'de', 'fr'] as const

test('recovery and offline copy exists in every locale', () => {
  for (const locale of LOCALES) {
    const search = messages[locale].search
    const recovery = messages[locale].errorBoundary
    assert.equal(typeof search.offline, 'string')
    assert.ok(search.offline.length > 8, locale)
    assert.equal(typeof search.shortcut, 'string')
    assert.ok(recovery.title.length > 0, locale)
    assert.ok(recovery.body.length > 0, locale)
    assert.ok(recovery.retry.length > 0, locale)
    assert.ok(recovery.reload.length > 0, locale)
    const blob = JSON.stringify(recovery)
    assert.doesNotMatch(blob, /stack|componentStack|at \w+\s\(/i, locale)
  }
})

test('user-facing copy has no em dashes or decorative kickers', () => {
  for (const locale of LOCALES) {
    const blob = JSON.stringify(messages[locale])
    assert.doesNotMatch(blob, /—/, locale)
    assert.equal('kicker' in messages[locale].hero, false, locale)
    assert.equal('kicker' in messages[locale].how, false, locale)
    assert.equal('kicker' in messages[locale].about, false, locale)
    assert.equal('kicker' in messages[locale].privacy, false, locale)
    assert.equal('kicker' in messages[locale].library, false, locale)
    assert.equal('noticeKicker' in messages[locale].search, false, locale)
    assert.ok(messages[locale].brandLine.includes('·'), locale)
    assert.ok(messages[locale].library.title.length > 0, locale)
  }
  assert.equal(messages.en.library.title, 'Suggestions')
  assert.equal(messages.ar.library.title, 'اقتراحات')
  assert.equal(messages.de.library.title, 'Vorschläge')
  assert.equal(messages.fr.library.title, 'Suggestions')
})

test('home notice defines terms in plain English and every locale has copy', () => {
  for (const locale of LOCALES) {
    const how = messages[locale].how
    assert.equal(typeof how.noticeTitle, 'string')
    assert.ok(how.noticeTitle.length > 0, locale)
    for (const key of ['noticeSeed', 'noticeConflict', 'noticeLimit', 'dismiss'] as const) {
      assert.equal(typeof how[key], 'string', locale)
      assert.ok(how[key].trim().length > 0, locale)
    }
  }
  const notice = [messages.en.how.noticeSeed, messages.en.how.noticeConflict, messages.en.how.noticeLimit].join(' ')
  assert.match(notice, /Islamic sources/)
  assert.match(notice, /Halal means permitted/)
  assert.match(notice, /Haram means not permitted/)
  assert.match(notice, /Unclear means scholars disagree/)
  assert.match(notice, /fatwa is a formal scholarly opinion/)
  assert.match(notice, /not religious advice/)
  assert.match(notice, /not a fatwa mill/)
})

test('empty desk intro is guest-friendly in every locale', () => {
  for (const locale of LOCALES) {
    assert.ok(messages[locale].empty.title.trim().length > 0, locale)
    assert.ok(messages[locale].empty.body.trim().length > 8, locale)
  }
  assert.match(messages.en.empty.body, /pork/)
  assert.match(messages.en.empty.body, /gelatin/)
  assert.match(messages.en.empty.body, /insurance/)
  assert.match(messages.en.empty.body, /named Islamic sources/)
  assert.match(messages.ar.empty.body, /التأمين/)
})

test('glossary has eight skimmable terms in every locale', () => {
  const keys = ['halal', 'haram', 'unclear', 'fatwa', 'madhhab', 'bodies', 'seed', 'mill']
  for (const locale of LOCALES) {
    const glossary = messages[locale].glossary
    assert.ok(glossary.open.trim().length > 0, locale)
    assert.ok(glossary.title.trim().length > 0, locale)
    assert.ok(glossary.close.trim().length > 0, locale)
    for (const key of keys) {
      const entry = glossary as Record<string, string | undefined>
      assert.ok(String(entry[`${key}Term`] ?? '').trim().length > 0, `${locale} ${key}Term`)
      assert.ok(String(entry[`${key}Body`] ?? '').trim().length > 8, `${locale} ${key}Body`)
    }
  }
  assert.equal(messages.en.glossary.open, 'What do these words mean?')
  assert.match(messages.en.glossary.halalBody, /Permitted/)
  assert.match(messages.en.glossary.haramBody, /Not permitted/)
  assert.match(messages.en.glossary.fatwaBody, /formal scholarly opinion/)
  assert.match(messages.en.glossary.bodiesBody, /IslamQA/)
  assert.match(messages.en.glossary.bodiesBody, /Dar al-Ifta/)
  assert.match(messages.en.glossary.millBody, /not religious advice/)
  assert.match(messages.ar.glossary.open, /ماذا تعني هذه الكلمات/)
  assert.equal(messages.ar.glossary.halalTerm, 'حلال')
  assert.equal(messages.ar.glossary.haramTerm, 'حرام')
  assert.equal(messages.ar.glossary.fatwaTerm, 'فتوى')
  assert.equal(messages.de.glossary.open, 'Was bedeuten diese Wörter?')
  assert.equal(messages.fr.glossary.open, 'Que signifient ces mots ?')
})

test('verdict literacy copy exists in every locale', () => {
  for (const locale of LOCALES) {
    const verdict = messages[locale].verdict
    for (const key of ['halal', 'haram', 'unclear'] as const) {
      assert.equal(typeof verdict[key], 'string', `${locale} ${key}`)
      assert.ok(verdict[key].trim().length > 0, `${locale} ${key}`)
      assert.equal(typeof verdict.gloss[key], 'string', `${locale} gloss.${key}`)
      assert.ok(verdict.gloss[key].trim().length > 8, `${locale} gloss.${key}`)
      assert.equal(typeof verdict.chipHint[key], 'string', `${locale} chipHint.${key}`)
      assert.ok(verdict.chipHint[key].trim().length > 0, `${locale} chipHint.${key}`)
    }
    assert.equal(typeof verdict.fatwa.term, 'string', locale)
    assert.ok(verdict.fatwa.term.trim().length > 0, locale)
    assert.match(verdict.fatwa.hint, /.{12,}/, locale)
    assert.ok(verdict.accordingTo.trim().length > 8, locale)
    assert.ok(verdict.citedSources.trim().length > 8, locale)
  }

  assert.equal(messages.en.verdict.gloss.halal, 'Permitted in Islam (per the sources below).')
  assert.equal(messages.en.verdict.gloss.haram, 'Not permitted in Islam (per the sources below).')
  assert.equal(messages.en.verdict.gloss.unclear, 'Islamic authorities disagree. Both sides are listed.')
  assert.equal(messages.en.verdict.chipHint.halal, 'Permitted')
  assert.equal(messages.en.verdict.chipHint.haram, 'Not permitted')
  assert.equal(messages.en.verdict.chipHint.unclear, 'Scholars disagree')
  assert.equal(messages.en.verdict.accordingTo, 'According to these Islamic sources')
  assert.equal(messages.en.verdict.citedSources, 'Cited sources')
  assert.equal(messages.en.verdict.fatwa.term, 'Fatwa')
  assert.match(messages.en.verdict.fatwa.hint, /formal scholarly opinion/)
  assert.match(messages.en.seo.description, /halal \(permitted in Islam\)/)
  assert.match(messages.en.seo.description, /haram \(not permitted\)/)
  assert.match(messages.en.seo.description, /unclear \(scholars disagree\)/)

  assert.equal(messages.ar.verdict.fatwa.term, 'فتوى')
  assert.match(messages.ar.verdict.accordingTo, /المصادر الإسلامية/)
  assert.match(messages.de.verdict.accordingTo, /islamischen Quellen/)
  assert.match(messages.fr.verdict.accordingTo, /sources islamiques/)
})

test('offline copy is not the no-key or rate-limit message', () => {
  for (const locale of LOCALES) {
    const offline = messages[locale].search.offline
    assert.doesNotMatch(offline, /OPENROUTER_API_KEY|rate limit|too many requests/i, locale)
  }
})

test('verdict gloss exists in every locale', () => {
  for (const locale of LOCALES) {
    const verdict = messages[locale].verdict
    for (const key of ['halal', 'haram', 'unclear'] as const) {
      assert.equal(typeof verdict.gloss[key], 'string', `${locale} gloss.${key}`)
      assert.ok(verdict.gloss[key].trim().length > 8, `${locale} gloss.${key}`)
    }
  }

  assert.equal(messages.en.verdict.gloss.halal, 'Permitted in Islam (per the sources below).')
  assert.equal(messages.en.verdict.gloss.haram, 'Not permitted in Islam (per the sources below).')
  assert.equal(messages.en.verdict.gloss.unclear, 'Islamic authorities disagree. Both sides are listed.')
  assert.match(messages.en.status.failedBody, /No match in our curated list/)
  assert.match(messages.en.status.failedBody, /named Islamic sources/)
  assert.match(messages.en.status.failedBody, /Try a shorter term, or ask a scholar/)
  assert.match(messages.en.search.aiFailBody, /named Islamic sources/)
  assert.match(messages.en.search.aiFailBody, /Try again/)
  for (const locale of LOCALES) {
    assert.equal('plainExplanations' in messages[locale].settings, false, locale)
    assert.doesNotMatch(messages[locale].privacy.localBody, /plainExplanations/, locale)
  }
})

