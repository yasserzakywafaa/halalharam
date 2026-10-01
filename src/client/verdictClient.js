'use client'

import { loadHealth, lookupVerdict } from '../actions/verdict'
import { createVerdictClient } from './api.js'

export { isVerdictNetworkFailure } from './api.js'

export const { fetchVerdict, fetchHealth, fetchLibrary } = createVerdictClient({
  lookup: lookupVerdict,
  health: loadHealth,
})
