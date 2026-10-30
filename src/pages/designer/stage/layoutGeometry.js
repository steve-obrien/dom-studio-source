import { createFrameLayout } from '../frame/frameLayout.js';

/**
 * Layout geometry shared by every editor: measuring layers, alignment,
 * distribution and spacing.
 *
 * Rectangles are `{ id, left, top, width, height }` in one coordinate space.
 * Each function returns new rectangles; callers turn the changed positions into
 * their own edits, so the same maths serves any editor. useLayoutGeometry
 * applies them to a designer document.
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

/** A frame's box inside its padding: `bounds` is `{ width, height }`, `padding` one number or a frame layout with per-side padding. */
export function innerBounds(bounds, padding = 0) {
	const inset = typeof padding === 'object' && padding ? createFrameLayout(padding) : createFrameLayout({ padding });
	return {
		left: inset.paddingLeft,
		top: inset.paddingTop,
		width: bounds.width - inset.paddingLeft - inset.paddingRight,
		height: bounds.height - inset.paddingTop - inset.paddingBottom,
	};
}

/**
 * Aligns a child against its frame's padded inner bounds. `padding` is one
 * number for every side, or a frame layout with per-side padding.
 */
export function alignFrameChild(rect, bounds, alignment, padding = 0) {
	return alignRects([rect], alignment, innerBounds(bounds, padding))[0];
}

/** Places children in their existing visual order with an explicit horizontal or vertical gap. */
export function spaceFrameChildren(rects, axis, gap) {
	const key = axis === 'x' ? 'left' : 'top';
	const size = axis === 'x' ? 'width' : 'height';
	const ordered = rects.map((rect, index) => ({ ...rect, index })).sort((a, b) => a[key] - b[key]);
	let cursor = ordered[0]?.[key] || 0;
	const result = rects.map((rect) => ({ ...rect }));
	for (const rect of ordered) {
		result[rect.index][key] = cursor;
		cursor += rect[size] + Math.max(0, Number(gap) || 0);
	}
	return result;
}

/** Measures a child in its containing frame's CSS pixels, accounting for borders, scrolling and any scale on the frame. */
export function measureFrameChild(element, frame) {
	const rect = element.getBoundingClientRect();
	const parent = frame.getBoundingClientRect();
	const scale = parent.width / frame.offsetWidth || 1;
	return {
		left: (rect.left - parent.left) / scale - frame.clientLeft + frame.scrollLeft,
		top: (rect.top - parent.top) / scale - frame.clientTop + frame.scrollTop,
		width: rect.width / scale,
		height: rect.height / scale,
	};
}
