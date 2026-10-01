import { handleVerdictRequest } from "@/lib/http.ts";

export const runtime = "nodejs";
// Keep above lib/openrouter.js REQUEST_BUDGET_MS (55s) so a slow model
// returns JSON instead of a Vercel FUNCTION_INVOCATION_TIMEOUT 504.
export const maxDuration = 60;

// TODO(persistence): cache verdicts and query logs (Vercel KV / Postgres).
// Intentionally no database wiring in this repo.

export const GET = (request: Request) => handleVerdictRequest(request);
export const POST = (request: Request) => handleVerdictRequest(request);
export const OPTIONS = (request: Request) => handleVerdictRequest(request);
