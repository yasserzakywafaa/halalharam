const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** Minimal shape of an event target (an Element in the browser, a plain object in tests). */
export interface TargetLike {
  tagName?: unknown
  isContentEditable?: boolean
  role?: string | null
  getAttribute?: (name: string) => string | null
  closest?: (selector: string) => unknown
}

export interface KeyLike {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  isComposing?: boolean
  repeat?: boolean
  defaultPrevented?: boolean
  target?: unknown
}

export function isEditableTarget(input: unknown): boolean {
  if (!input || typeof input !== 'object') return false
  const target = input as TargetLike
  const tag = typeof target.tagName === 'string' ? target.tagName.toUpperCase() : ''
  if (EDITABLE_TAGS.has(tag)) return true
  if (target.isContentEditable) return true
  const role = typeof target.getAttribute === 'function' ? target.getAttribute('role') : target.role
  if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return true
  return false
}

export function isInsideOverlay(input: unknown): boolean {
  const target = input as TargetLike | null | undefined
  if (!target || typeof target.closest !== 'function') return false
  return Boolean(target.closest('[role="dialog"], [role="menu"], [role="listbox"], [role="alertdialog"]'))
}

/** Slash focuses lookup only when the reader is not already typing or in a dialog/menu. */
export function shouldFocusSearchOnSlash(event: KeyLike | null | undefined): boolean {
  if (!event || event.key !== '/') return false
  if (event.metaKey || event.ctrlKey || event.altKey) return false
  if (event.isComposing || event.repeat || event.defaultPrevented) return false
  const target = event.target
  if (isEditableTarget(target) || isInsideOverlay(target)) return false
  return true
}

/**
 * Escape while the lookup field itself is focused.
 * abort — cancel the in-flight request
 * clear — empty the query
 * blur — leave the field
 */
export function searchFieldEscapeAction({
  loading,
  query,
}: { loading?: boolean; query?: string } = {}): 'abort' | 'clear' | 'blur' {
  if (loading) return 'abort'
  if (String(query || '').length > 0) return 'clear'
  return 'blur'
}
