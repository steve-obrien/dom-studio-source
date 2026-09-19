import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpacingIndex, snapSpacing } from '../src/pages/designer/stage/spacingGeometry.js';
import { createSnapIndex, snapPosition } from '../src/pages/designer/stage/snapGeometry.js';
import { snapTranslation } from '../src/pages/designer/stage/snapPipeline.js';

const pair = [{ left: 100, top: 100, width: 40, height: 40 }, { left: 150, top: 100, width: 60, height: 40 }];

test('extends a 10px horizontal gap on both sides with different moving widths', () => {
	const index = createSpacingIndex(pair);
	const right = snapSpacing({ left: 224, top: 110, width: 30, height: 20 }, index);
	assert.equal(right.left, 220);
	assert.equal(right.matches.x.gap, 10);
	assert.deepEqual(right.matches.x.reference, [140, 150]);
	const left = snapSpacing({ left: 64, top: 110, width: 30, height: 20 }, index);
	assert.equal(left.left, 60);
	assert.equal(left.matches.x.target, 90);
	assert.equal(left.top, 110);
});

test('extends vertical gaps above and below the pair', () => {
	const index = createSpacingIndex(pair.map((r) => ({ left: r.top, top: r.left, width: r.height, height: r.width })));
	assert.equal(snapSpacing({ left: 110, top: 224, width: 20, height: 30 }, index).top, 220);
	assert.equal(snapSpacing({ left: 110, top: 64, width: 20, height: 30 }, index).top, 60);
});

test('ignores overlapping, touching, empty and invalid layers and remote rows', () => {
	for (const rects of [[], [pair[0]], [pair[0], { ...pair[1], left: 130 }], [pair[0], { ...pair[1], left: 140 }], [pair[0], { ...pair[1], top: 140 }], [{ ...pair[0], width: NaN }]]) {
		assert.deepEqual(createSpacingIndex(rects).x, [[], []]);
	}
	const result = snapSpacing({ left: 224, top: 140, width: 30, height: 20 }, createSpacingIndex(pair));
	assert.equal(result.left, 224);
	assert.equal(result.matches.x, null);
});

test('chooses adjacent neighbours within the row rather than skipping nearer layers', () => {
	const index = createSpacingIndex([...pair, { left: 145, top: 200, width: 1, height: 10 }, { left: 300, top: 100, width: 40, height: 40 }]);
	assert.deepEqual(index.x[0].map((item) => item.gap), [10, 90]);
});

test('uses screen-space acquisition, hysteresis and clears when leaving the row', () => {
	const index = createSpacingIndex(pair);
	const rect = { left: 240, top: 110, width: 30, height: 20 };
	assert.equal(snapSpacing(rect, index).left, 240);
	const result = snapSpacing(rect, index, 0.25);
	assert.equal(result.left, 220);
	assert.equal(snapSpacing({ ...rect, left: 255 }, index, 0.25, result.matches).left, 220);
	assert.equal(snapSpacing({ ...rect, left: 261 }, index, 0.25, result.matches).left, 261);
	assert.equal(snapSpacing({ ...rect, top: 200 }, index, 0.25, result.matches).matches.x, null);
});

test('disabled spacing is identical to existing alignment, or no snapping at all', () => {
	const alignment = createSnapIndex(pair);
	const rect = { left: 224, top: 103, width: 30, height: 20 };
	assert.deepEqual(snapTranslation(rect, { alignment }), snapPosition(rect, alignment));
	assert.deepEqual(snapTranslation(rect, {}), { left: 224, top: 103, matches: { x: null, y: null } });
	assert.equal(snapTranslation(rect, { spacing: createSpacingIndex(pair) }).left, 220);
});

test('alignment has priority and spacing history cannot become an alignment anchor', () => {
	const spacing = createSpacingIndex(pair);
	const rect = { left: 224, top: 110, width: 30, height: 20 };
	const aligned = snapTranslation(rect, { alignment: { x: [225], y: [] }, spacing });
	assert.equal(aligned.left, 225);
	assert.notEqual(aligned.matches.x.kind, 'spacing');
	const previous = snapTranslation(rect, { spacing }).matches;
	assert.equal(snapTranslation({ ...rect, left: 229 }, { alignment: { x: [], y: [] } }, 1, previous).left, 229);
});

test('sweep agrees with a brute-force nearest-neighbour reference on varied layouts', () => {
	const rects = Array.from({ length: 90 }, (_, i) => ({ left: i * 13, top: (i * 71 % 193) + i / 1000, width: 7 + i % 20, height: 10 + i % 55 }));
	for (const axis of ['x', 'y']) {
		const horizontal = axis === 'x';
		const start = horizontal ? 'left' : 'top';
		const size = horizontal ? 'width' : 'height';
		const cross = horizontal ? 'top' : 'left';
		const crossSize = horizontal ? 'height' : 'width';
		const expected = [];
		for (const a of rects) {
			const b = rects.filter((r) => r[start] >= a[start] + a[size] && Math.min(r[cross] + r[crossSize], a[cross] + a[crossSize]) > Math.max(r[cross], a[cross])).sort((a, b) => a[start] - b[start])[0];
			if (b && b[start] > a[start] + a[size]) expected.push(b[start] + b[size] + b[start] - a[start] - a[size]);
		}
		const actual = createSpacingIndex(rects)[axis][0].map((item) => item.target);
		assert.equal(actual.length, expected.length);
		expected.sort((a, b) => a - b).forEach((value, i) => assert.ok(Math.abs(actual[i] - value) < 1e-8));
	}
});

test('large layouts produce linear-size indexes without changing source rectangles', () => {
	const rects = Array.from({ length: 10000 }, (_, i) => Object.freeze({ left: i * 50, top: 0, width: 40, height: 40 }));
	const index = createSpacingIndex(rects);
	assert.equal(index.x[0].length, 9999);
	assert.equal(index.x[1].length, 9999);
	assert.equal(index.y[0].length, 0);
	assert.equal(snapSpacing({ left: 500004, top: 0, width: 30, height: 40 }, index).left, 500000);
});
