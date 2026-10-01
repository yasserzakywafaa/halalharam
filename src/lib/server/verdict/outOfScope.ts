import { localeCopy } from '../../utils/locale.ts'
import type { DraftVerdict, Locale, SourcePath } from '../../application/shared/types.ts'

/** The draft for a query that is not a halal/haram question. Carries no ruling and no sources. */
export function outOfScopeDraft(
  query: string,
  locale: Locale,
  sourcePath: SourcePath = 'guard',
  model: string | null = null,
): DraftVerdict {
  const copy = localeCopy(locale)
  return {
    query,
    verdict: 'unclear',
    confidence: 0,
    title: copy.outOfScopeTitle,
    summary: copy.outOfScope,
    accordingTo: '',
    caveats: [],
    sources: [],
    positions: [],
    conflict: false,
    sourcePath,
    outOfScope: true,
    model,
    locale,
  }
}
