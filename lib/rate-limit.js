/** Soft in-memory windows. Warm Vercel isolates remember them; cold starts do not. */
export const DEFAULT_LIMITS = {
  verdict: { limit: 60, windowMs: 60_000 },
}

export function clientKey(req) {
  const header = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || ''
  const raw = Array.isArray(header) ? header[0] : String(header)
  const ip = raw.split(',')[0].trim() || req?.socket?.remoteAddress || req?.connection?.remoteAddress || ''
  if (!ip) return 'coarse:anonymous'
  return `ip:${String(ip).slice(0, 80)}`
}

export function createRateLimiter({ now = () => Date.now(), limits = DEFAULT_LIMITS } = {}) {
  const buckets = new Map()

  return {
    consume(key, name) {
      const rule = limits[name]
      if (!rule) return { ok: true }
      const nowMs = now()
      const id = `${name}:${key || 'coarse:anonymous'}`
      const windowStart = nowMs - rule.windowMs
      const stamps = (buckets.get(id) || []).filter((stamp) => stamp > windowStart)
      if (stamps.length >= rule.limit) {
        const retryAfterSeconds = Math.max(1, Math.ceil((stamps[0] + rule.windowMs - nowMs) / 1000))
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
