/**
 * Calculates a fixed-size virtual render window for either axis.
 *
 * The returned end index is exclusive so it can be passed directly to
 * `Array.prototype.slice()`. Callers can translate spacer item counts into
 * pixels for rows, columns, weeks, or any other fixed-size collection.
 *
 * @param {object} options Virtual-window inputs.
 * @param {number} options.itemCount Total number of available items.
 * @param {number} options.itemSize Fixed pixel size of one item.
 * @param {number} options.scrollOffset Current scroll offset on the virtualized axis.
 * @param {number} options.viewportSize Visible viewport size on the virtualized axis.
 * @param {number} [options.overscan] Extra items rendered before and after the visible window.
 * @returns {{
 *	startIndex: number,
 *	endIndex: number,
 *	firstVisibleIndex: number,
 *	lastVisibleIndex: number,
 *	renderedItems: number,
 *	totalItems: number,
 *	itemSize: number,
 *	overscan: number,
 *	viewportItems: number,
 *	beforeSpacerSize: number,
 *	afterSpacerSize: number,
 * }} Normalized render window and spacer measurements.
 */
export function calculateVirtualWindow({
	itemCount,
	itemSize,
	scrollOffset,
	viewportSize,
	overscan = 0,
}) {
	const totalItems = normalizeNonNegativeInteger(itemCount);
	const safeItemSize = normalizePositiveNumber(itemSize, 1);
	const safeScrollOffset = Math.max(0, normalizeFiniteNumber(scrollOffset, 0));
	const safeViewportSize = Math.max(0, normalizeFiniteNumber(viewportSize, 0));
	const safeOverscan = normalizeNonNegativeInteger(overscan);
	const viewportItems = Math.max(1, Math.ceil(safeViewportSize / safeItemSize));
	const firstVisibleIndex = Math.min(
		Math.max(0, totalItems - 1),
		Math.floor(safeScrollOffset / safeItemSize),
	);
	const lastVisibleIndex = totalItems
		? Math.min(totalItems - 1, firstVisibleIndex + viewportItems - 1)
		: -1;
	const startIndex = totalItems ? Math.max(0, firstVisibleIndex - safeOverscan) : 0;
	const endIndex = totalItems
		? Math.min(totalItems, firstVisibleIndex + viewportItems + safeOverscan)
		: 0;

	return {
		startIndex,
		endIndex,
		firstVisibleIndex: totalItems ? firstVisibleIndex : 0,
		lastVisibleIndex,
		renderedItems: Math.max(0, endIndex - startIndex),
		totalItems,
		itemSize: safeItemSize,
		overscan: safeOverscan,
		viewportItems,
		beforeSpacerSize: startIndex * safeItemSize,
		afterSpacerSize: Math.max(0, totalItems - endIndex) * safeItemSize,
	};
}

/**
 * Normalizes a value as a finite number.
 *
 * @param {unknown} value Candidate numeric value.
 * @param {number} fallback Value returned when the candidate is not finite.
 * @returns {number} Finite numeric value.
 */
function normalizeFiniteNumber(value, fallback) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

/**
 * Normalizes a value as a positive finite number.
 *
 * @param {unknown} value Candidate numeric value.
 * @param {number} fallback Value returned when the candidate is not positive.
 * @returns {number} Positive finite numeric value.
 */
function normalizePositiveNumber(value, fallback) {
	const number = normalizeFiniteNumber(value, fallback);
	return number > 0 ? number : fallback;
}

/**
 * Normalizes a value as a non-negative integer.
 *
 * @param {unknown} value Candidate numeric value.
 * @returns {number} Non-negative integer.
 */
function normalizeNonNegativeInteger(value) {
	const number = Math.floor(normalizeFiniteNumber(value, 0));
	return Math.max(0, number);
}
