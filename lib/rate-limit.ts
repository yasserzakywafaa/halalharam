import type { HeaderBag } from './types.ts'

export interface RateLimitRule {
  limit: number
  windowMs: number
}

export type RateLimitDecision =
  | { ok: true; remaining?: number }
  | { ok: false; retryAfterSeconds: number; limit: number; windowMs: number }

export interface RateLimiter {
  consume(key: string, name: string): RateLimitDecision
}

/** Soft in-memory windows. Warm Vercel isolates remember them; cold starts do not. */
export const DEFAULT_LIMITS: Record<string, RateLimitRule> = {
  verdict: { limit: 60, windowMs: 60_000 },
}

interface KeyedRequest {
  headers?: HeaderBag
  socket?: { remoteAddress?: string }
  connection?: { remoteAddress?: string }
}

export function clientKey(req: KeyedRequest | null | undefined): string {
  const header = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || ''
  const raw = Array.isArray(header) ? (header[0] ?? '') : String(header)
  const ip =
    (raw.split(',')[0] ?? '').trim() || req?.socket?.remoteAddress || req?.connection?.remoteAddress || ''
  if (!ip) return 'coarse:anonymous'
  return `ip:${String(ip).slice(0, 80)}`
}

export function createRateLimiter({
  now = () => Date.now(),
  limits = DEFAULT_LIMITS,
}: { now?: () => number; limits?: Record<string, RateLimitRule> } = {}): RateLimiter {
  const buckets = new Map<string, number[]>()

  return {
    consume(key, name) {
      const rule = limits[name]
      if (!rule) return { ok: true }
      const nowMs = now()
      const id = `${name}:${key || 'coarse:anonymous'}`
      const windowStart = nowMs - rule.windowMs
      const stamps = (buckets.get(id) || []).filter((stamp) => stamp > windowStart)
      const oldest = stamps[0]
      if (oldest !== undefined && stamps.length >= rule.limit) {
        const retryAfterSeconds = Math.max(1, Math.ceil((oldest + rule.windowMs - nowMs) / 1000))
        buckets.set(id, stamps)
        return {
          ok: false,
          retryAfterSeconds,
          limit: rule.limit,
          windowMs: rule.windowMs,
        }
      }
      stamps.push(nowMs)
      buckets.set(id, stamps)
      return { ok: true, remaining: rule.limit - stamps.length }
    },
  }
}

export const rateLimiter = createRateLimiter()
