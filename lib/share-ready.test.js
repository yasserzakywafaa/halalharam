import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import seedFile from '../data/seed-rulings.json' with { type: 'json' }
import { collectSources } from './authorities.js'
import { listCitedHomes } from './cited-homes.js'
import { homeJsonLd } from './home-jsonld.js'
import { isPublicPath, normalizePath, PUBLIC_PATHS, publicUrl, SITE_ORIGIN } from './public-pages.js'
import { pageTitles, siteMetadata } from './site-metadata.js'
import { messages } from '../src/client/i18n/messages.js'

const root = new URL('..', import.meta.url)

function readRepo(path) {
  return readFileSync(new URL(path, root), 'utf8')
}

function leafKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key))
}

test('public pages are only the home, about, and privacy documents', () => {
  assert.deepEqual(PUBLIC_PATHS, ['/', '/about', '/privacy'])
  assert.equal(normalizePath('/about/'), '/about')
  assert.equal(normalizePath('/privacy?x=1'), '/privacy')
  assert.equal(normalizePath(''), '/')
  assert.equal(isPublicPath('/about'), true)
  assert.equal(isPublicPath('/pork'), false)
  assert.equal(publicUrl('/'), `${SITE_ORIGIN}/`)
  assert.equal(publicUrl('/about'), `${SITE_ORIGIN}/about`)
  assert.equal(publicUrl('/privacy'), `${SITE_ORIGIN}/privacy`)
  assert.throws(() => publicUrl('/pork'), /Not a public page/)
})

test('robots.txt allows the public pages and does not list lookup items', () => {
  const robots = readRepo('public/robots.txt')
  const allows = [...robots.matchAll(/^Allow:\s*(\S+)\s*$/gm)].map((match) => match[1])
  assert.deepEqual(allows, ['/', '/about', '/privacy'])
  assert.match(robots, /^Disallow:\s*\/api\/\s*$/m)
  assert.match(robots, new RegExp(`^Sitemap:\\s*${SITE_ORIGIN}/sitemap\\.xml\\s*$`, 'm'))
  assert.doesNotMatch(robots, /\/pork|\/gelatin|\?q=/)
})

test('sitemap lists only the production public pages', () => {
  const sitemap = readRepo('public/sitemap.xml')
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  assert.deepEqual(
    locs,
    PUBLIC_PATHS.map((path) => publicUrl(path)),
  )
  assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/)
  assert.doesNotMatch(sitemap, /\?q=|\/api\/|\/pork|\/gelatin/)
})

test('home JSON-LD is WebSite, WebApplication, and a how-it-works FAQ', () => {
  const homePage = readRepo('src/app/page.tsx')
  assert.match(homePage, /application\/ld\+json/)
  assert.match(homePage, /id="home-jsonld"/)
  assert.match(homePage, /homeJsonLd/)

  const types = homeJsonLd['@graph'].map((node) => node['@type'])
  assert.deepEqual(types, ['WebSite', 'WebApplication', 'FAQPage'])

  const website = homeJsonLd['@graph'][0]
  const app = homeJsonLd['@graph'][1]
  const faq = homeJsonLd['@graph'][2]
  assert.equal(website.url, `${SITE_ORIGIN}/`)
  assert.equal(website.description, messages.en.footer.note)
  assert.deepEqual(website.inLanguage, ['en', 'ar', 'de', 'fr'])
  assert.equal(app.description, messages.en.how.body)
  assert.equal(app.applicationCategory, 'ReferenceApplication')
  assert.equal(faq.mainEntity[0].name, messages.en.how.title)
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, messages.en.how.body)
  assert.equal(faq.url, `${SITE_ORIGIN}/`)

  for (const text of [messages.en.footer.note, messages.en.how.body, messages.en.about.lead]) {
    assert.match(text, /not a fatwa mill|ليس مطحنة فتاوى|keine Fatwa-Mühle|pas un moulin à fatwas/i)
    assert.match(text, /not a substitute for a qualified scholar|ليس بديلًا عن عالم مؤهّل|kein Ersatz für einen qualifizierten Gelehrten|ne remplace pas un savant qualifié/i)
  }
  assert.match(messages.en.how.body, /there is no voting/)
  assert.match(messages.en.how.body, /both sides/)
  assert.match(messages.en.how.body, /no suggestion queue/)
  assert.doesNotMatch(JSON.stringify(messages), /review queue|queued for review|Suggest an item|\/api\/suggest/i)
  assert.match(messages.en.footer.note, /does not claim religious or medical authority/)
  assert.doesNotMatch(JSON.stringify(homeJsonLd), /certified halal|we issue fatwas|medical diagnosis|SearchAction|search_term_string|\?q=/i)

  assert.equal(siteMetadata.origin, SITE_ORIGIN)
  assert.match(readRepo('src/app/layout.tsx'), /canonical: publicUrl\('\/'\)/)
})

test('home share meta defines the three verdicts in plain language', () => {
  const description = siteMetadata.description
  assert.equal(description, messages.en.seo.description)
  assert.match(description, /halal \(permitted in Islam\)/)
  assert.match(description, /haram \(not permitted\)/)
  assert.match(description, /unclear \(scholars disagree\)/)
  assert.equal(siteMetadata.ogImage.url, `${SITE_ORIGIN}/og.png`)
  const layout = readRepo('src/app/layout.tsx')
  assert.match(layout, /openGraph:/)
  assert.match(layout, /twitter:/)
  assert.match(layout, /siteMetadata\.description/)
})

test('about and privacy pages drop home JSON-LD and set their own canonical', () => {
  for (const path of ['/about', '/privacy']) {
    const page = readRepo(`src/app${path}/page.tsx`)
    assert.doesNotMatch(page, /application\/ld\+json/)
    assert.doesNotMatch(page, /home-jsonld/)
    assert.match(page, new RegExp(`publicUrl\\('${path}'\\)`))
    assert.ok(pageTitles[path])
  }
})

test('cited homes are exactly the sites already named in the seed', () => {
  const homes = listCitedHomes(seedFile.items)
  const seedUrls = seedFile.items.flatMap((item) => collectSources(item).map((source) => source.url).filter(Boolean))
  const origins = new Set(seedUrls.map((url) => new URL(url).origin))

  assert.deepEqual(
    homes.map((home) => home.href).sort(),
    [...origins].sort(),
  )

  for (const home of homes) {
    const url = new URL(home.href)
    assert.equal(url.origin, home.href)
    assert.equal(url.pathname, '/')
    assert.equal(url.search, '')
    assert.ok(home.authorities.length >= 1)
    for (const authority of home.authorities) {
      const cited = seedFile.items.some((item) =>
        collectSources(item).some(
          (source) => source.url && new URL(source.url).origin === home.href && source.authority === authority,
        ),
      )
      assert.equal(cited, true, `${authority} @ ${home.href}`)
    }
  }
})

test('about, privacy, and footer copy exists in every language', () => {
  const required = leafKeys({
    how: messages.en.how,
    about: messages.en.about,
    privacy: messages.en.privacy,
    nav: messages.en.nav,
    footer: messages.en.footer,
  })
  for (const lang of ['en', 'ar', 'de', 'fr']) {
    const keys = new Set(leafKeys(messages[lang]))
    for (const key of required) {
      assert.equal(keys.has(key), true, `${lang} missing ${key}`)
      const value = key.split('.').reduce((node, part) => node[part], messages[lang])
      assert.equal(typeof value, 'string')
      assert.ok(value.trim().length > 0, `${lang} ${key} is empty`)
    }
  }
})

test('print stylesheet keeps the verdict and citation URLs and hides chrome', () => {
  const css = readRepo('src/client/index.css')
  assert.match(css, /@media print/)
  assert.match(css, /\[data-print-hide\]/)
  assert.match(css, /\.MuiModal-root/)
  assert.match(css, /\.MuiTooltip-popper/)
  assert.match(css, /\.print-only/)
  assert.match(css, /a\.print-append-url\[href\]::after/)
  assert.match(css, /content:\s*" \(" attr\(href\) "\)"/)
  assert.match(css, /#verdict:has\(article\)/)

  const header = readRepo('src/client/components/SiteHeader.jsx')
  const footer = readRepo('src/client/components/SiteFooter.jsx')
  const card = readRepo('src/client/components/VerdictCard.jsx')
  const ads = readRepo('src/client/components/AdSlot.jsx')
  const home = readRepo('src/client/pages/HomePage.jsx')
  assert.match(header, /data-print-hide/)
  assert.match(header, /SettingsMenuButton/)
  assert.match(footer, /data-print-hide/)
  assert.match(footer, /to="\/about"/)
  assert.match(footer, /to="\/privacy"/)
  assert.match(card, /className="print-only"/)
  assert.match(card, /className="print-append-url"/)
  assert.match(card, /data-print-hide/)
  assert.match(card, /verdict-status-gloss/)
  assert.match(card, /Tooltip/)
  assert.match(card, /verdict\.gloss/)
  assert.match(card, /verdict\.fatwa/)
  assert.match(ads, /data-print-hide/)
  assert.ok((home.match(/data-print-hide/g) || []).length >= 5)
})

test('settings keep client-core switchers and a plain-explanations toggle', () => {
  const settings = readRepo('src/client/components/SettingsMenuButton.jsx')
  const card = readRepo('src/client/components/VerdictCard.jsx')
  assert.match(settings, /ThemeSwitcher/)
  assert.match(settings, /LanguageSwitcher/)
  assert.match(settings, /@yasserzakywafaa\/client-core\/web/)
  assert.match(settings, /accentColor=\{accentColor\}/)
  assert.match(settings, /palette\.primary\.main/)
  assert.doesNotMatch(settings, /#14315D/)
  assert.match(settings, /settings\.plainExplanations/)
  assert.match(settings, /settings\.plainExplanationsHelp/)
  assert.match(settings, /<Switch/)
  assert.match(card, /verdict\.gloss/)
  assert.match(card, /shouldShowVerdictGloss/)
  assert.match(card, /usePlainExplanations/)
})
