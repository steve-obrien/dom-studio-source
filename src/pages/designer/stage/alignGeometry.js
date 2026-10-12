/**
 * Alignment and distribution for selected layers.
 *
 * Rectangles are `{ id, left, top, width, height }` in one coordinate space.
 * Each function returns new rectangles; callers turn the changed positions into
 * their own edits, so the same maths serves any editor.
 */

/** The smallest rectangle containing every input rectangle. */
export function boundsOf(rects) {
	if (!rects.length) return { left: 0, top: 0, width: 0, height: 0 };
	const left = Math.min(...rects.map((rect) => rect.left));
	const top = Math.min(...rects.map((rect) => rect.top));
	const right = Math.max(...rects.map((rect) => rect.left + rect.width));
	const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
	return { left, top, width: right - left, height: bottom - top };
}

/**
 * Aligns rectangles to an edge or centre line of `bounds`.
 *
 * With one rectangle, pass the frame as `bounds` to align within it. With
 * several, the default bounds are the selection's own, as in Figma.
 *
 * @param {Array<object>} rects Rectangles.
 * @param {'left'|'center'|'right'|'top'|'middle'|'bottom'} alignment Target line.
 * @param {object} [bounds] Rectangle to align against.
 * @returns {Array<object>} Aligned rectangles, rounded to whole pixels.
 */
export function alignRects(rects, alignment, bounds = boundsOf(rects)) {
	return rects.map((rect) => {
		const next = { ...rect };
		if (alignment === 'left') next.left = bounds.left;
		if (alignment === 'center') next.left = bounds.left + (bounds.width - rect.width) / 2;
		if (alignment === 'right') next.left = bounds.left + bounds.width - rect.width;
		if (alignment === 'top') next.top = bounds.top;
		if (alignment === 'middle') next.top = bounds.top + (bounds.height - rect.height) / 2;
		if (alignment === 'bottom') next.top = bounds.top + bounds.height - rect.height;
		next.left = Math.round(next.left);
		next.top = Math.round(next.top);
		return next;
	});
}

/**
 * Spaces rectangles with equal gaps along one axis. The first and last
 * rectangles stay where they are; the rest move between them in order.
 *
 * @param {Array<object>} rects Rectangles; three or more change anything.
 * @param {'horizontal'|'vertical'} axis Distribution axis.
 * @returns {Array<object>} Distributed rectangles, in the input order.
 */
export function distributeRects(rects, axis) {
	if (rects.length < 3) return rects.map((rect) => ({ ...rect }));
	const [start, size] = axis === 'vertical' ? ['top', 'height'] : ['left', 'width'];
	const sorted = [...rects].sort((a, b) => a[start] - b[start] || a[size] - b[size]);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	const occupied = sorted.reduce((sum, rect) => sum + rect[size], 0);
	const gap = (last[start] + last[size] - first[start] - occupied) / (sorted.length - 1);
	const placed = new Map();
	let cursor = first[start];
	for (const rect of sorted) {
		placed.set(rect, Math.round(cursor));
		cursor += rect[size] + gap;
	}
	return rects.map((rect) => ({ ...rect, [start]: placed.get(rect) }));
}
