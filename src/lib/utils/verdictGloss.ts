import type { Verdict } from '../application/shared/types.ts'

export function knownVerdict(verdict: unknown): Verdict {
  return verdict === 'halal' || verdict === 'haram' || verdict === 'unclear' ? verdict : 'unclear'
}

