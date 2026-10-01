'use client'

import { loadHealth, lookupVerdict } from '../../../actions/verdict'
import { createVerdictClient } from './verdictApi.ts'

export { isVerdictNetworkFailure } from './verdictApi.ts'

export const { fetchVerdict, fetchHealth, fetchLibrary } = createVerdictClient({
  lookup: lookupVerdict,
  health: loadHealth,
})
