/**
 * Resolve the safest target for Vue Teleport-based floating UI.
 *
 * Floating controls normally portal to the document body so they can escape
 * local overflow. Modal dialogs and drawers make the rest of the document
 * inert, so a body-level portal can be mistaken for a backdrop click. Targeting
 * the nearest modal interaction tree keeps the floating panel inside the focus
 * trap while preserving document-level fallback behavior.
 *
 * @param {Element|null|undefined} source Element mounted inside the floating control.
 * @returns {Element|string} Teleport target element, or `'body'` before the DOM is available.
 */
export function resolveFloatingTeleportTarget(source) {
	const nearestDialog = typeof source?.closest === 'function'
		? source.closest('dom-dialog')
		: null;
	const nearestDrawer = typeof source?.closest === 'function'
		? source.closest('dom-drawer')
		: null;
	const drawerPanel = nearestDrawer?.querySelector?.('[data-panel]') || null;
	const ownerDocument = source?.ownerDocument || (typeof document !== 'undefined' ? document : null);
	return nearestDialog || drawerPanel || nearestDrawer || ownerDocument?.body || 'body';
}
