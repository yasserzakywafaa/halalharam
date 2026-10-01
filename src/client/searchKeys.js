const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function isEditableTarget(target) {
  if (!target || typeof target !== 'object') return false
  const tag = typeof target.tagName === 'string' ? target.tagName.toUpperCase() : ''
  if (EDITABLE_TAGS.has(tag)) return true
  if (target.isContentEditable) return true
  const role = typeof target.getAttribute === 'function' ? target.getAttribute('role') : target.role
  if (role === 'textbox' || role === 'searchbox' || role === 'combobox') return true
  return false
}

export function isInsideOverlay(target) {
  if (!target || typeof target.closest !== 'function') return false
  return Boolean(target.closest('[role="dialog"], [role="menu"], [role="listbox"], [role="alertdialog"]'))
}

/** Slash focuses lookup only when the reader is not already typing or in a dialog/menu. */
export function shouldFocusSearchOnSlash(event) {
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
export function searchFieldEscapeAction({ loading, query } = {}) {
  if (loading) return 'abort'
  if (String(query || '').length > 0) return 'clear'
  return 'blur'
}
