const SIDE_OPTIONS = ['top', 'right', 'bottom', 'left'];
const ALIGN_OPTIONS = ['start', 'center', 'end'];
const FLOATING_MODES = ['viewport', 'anchor'];

/**
 * @typedef {'top' | 'right' | 'bottom' | 'left'} FloatingSide
 */

/**
 * @typedef {'start' | 'center' | 'end' | 'left' | 'right'} FloatingAlign
 */

/**
 * @typedef {'viewport' | 'anchor' | 'element'} FloatingMode
 *
 * `viewport` keeps the floating element inside the visible browser viewport by
 * flipping and shifting when it would collide. `anchor` keeps the element
 * attached to the requested side of the trigger, which is useful when a panel
 * should scroll with its local context. `element` is kept as a backwards
 * compatible alias for `anchor`.
 */

/**
 * @typedef {Object} FloatingPositionOptions
 * @property {`${FloatingSide}` | `${FloatingSide}-${'start' | 'center' | 'end'}`} [placement='bottom']
 * Preferred side and optional alignment, such as `bottom-start`, `top-end`, or
 * `right-center`.
 * @property {FloatingAlign} [align='start']
 * Fallback alignment when `placement` does not include one. `left` and `right`
 * are normalized to `start` and `end`.
 * @property {number} [offset=8]
 * Gap in CSS pixels between the reference element and the floating element.
 * @property {number} [padding=8]
 * Collision padding in CSS pixels between the floating element and viewport.
 * @property {FloatingMode} [mode='viewport']
 * Positioning mode. `viewport` enables default flip and shift behavior.
 * @property {FloatingMode} [floatingMode]
 * Attribute-friendly alias for `mode`.
 * @property {boolean} [flip]
 * Whether to move to the opposite side when there is more space there.
 * Defaults to true in `viewport` mode and false in `anchor` mode.
 * @property {boolean} [shift]
 * Whether to clamp coordinates inside the viewport bounds. Defaults to true in
 * `viewport` mode and false in `anchor` mode.
 * @property {'fixed' | 'absolute'} [strategy='fixed']
 * CSS positioning strategy used by `applyFloatingPosition`.
 */

/**
 * @typedef {Object} FloatingPositionResult
 * @property {number} x Final viewport x coordinate in CSS pixels.
 * @property {number} y Final viewport y coordinate in CSS pixels.
 * @property {'viewport' | 'anchor'} mode Normalized positioning mode.
 * @property {FloatingSide} side Resolved side after optional flipping.
 * @property {'start' | 'center' | 'end'} align Normalized alignment.
 * @property {string} placement Resolved placement name, such as `bottom-start`.
 * @property {boolean} flipped Whether the side changed from the requested side.
 * @property {Record<FloatingSide, number>} collision Overflow measured before shifting.
 * @property {FloatingSide[]} collisionSides Sides that collided before shifting.
 * @property {Record<FloatingSide, number>} overflow Remaining overflow after shifting.
 * @property {FloatingSide[]} overflowSides Sides still overflowing after shifting.
 * @property {number} availableWidth Viewport width available inside collision padding.
 * @property {number} availableHeight Space available on the resolved vertical side.
 */

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function normalizeAlign(value) {
	if (value === 'left') return 'start';
	if (value === 'right') return 'end';
	return ALIGN_OPTIONS.includes(value) ? value : 'start';
}

function normalizeMode(value) {
	if (value === 'element') return 'anchor';
	return FLOATING_MODES.includes(value) ? value : 'viewport';
}

function parsePlacement(placement = 'bottom', align = 'start') {
	const [rawSide, rawAlign] = String(placement).split('-');
	return {
		side: SIDE_OPTIONS.includes(rawSide) ? rawSide : 'bottom',
		align: normalizeAlign(rawAlign || align),
	};
}

function oppositeSide(side) {
	return {
		top: 'bottom',
		right: 'left',
		bottom: 'top',
		left: 'right',
	}[side] || 'bottom';
}

function getViewportRect(padding) {
	const viewport = window.visualViewport;
	const left = viewport ? viewport.offsetLeft : 0;
	const top = viewport ? viewport.offsetTop : 0;
	const width = viewport ? viewport.width : window.innerWidth;
	const height = viewport ? viewport.height : window.innerHeight;

	return {
		top: top + padding,
		right: left + width - padding,
		bottom: top + height - padding,
		left: left + padding,
	};
}

function overflowFor(x, y, width, height, bounds) {
	return {
		top: Math.max(bounds.top - y, 0),
		right: Math.max((x + width) - bounds.right, 0),
		bottom: Math.max((y + height) - bounds.bottom, 0),
		left: Math.max(bounds.left - x, 0),
	};
}

function hasOverflow(overflow) {
	return Object.values(overflow).some((value) => value > 0);
}

function axisSpace(side, reference, bounds, offset) {
	if (side === 'top') return reference.top - bounds.top - offset;
	if (side === 'right') return bounds.right - reference.right - offset;
	if (side === 'bottom') return bounds.bottom - reference.bottom - offset;
	return reference.left - bounds.left - offset;
}

function baseCoords(side, align, reference, floating, offset) {
	let x = reference.left;
	let y = reference.bottom + offset;

	if (side === 'top') y = reference.top - floating.height - offset;
	if (side === 'right') x = reference.right + offset;
	if (side === 'left') x = reference.left - floating.width - offset;

	if (side === 'top' || side === 'bottom') {
		if (align === 'center') x = reference.left + (reference.width / 2) - (floating.width / 2);
		if (align === 'end') x = reference.right - floating.width;
	} else {
		y = reference.top;
		if (align === 'center') y = reference.top + (reference.height / 2) - (floating.height / 2);
		if (align === 'end') y = reference.bottom - floating.height;
	}

	return { x, y };
}

function getOverflowSides(overflow) {
	return Object.entries(overflow)
		.filter(([, value]) => value > 0)
		.map(([side]) => side);
}

function rectWithLayoutSize(element) {
	const rect = element.getBoundingClientRect();
	const width = element.offsetWidth || rect.width;
	const height = element.offsetHeight || rect.height;
	return {
		...rect,
		width,
		height,
		right: rect.left + width,
		bottom: rect.top + height,
	};
}

function arrowContainer(floatingEl) {
	return floatingEl.querySelector?.('.dom-popover-card') || floatingEl;
}

function getScrollParents(node) {
	const parents = [];
	let parent = node?.parentElement;

	while (parent && parent !== document.body) {
		const style = getComputedStyle(parent);
		const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`;
		if (/(auto|scroll|overlay|hidden|clip)/.test(overflow)) parents.push(parent);
		parent = parent.parentElement;
	}

	parents.push(window);
	return parents;
}

/**
 * Measure where a floating element should sit relative to a reference element.
 *
 * The calculation is deliberately DOM-only and framework-neutral. It handles
 * visual viewport offsets, viewport collision padding, optional side flipping,
 * optional coordinate shifting, and dimensions from layout size so panels that
 * have just moved into the top layer can still be measured accurately.
 *
 * Use this when you want coordinates and metadata but want to apply styles
 * yourself. Use `applyFloatingPosition` when you want the helper to write the
 * standard DOM Studio inline styles and data attributes for you.
 *
 * @param {Element} referenceEl The trigger, input, button, or anchor element.
 * @param {HTMLElement} floatingEl The panel, menu, tooltip, or listbox element.
 * @param {FloatingPositionOptions} [options]
 * @returns {FloatingPositionResult | null} Position metadata, or null outside the browser.
 */
export function computeFloatingPosition(referenceEl, floatingEl, options = {}) {
	if (!referenceEl || !floatingEl || typeof window === 'undefined') return null;

	const {
		placement = 'bottom',
		align = 'start',
		offset = 8,
		padding = 8,
		flip,
		shift,
	} = options;
	const mode = normalizeMode(options.mode || options.floatingMode);
	const shouldFlip = flip ?? mode === 'viewport';
	const shouldShift = shift ?? mode === 'viewport';
	const preferred = parsePlacement(placement, align);
	const bounds = getViewportRect(Number(padding) || 0);
	const reference = referenceEl.getBoundingClientRect();
	const floating = rectWithLayoutSize(floatingEl);
	let side = preferred.side;
	const resolvedAlign = preferred.align;

	let coords = baseCoords(side, resolvedAlign, reference, floating, Number(offset) || 0);
	const initialOverflow = overflowFor(coords.x, coords.y, floating.width, floating.height, bounds);

	if (shouldFlip && hasOverflow(initialOverflow)) {
		const opposite = oppositeSide(side);
		if (axisSpace(opposite, reference, bounds, Number(offset) || 0) > axisSpace(side, reference, bounds, Number(offset) || 0)) {
			side = opposite;
			coords = baseCoords(side, resolvedAlign, reference, floating, Number(offset) || 0);
		}
	}

	let x = coords.x;
	let y = coords.y;

	if (shouldShift) {
		x = clamp(x, bounds.left, Math.max(bounds.left, bounds.right - floating.width));
		y = clamp(y, bounds.top, Math.max(bounds.top, bounds.bottom - floating.height));
	}

	const overflow = overflowFor(x, y, floating.width, floating.height, bounds);
	const placementName = resolvedAlign === 'center' ? side : `${side}-${resolvedAlign}`;

	return {
		x,
		y,
		mode,
		side,
		align: resolvedAlign,
		placement: placementName,
		flipped: side !== preferred.side,
		collision: initialOverflow,
		collisionSides: getOverflowSides(initialOverflow),
		overflow,
		overflowSides: getOverflowSides(overflow),
		availableWidth: Math.max(bounds.right - bounds.left, 0),
		availableHeight: Math.max(side === 'top'
			? reference.top - bounds.top - (Number(offset) || 0)
			: side === 'bottom'
				? bounds.bottom - reference.bottom - (Number(offset) || 0)
				: bounds.bottom - bounds.top, 0),
	};
}

/**
 * Position a floating element and expose placement metadata through attributes.
 *
 * This writes `position`, `top`, `left`, CSS custom properties for available
 * size, popover arrow coordinates, and `data-*` attributes describing the final
 * placement. DOM Studio popover, dropdown, combobox, autocomplete, tooltip, and
 * menu surfaces all depend on this contract so styling can respond to placement
 * without duplicating JavaScript.
 *
 * @param {Element} referenceEl The element the panel is anchored to.
 * @param {HTMLElement} floatingEl The panel that should be moved.
 * @param {FloatingPositionOptions} [options]
 * @returns {FloatingPositionResult | null} The same result returned by `computeFloatingPosition`.
 */
export function applyFloatingPosition(referenceEl, floatingEl, options = {}) {
	const result = computeFloatingPosition(referenceEl, floatingEl, options);
	if (!result) return null;

	floatingEl.style.position = options.strategy || 'fixed';
	floatingEl.style.top = `${Math.round(result.y)}px`;
	floatingEl.style.left = `${Math.round(result.x)}px`;
	floatingEl.style.right = 'auto';
	floatingEl.style.bottom = 'auto';
	floatingEl.style.margin = '0';
	floatingEl.style.transform = '';
	floatingEl.style.setProperty('--dom-floating-available-width', `${Math.round(result.availableWidth)}px`);
	floatingEl.style.setProperty('--dom-floating-available-height', `${Math.round(result.availableHeight)}px`);
	const reference = referenceEl.getBoundingClientRect();
	const arrowBox = arrowContainer(floatingEl);
	const arrowOffsetX = arrowBox === floatingEl ? 0 : arrowBox.offsetLeft || 0;
	const arrowOffsetY = arrowBox === floatingEl ? 0 : arrowBox.offsetTop || 0;
	const arrowWidth = arrowBox.offsetWidth || floatingEl.offsetWidth || floatingEl.getBoundingClientRect().width;
	const arrowHeight = arrowBox.offsetHeight || floatingEl.offsetHeight || floatingEl.getBoundingClientRect().height;
	floatingEl.style.setProperty('--dom-popover-arrow-x', `${Math.round(clamp(
		(reference.left + (reference.width / 2)) - result.x - arrowOffsetX,
		14,
		Math.max(14, arrowWidth - 14),
	))}px`);
	floatingEl.style.setProperty('--dom-popover-arrow-y', `${Math.round(clamp(
		(reference.top + (reference.height / 2)) - result.y - arrowOffsetY,
		14,
		Math.max(14, arrowHeight - 14),
	))}px`);
	floatingEl.dataset.placement = result.placement;
	floatingEl.dataset.floatingMode = result.mode;
	floatingEl.dataset.side = result.side;
	floatingEl.dataset.align = result.align;
	floatingEl.toggleAttribute('data-flipped', result.flipped);

	for (const side of SIDE_OPTIONS) {
		floatingEl.toggleAttribute(`data-collision-${side}`, result.collision[side] > 0);
		floatingEl.toggleAttribute(`data-overflow-${side}`, result.overflow[side] > 0);
	}

	return result;
}

/**
 * Re-run a positioning callback when layout conditions change.
 *
 * The helper watches scroll parents for both the anchor and panel, browser
 * resize, visual viewport movement, and element resize. Updates are batched in
 * `requestAnimationFrame` so rapid scroll and resize bursts only trigger one
 * positioning pass per frame.
 *
 * @param {Element} referenceEl The element used as the positioning anchor.
 * @param {HTMLElement} floatingEl The floating panel being observed.
 * @param {() => void} update Callback that recomputes or reapplies position.
 * @returns {() => void} Cleanup function that removes listeners and observers.
 */
export function autoUpdateFloating(referenceEl, floatingEl, update) {
	if (!referenceEl || !floatingEl || typeof window === 'undefined') return () => {};

	let frame = 0;
	const requestUpdate = () => {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			update();
		});
	};
	const parents = new Set([
		...getScrollParents(referenceEl),
		...getScrollParents(floatingEl),
	]);
	const viewport = window.visualViewport;
	const resizeObserver = 'ResizeObserver' in window
		? new ResizeObserver(requestUpdate)
		: null;

	for (const parent of parents) parent.addEventListener('scroll', requestUpdate, { passive: true });
	window.addEventListener('resize', requestUpdate);
	viewport?.addEventListener('resize', requestUpdate);
	viewport?.addEventListener('scroll', requestUpdate);
	resizeObserver?.observe(referenceEl);
	resizeObserver?.observe(floatingEl);
	requestUpdate();

	return () => {
		if (frame) cancelAnimationFrame(frame);
		for (const parent of parents) parent.removeEventListener('scroll', requestUpdate);
		window.removeEventListener('resize', requestUpdate);
		viewport?.removeEventListener('resize', requestUpdate);
		viewport?.removeEventListener('scroll', requestUpdate);
		resizeObserver?.disconnect();
	};
}
