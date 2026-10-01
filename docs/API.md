# Halal-Haram API

Public, read-only JSON endpoints. No key needed. Both run on the Node.js runtime.

## `GET /api/v1/verdict`

| Query | Required | Notes |
| --- | --- | --- |
| `q` | yes | The term to look up, 2–200 characters. |
| `locale` (or `lang`) | no | `en`, `ar`, `de` or `fr`. Falls back to `Accept-Language`, then `en`. |

```bash
curl -s "https://halalharam.vercel.app/api/v1/verdict?q=pork"
curl -s "https://halalharam.vercel.app/api/v1/verdict?q=beer&locale=ar"
```

## `POST /api/v1/verdict`

JSON body: `{ "query": "gelatin", "locale": "ar" }`.

### Response (200)

`verdict` (`halal` | `haram` | `unclear`), `confidence`, `lowConfidence`, `conflict`, `positions[]`, `sourcePath` (`seed` | `ai` | `unavailable`), `unavailableReason` (`no_api_key` | `ai_error` | `ai_rate_limited` | null), `locale`, `accordingTo`, `sources[]`, `disclaimer`.

When named sources disagree, `conflict` is `true`, `verdict` is `unclear`, and `positions[]` lists each side with its own citations.

### Errors

- **400** when the query is shorter than 2 or longer than 200 characters.
- **429** after about 60 lookups per minute per IP per warm instance, with a `Retry-After` header. The `lookupVerdict` server action shares this limit and returns the same payload with `status: 429`.

## `GET /api/v1/health`

Service status, the configured model, `openRouterKeyPresent` (never the key itself) and the starter library.

## Old paths

`/api/verdict` and `/api/health` permanently redirect (308) to the `/api/v1/` paths, so existing callers keep working.
