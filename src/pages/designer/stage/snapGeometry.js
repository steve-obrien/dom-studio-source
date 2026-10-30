import { resizeBounds } from './resizeGeometry.js';

/** Builds sorted, deduplicated edge/centre indexes once per gesture in stage coordinates. */
export function createSnapIndex(rects) {
	return {
		x: [...new Set(rects.flatMap((r) => [r.left, r.left + r.width / 2, r.left + r.width]))].sort((a, b) => a - b),
		y: [...new Set(rects.flatMap((r) => [r.top, r.top + r.height / 2, r.top + r.height]))].sort((a, b) => a - b),
	};
}

/** Finds a nearest coordinate in logarithmic time without scanning all alignment targets. */
function nearest(values, value) {
	let low = 0;
	let high = values.length;
	while (low < high) {
		const middle = (low + high) >>> 1;
		if (values[middle] < value) low = middle + 1;
		else high = middle;
	}
	const before = values[low - 1];
	const after = values[low];
	if (before === undefined) return after;
	if (after === undefined) return before;
	return value - before <= after - value ? before : after;
}

/** Resolves one axis, retaining its active anchor until the larger release threshold is crossed. */
function snapAxis(start, size, targets, threshold, previous) {
	const anchors = [start, start + size / 2, start + size];
	if (previous && Math.abs(previous.target - anchors[previous.anchor]) <= threshold * 5 / 3) {
		return { delta: previous.target - anchors[previous.anchor], match: previous };
	}
	let best = { delta: 0, match: null };
	let distance = threshold;
	for (let anchor = 0; anchor < anchors.length; anchor++) {
		const target = nearest(targets, anchors[anchor]);
		if (target === undefined) continue;
		const delta = target - anchors[anchor];
		if (Math.abs(delta) <= distance) {
			distance = Math.abs(delta);
			best = { delta, match: { target, anchor } };
		}
	}
	return best;
}

/** Snaps translation independently on each axis; thresholds remain constant in screen pixels. */
export function snapPosition(rect, index, scale = 1, previous = {}) {
	const threshold = 6 / Math.max(scale, 0.001);
	const x = snapAxis(rect.left, rect.width, index.x, threshold, previous.x);
	const y = snapAxis(rect.top, rect.height, index.y, threshold, previous.y);
	return { left: rect.left + x.delta, top: rect.top + y.delta, matches: { x: x.match, y: y.match } };
}

/** Snaps only the dragged edges, preserving opposite edges and rejecting sub-minimum matches. */
export function snapResize(rect, index, scale = 1, previous = {}, minimum = 16, handle = 'se') {
	const threshold = 6 / Math.max(scale, 0.001);
	const base = resizeBounds(rect, handle, 0, 0, minimum);
	const horizontal = handle.includes('w') || handle.includes('e');
	const vertical = handle.includes('n') || handle.includes('s');
	const x = horizontal ? snapAxis(base.left + (handle.includes('w') ? 0 : base.width), 0, index.x, threshold, previous.x) : { delta: 0, match: null };
	const y = vertical ? snapAxis(base.top + (handle.includes('n') ? 0 : base.height), 0, index.y, threshold, previous.y) : { delta: 0, match: null };
	const validX = base.width + (handle.includes('w') ? -x.delta : x.delta) >= minimum;
	const validY = base.height + (handle.includes('n') ? -y.delta : y.delta) >= minimum;
	return {
		...resizeBounds(base, handle, validX ? x.delta : 0, validY ? y.delta : 0, minimum),
		matches: { x: validX ? x.match : null, y: validY ? y.match : null },
	};
}
