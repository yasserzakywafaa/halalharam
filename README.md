# Halal-Haram (`halalharam`)

Instant **halal / haram / unclear** verdicts with **cited sources**. Every result names **according to whom**. This app never claims one universal ruling for all Muslims.

Brand line: **Cited · not a fatwa mill**.

This repo is the serverless **Next.js** rewrite of [`halal-or-haram`](https://github.com/yasserzakywafaa/halal-or-haram) (Vite SPA + Vercel functions), bootstrapped from [`nextjs-api-boilerplate`](https://github.com/yasserzakywafaa/nextjs-api-boilerplate). All verdict logic, seed data, translations, UI, and tests were carried over; the transport moved to Next.js server actions and Route Handlers.

## Architecture

```
src/app/                  Next.js App Router
  layout.tsx              <html> (lang/dir/theme from cookies), metadata, CSP-nonced boot script, maxDuration 60
  page.tsx                Home (adds home-only JSON-LD; the lookup UI lives in the shell)
  about/ privacy/         Prose documents with their own canonical + title
  api/verdict/route.ts    GET/POST /api/verdict  (public JSON API)
  api/health/route.ts     GET /api/health
src/actions/verdict.ts    Server actions: lookupVerdict, loadHealth  (used by the UI)
src/proxy.ts              Per-request CSP nonce + share-ready security headers
src/client/               React + MUI client (ported from web/src): providers, shell, pages, components, i18n
lib/                      Framework-agnostic domain logic: matcher, OpenRouter client, citations, locale, rate limit, HTTP
lib/types.ts              Shared domain types (Verdict, Citation, VerdictResponse, HealthPayload, …)
data/                     Curated, named-authority seed rulings (+ translations)
```

- The search box calls the **`lookupVerdict` server action** — no client `fetch`, no API URL in the bundle. The OpenRouter key never leaves the server.
- `/api/verdict` and `/api/health` stay public for API consumers and use the **same** `lib/http.ts` core (rate limit + budget) as the server action.
- No database. The catalog is `data/seed-rulings.json`; a miss goes to OpenRouter.

### What was dropped from the boilerplate

MongoDB, auth (Google/phone OTP/JWT), dashboard, contact email, n8n webhooks, Twilio, axios store. This product has no accounts and no database, same as the original repo.

## OpenRouter

Lookup order: curated seed first (fast path). OpenRouter runs only when the seed misses (`lib/openrouter.ts`).

Calls go through the official **`@openrouter/sdk`** (`openRouter.chat.send`). The SDK runs with retries off, and a `beforeRequest` hook keeps `reasoning` exactly `{ enabled: false, effort: "low", exclude: true }` on the wire (the SDK type would otherwise drop `enabled`/`exclude` and switch thinking on). If a 200 response misses a field the SDK's strict schema expects, the raw completion is used. SDK error messages are never surfaced (they can include the upstream body). The budget is unchanged: `AbortController` **and** a `Promise.race` deadline of **55s**, a 57s handler backup, `max_tokens` 2048, reasoning off/low, and **no 429 retries** (HTTP 200 with `sourcePath: "unavailable"`, `unavailableReason: "ai_rate_limited"`). The function `maxDuration` is **60s** (`src/app/layout.tsx` for the server action, `src/app/api/verdict/route.ts` for the API).

Citations must name a scholar, fatwa body, certifier, or primary text. When named sources disagree, both sides are returned and the API does not pick a winner.

## Environment

| Name | Required | Notes |
| --- | --- | --- |
| `GITHUB_PACKAGES_TOKEN` | yes, to install | Read token for `@yasserzakywafaa/client-core` (`read:packages`). Set on Vercel too (install step). Not a runtime secret. |
| `OPENROUTER_API_KEY` | for queries that miss the seed | Server-only. Never `NEXT_PUBLIC_*`. `/api/health` reports `openRouterKeyPresent` and never returns the key. |
| `OPENROUTER_MODEL` | no | Production: `google/gemini-2.5-flash-lite`. Blank falls back to `nvidia/nemotron-3-ultra-550b-a55b:free` (dev only). |
| `OPENROUTER_HTTP_REFERER` | no | Sent as `HTTP-Referer`. Defaults to `https://halalharam.vercel.app`. |

Seed hits (pork, gelatin, alcohol, riba, …) work **without** the key.

## TypeScript

The whole repo is TypeScript (`strict`, `noUncheckedIndexedAccess`). Imports use explicit `.ts` / `.tsx` extensions and type-only imports use `import type` (`allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`), so `node --test` runs the `*.test.ts` files directly with Node's built-in type stripping — no test bundler or `ts-node`. Node 22.18+ is required for that.

## Local development

```bash
export GITHUB_PACKAGES_TOKEN=...
yarn install
cp .env.example .env.local   # paste your OpenRouter key
yarn dev                     # http://localhost:1601
yarn test                    # node --test: matcher, citations, locale, OpenRouter, rate limit, CSP, share-ready, client
yarn typecheck               # tsc --noEmit, strict
yarn build
```

```bash
curl -s "http://localhost:1601/api/verdict?q=gelatin&locale=ar"
```

## API

`GET /api/verdict?q=pork` · `GET /api/verdict?q=beer&locale=ar` · `POST /api/verdict` with `{ "query": "gelatin", "locale": "ar" }`

`locale` (or `lang`) may be `en`, `ar`, `de`, `fr`; `Accept-Language` is the fallback. Response: `verdict`, `confidence`, `lowConfidence`, `conflict`, `positions[]`, `sourcePath` (`seed` | `ai` | `unavailable`), `unavailableReason` (`no_api_key` | `ai_error` | `ai_rate_limited` | null), `locale`, `accordingTo`, `sources[]`, `disclaimer`.

Soft in-memory limit: about 60 lookups per minute per IP per warm instance (shared by the API and the server action). Over the limit: **429** JSON with `Retry-After` (the server action returns the same payload with `status: 429`).

## Theme, language, SSR

- Theme (Light/Dark/System) and language (EN/AR/DE/FR, RTL for Arabic) are stored in `localStorage` **and** mirrored to cookies, so the server renders the right `lang`, `dir`, and explicit theme on the first byte. A nonced boot script resolves "System" before paint.
- RTL uses an emotion cache with `stylis-plugin-rtl`; switching direction at runtime swaps to a client cache (no reload, lookup state kept).
- The header gear uses `ThemeSwitcher` / `LanguageSwitcher` from `@yasserzakywafaa/client-core`.
- The home lookup stays mounted across `/about` and `/privacy`, so going back keeps the verdict.

## Security headers

`src/proxy.ts` sets, on every response: nonce-based `Content-Security-Policy` (no `script-src 'unsafe-inline'`, OpenRouter never allowed in the browser), `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, and `Permissions-Policy`. Builder + tests: `lib/security-headers.ts`.

## Deploy (Vercel)

One Vercel project, framework **Next.js**, default build (`next build`), install `yarn install`. Set `GITHUB_PACKAGES_TOKEN` and `OPENROUTER_API_KEY` for Production, Preview, and Development.

## Disclaimer

Not a personal fatwa. Ingredient source, school of law, and local custom can change the answer. When named sources conflict, both positions are shown.
