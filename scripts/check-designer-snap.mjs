import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnapIndex, snapPosition, snapResize } from '../src/pages/designer/stage/snapGeometry.js';

test('stage centres and layer edges snap independently', () => {
	const index = createSnapIndex([{ left: 0, top: 0, width: 1000, height: 800 }, { left: 200, top: 300, width: 100, height: 100 }]);
	const result = snapPosition({ left: 453, top: 204, width: 100, height: 100 }, index);
	assert.equal(result.left, 450);
	assert.equal(result.top, 200);
	assert.equal(result.matches.x.target, 500);
	assert.equal(result.matches.y.target, 300);
});

test('screen-space thresholds scale with zoom and release without jitter', () => {
	const index = createSnapIndex([{ left: 500, top: 500, width: 0, height: 0 }]);
	const rect = { left: 479, top: 90, width: 0, height: 0 };
	const snapped = snapPosition(rect, index, 0.25);
	assert.equal(snapped.left, 500);
	assert.equal(snapPosition(rect, index, 1).left, 479);
	assert.equal(snapPosition({ ...rect, left: 469 }, index, 0.25, snapped.matches).left, 500);
	assert.equal(snapPosition({ ...rect, left: 459 }, index, 0.25, snapped.matches).left, 459);
	assert.equal(snapped.top, 90);
});

test('large target indexes deduplicate and choose nearest coordinates', () => {
	const rects = Array.from({ length: 10000 }, (_, i) => ({ left: i * 100, top: i * 100, width: 20, height: 20 }));
	const index = createSnapIndex([...rects, ...rects]);
	assert.equal(index.x.length, 30000);
	assert.equal(snapPosition({ left: 987614, top: -100, width: 0, height: 0 }, index).left, 987610);
	assert.deepEqual(snapPosition({ left: 10, top: 20, width: 50, height: 50 }, { x: [], y: [] }).matches, { x: null, y: null });
});


test('resizing snaps moving edges without shifting the fixed corner', () => {
	const index = createSnapIndex([{ left: 0, top: 0, width: 1000, height: 800 }, { left: 210, top: 300, width: 80, height: 100 }]);
	const result = snapResize({ left: 100, top: 100, width: 187, height: 197 }, index);
	assert.equal(result.left, 100);
	assert.equal(result.top, 100);
	assert.equal(result.width, 190);
	assert.equal(result.height, 200);
	assert.equal(result.matches.x.target, 290);
	assert.equal(result.matches.y.target, 300);
});

test('resize snaps to stage edges at zoom and retains minimum dimensions', () => {
	const index = createSnapIndex([{ left: 0, top: 0, width: 1000, height: 800 }]);
	const result = snapResize({ left: 100, top: 100, width: 880, height: 680 }, index, 0.25);
	assert.equal(result.width, 900);
	assert.equal(result.height, 700);
	const small = snapResize({ left: -5, top: -5, width: -100, height: -100 }, index, 0.25);
	assert.equal(small.width, 16);
	assert.equal(small.height, 16);
	assert.deepEqual(small.matches, { x: null, y: null });
});

test('all eight handles preserve opposite edges and constrain midpoint axes', async () => {
	const { resizeBounds } = await import('../src/pages/designer/stage/resizeGeometry.js');
	const rect = { left: 100, top: 200, width: 300, height: 400 };
	for (const handle of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
		const result = resizeBounds(rect, handle, 20, 30);
		if (handle.includes('w')) assert.equal(result.left + result.width, 400);
		else assert.equal(result.left, 100);
		if (handle.includes('n')) assert.equal(result.top + result.height, 600);
		else assert.equal(result.top, 200);
		assert.equal(result.width, handle.includes('w') ? 280 : handle.includes('e') ? 320 : 300);
		assert.equal(result.height, handle.includes('n') ? 370 : handle.includes('s') ? 430 : 400);
	}
	assert.deepEqual(resizeBounds(rect, 'nw', 999, 999), { left: 384, top: 584, width: 16, height: 16 });
});

test('top-left snapping moves the origin and midpoint snapping leaves the other axis untouched', () => {
	const index = createSnapIndex([{ left: 0, top: 0, width: 1000, height: 800 }]);
	const result = snapResize({ left: 3, top: 4, width: 197, height: 196 }, index, 1, {}, 16, 'nw');
	assert.deepEqual([result.left, result.top, result.width, result.height], [0, 0, 200, 200]);
	const edge = snapResize({ left: 3, top: 4, width: 197, height: 196 }, index, 1, {}, 16, 'w');
	assert.deepEqual([edge.left, edge.top, edge.width, edge.height], [0, 4, 200, 196]);
	assert.equal(edge.matches.y, null);
});
