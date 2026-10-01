"use server";

import { headers } from "next/headers";

import { buildHealthPayload } from "@/src/lib/server/services/healthService.ts";
import { headerBag, runVerdict } from "@/src/lib/server/services/verdictService.ts";
import { resolveLocale } from "@/src/lib/utils/locale.ts";

/**
 * Server action behind the search box. Seed first, OpenRouter only on a miss.
 * The OpenRouter key never leaves the server. Shares the soft rate limit and the
 * 55s OpenRouter budget with `GET/POST /api/v1/verdict`.
 *
 * Errors come back as `{ error, status, code? }` (never thrown) so the client can
 * tell a 400 / 429 apart from a network failure.
 */
export async function lookupVerdict(query: string, locale?: string) {
  const requestHeaders = headerBag(await headers());
  return runVerdict({
    query: String(query ?? ""),
    locale: resolveLocale(locale),
    headers: requestHeaders,
  });
}

/** Starter library + whether OpenRouter is configured. Never includes the key. */
export async function loadHealth(locale?: string) {
  return buildHealthPayload(resolveLocale(locale));
}
