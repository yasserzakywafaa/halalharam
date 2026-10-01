import type { Verdict } from '../../lib/types.ts'

export function knownVerdict(verdict: unknown): Verdict {
  return verdict === 'halal' || verdict === 'haram' || verdict === 'unclear' ? verdict : 'unclear'
}

/** Default ON. Only an explicit false hides the one-line gloss. */
export function shouldShowVerdictGloss(plainExplanations: unknown): boolean {
  return plainExplanations !== false
}
