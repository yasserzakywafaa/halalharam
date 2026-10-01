export function knownVerdict(verdict) {
  return verdict === 'halal' || verdict === 'haram' || verdict === 'unclear' ? verdict : 'unclear'
}

/** Default ON. Only an explicit false hides the one-line gloss. */
export function shouldShowVerdictGloss(plainExplanations) {
  return plainExplanations !== false
}
