/** Returns the nearer forward neighbour, with stable ordering for equal starts. */
function nearer(a, b) {
	if (!a) return b;
	if (!b) return a;
	return a.start <= b.start ? a : b;
}

/**
 * Finds adjacent, non-overlapping pairs sharing a perpendicular interval.
 * An offline sweep and interval minimum tree avoid enumerating all layer pairs:
 * O(n log n) construction, with at most one forward neighbour per layer/axis.
 */
function adjacentPairs(rects, axis) {
	const items = rects.map((rect) => axis === 'x'
		? { start: rect.left, end: rect.left + rect.width, low: rect.top, high: rect.top + rect.height }
		: { start: rect.top, end: rect.top + rect.height, low: rect.left, high: rect.left + rect.width });
	const points = [...new Set(items.flatMap((item) => [item.low, item.high]))].sort((a, b) => a - b);
	const positions = new Map(points.map((point, index) => [point, index]));
	const count = points.length - 1;
	if (count < 1) return [];
	const best = [];
	const cover = [];
	/** Adds a candidate across its perpendicular interval without visiting individual slots. */
	function insert(node, low, high, from, to, item) {
		if (to < low || from > high) return;
		best[node] = nearer(best[node], item);
		if (from <= low && to >= high) { cover[node] = nearer(cover[node], item); return; }
		const middle = (low + high) >>> 1;
		insert(node * 2, low, middle, from, to, item);
		insert(node * 2 + 1, middle + 1, high, from, to, item);
	}
	/** Queries the nearest candidate overlapping any part of the requested interval. */
	function query(node, low, high, from, to) {
		if (to < low || from > high) return null;
		if (from <= low && to >= high) return best[node];
		const middle = (low + high) >>> 1;
		return nearer(cover[node], nearer(query(node * 2, low, middle, from, to), query(node * 2 + 1, middle + 1, high, from, to)));
	}
	const starts = [...items].sort((a, b) => b.start - a.start);
	const ends = [...items].sort((a, b) => b.end - a.end);
	const pairs = [];
	let cursor = 0;
	for (const item of ends) {
		while (cursor < starts.length && starts[cursor].start >= item.end) {
			const next = starts[cursor++];
			insert(1, 0, count - 1, positions.get(next.low), positions.get(next.high) - 1, next);
		}
		const next = query(1, 0, count - 1, positions.get(item.low), positions.get(item.high) - 1);
		if (next && next.start > item.end) pairs.push([item, next]);
	}
	return pairs;
}

/**
 * Snapshots repeated-gap extension targets from visible peer layers only.
 * The stage and dragged layer must not be passed in. Targets remain immutable
 * for the gesture; before-pair targets use the moving trailing edge, after-pair
 * targets use its leading edge, so different layer sizes work naturally.
 */
export function createSpacingIndex(rects) {
	const valid = rects.filter((r) => [r.left, r.top, r.width, r.height].every(Number.isFinite) && r.width > 0 && r.height > 0);
	const index = {};
	for (const axis of ['x', 'y']) {
		const before = [];
		const after = [];
		for (const [a, b] of adjacentPairs(valid, axis)) {
			const gap = b.start - a.end;
			const shared = { kind: 'spacing', gap, low: Math.max(a.low, b.low), high: Math.min(a.high, b.high), reference: [a.end, b.start] };
			before.push({ ...shared, target: a.start - gap, anchor: 2, neighbour: a.start });
			after.push({ ...shared, target: b.end + gap, anchor: 0, neighbour: b.end });
		}
		index[axis] = [after.sort((a, b) => a.target - b.target), before.sort((a, b) => a.target - b.target)];
	}
	return index;
}

/** Returns the first target not below a search boundary. */
function lowerBound(targets, value) {
	let low = 0;
	let high = targets.length;
	while (low < high) {
		const middle = (low + high) >>> 1;
		if (targets[middle].target < value) low = middle + 1;
		else high = middle;
	}
	return low;
}

/** Requires the moving layer to share the pair's row or column, not merely a remote gap value. */
function overlaps(match, low, high) {
	return Math.min(match.high, high) > Math.max(match.low, low);
}

/** Resolves one translation axis with six-pixel acquisition and ten-pixel release at any zoom. */
function resolveAxis(start, size, low, high, targets, threshold, previous) {
	let match = null;
	let distance = threshold;
	if (previous?.kind === 'spacing' && overlaps(previous, low, high)
		&& Math.abs(previous.target - start - (previous.anchor === 2 ? size : 0)) <= threshold * 5 / 3) match = previous;
	if (!match) {
		for (let side = 0; side < 2; side++) {
			const value = start + (side ? size : 0);
			const list = targets[side];
			for (let i = lowerBound(list, value - threshold); i < list.length && list[i].target <= value + threshold; i++) {
				const candidate = list[i];
				const delta = Math.abs(candidate.target - value);
				if (delta <= distance && overlaps(candidate, low, high)) { match = candidate; distance = delta; }
			}
		}
	}
	if (!match) return { position: start, match: null };
	return {
		position: match.target - (match.anchor === 2 ? size : 0),
		match: { ...match, cross: (Math.max(match.low, low) + Math.min(match.high, high)) / 2 },
	};
}

/** Fills only unlocked translation axes; alignment matches always keep precedence. */
export function snapSpacing(rect, index, scale = 1, previous = {}, locked = {}) {
	const threshold = 6 / Math.max(scale, 0.001);
	const x = locked.x ? { position: rect.left, match: null } : resolveAxis(rect.left, rect.width, rect.top, rect.top + rect.height, index.x, threshold, previous.x);
	const y = locked.y ? { position: rect.top, match: null } : resolveAxis(rect.top, rect.height, rect.left, rect.left + rect.width, index.y, threshold, previous.y);
	// A correction on the other axis must not take this layer out of the matched row/column.
	if (x.match && !overlaps(x.match, y.position, y.position + rect.height)) { x.position = rect.left; x.match = null; }
	if (y.match && !overlaps(y.match, x.position, x.position + rect.width)) { y.position = rect.top; y.match = null; }
	if (x.match) x.match.cross = (Math.max(x.match.low, y.position) + Math.min(x.match.high, y.position + rect.height)) / 2;
	if (y.match) y.match.cross = (Math.max(y.match.low, x.position) + Math.min(y.match.high, x.position + rect.width)) / 2;
	return { left: x.position, top: y.position, matches: { x: x.match, y: y.match } };
}
