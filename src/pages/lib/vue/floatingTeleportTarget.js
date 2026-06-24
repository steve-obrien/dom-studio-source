/**
 * Resolve the safest target for Vue Teleport-based floating UI.
 *
 * Floating controls normally portal to the document body so they can escape
 * local overflow. Native modal dialogs make the rest of the document inert, so
 * a body-level portal opened from inside `dom-dialog` can be mistaken for a
 * backdrop click. Targeting the nearest dialog host keeps the floating panel in
 * the modal interaction tree while preserving document-level fallback behavior.
 *
 * @param {Element|null|undefined} source Element mounted inside the floating control.
 * @returns {Element|string} Teleport target element, or `'body'` before the DOM is available.
 */
export function resolveFloatingTeleportTarget(source) {
	const nearestDialog = typeof source?.closest === 'function'
		? source.closest('dom-dialog')
		: null;
	const ownerDocument = source?.ownerDocument || (typeof document !== 'undefined' ? document : null);
	return nearestDialog || ownerDocument?.body || 'body';
}
