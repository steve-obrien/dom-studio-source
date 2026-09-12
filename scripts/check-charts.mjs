import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chartColor, chartNumber, chartPoints, chartSeries, formatChartValue, percentagePoints } from '../src/pages/charts/_shared/chartUtils.js';
import { comparisonRange, dateRangePresets, dateStamp, rangeError } from '../src/pages/charts/date-range-picker/dateRange.js';

test('missing measurements never become zero', () => {
	for (const value of [null, undefined, '', ' ', false, true, [], {}, NaN, Infinity, 'invalid']) assert.equal(chartNumber(value), undefined);
	assert.equal(chartNumber(0), 0);
	assert.equal(chartNumber('0'), 0);
	assert.equal(chartNumber(-12.5), -12.5);
	assert.equal(formatChartValue(null), '—');
	assert.equal(formatChartValue(0), '0');
	assert.equal(formatChartValue(0.25, { format: 'percent' }), '25%');
});

test('continuous charts preserve records and proportional, sorted coordinates', () => {
	const rows = Object.freeze([Object.freeze({ date: '2026-09-10', value: 0 }), Object.freeze({ date: '2026-09-01', value: null }), Object.freeze({ date: 'bad', value: 12 })]);
	const points = chartPoints(rows, 'date', 'time', chartSeries(['value']));
	assert.equal(points.length, 2);
	assert.equal(points[0].row, rows[1]);
	assert.equal(points[0].index, 1);
	assert.equal(points[0].values.value, undefined);
	assert.equal(points[1].values.value, 0);
	assert.equal(points[1].x - points[0].x, 9 * 86400000);
	assert.equal(chartPoints([{ date: null, value: 10 }], 'date', 'time', chartSeries(['value'])).length, 0);
});

test('series colours remain stable when order or visibility changes', () => {
	const before = chartSeries(['revenue', 'cost']);
	const after = chartSeries(['cost', 'revenue']);
	assert.equal(before[0].color, after[1].color);
	assert.equal(chartColor('revenue', 'primary'), 'var(--primary)');
	assert.equal(chartColor('revenue', 'var(--custom)'), 'var(--custom)');
	assert.equal(chartSeries(['revenue', 'revenue']).length, 1);
});

test('percentage stacks normalize visible values and retain zero and missing states', () => {
	const series = chartSeries(['first', 'second', 'missing']);
	const points = chartPoints([{ x: 'A', first: 10, second: 30 }, { x: 'B', first: 0, second: 0 }], 'x', 'category', series);
	const normalized = percentagePoints(points, series);
	assert.deepEqual(normalized[0].values, { first: 25, second: 75, missing: undefined });
	assert.deepEqual(normalized[1].values, { first: 0, second: 0, missing: undefined });
	assert.equal(points[0].values.first, 10);
	assert.equal(percentagePoints(points, series.slice(0, 1))[0].values.first, 100);
});

test('range validation rejects reversed, out-of-bounds, and impossible dates', () => {
	assert.equal(dateStamp('2026-02-29'), null);
	assert.notEqual(dateStamp('2024-02-29'), null);
	assert.ok(rangeError({ start: '2026-09-10', end: '2026-09-01' }));
	assert.ok(rangeError({ start: '2026-09-01', end: '2026-09-30' }, '2026-09-10'));
	assert.ok(rangeError({ start: '2026-09-01', end: '2026-09-30' }, '', '2026-09-20'));
	assert.equal(rangeError({ start: '2026-09-01', end: '2026-09-01' }), '');
});

test('reporting presets cross month, year, and daylight-saving boundaries', () => {
	const presets = dateRangePresets('2026-01-03');
	assert.deepEqual(presets[0], { label: 'Last 7 days', start: '2025-12-28', end: '2026-01-03' });
	assert.deepEqual(presets[3], { label: 'Last month', start: '2025-12-01', end: '2025-12-31' });
	assert.equal(dateRangePresets('2026-03-31')[0].start, '2026-03-25');
	assert.equal(dateRangePresets('2024-03-01')[3].end, '2024-02-29');
});

test('comparisons preserve inclusive length and clamp leap days', () => {
	assert.deepEqual(comparisonRange({ start: '2026-09-01', end: '2026-09-30' }, 'previous-period'), { start: '2026-08-02', end: '2026-08-31' });
	assert.deepEqual(comparisonRange({ start: '2024-02-29', end: '2024-03-01' }, 'previous-year'), { start: '2023-02-28', end: '2023-03-01' });
	assert.equal(comparisonRange({ start: '2026-09-01', end: '2026-09-30' }, 'none'), null);
});
