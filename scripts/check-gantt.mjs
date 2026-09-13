import assert from 'node:assert/strict';
import test from 'node:test';
import { createGanttAxis, ganttDateToX, ganttXToDate, layoutGanttRows, moveGanttSpan, parseGanttDate, resizeGanttSpan, resolveGanttSpan } from '../src/pages/data/gantt/ganttTime.js';

process.env.TZ = 'Europe/London';
const fields = { rowKey: 'id', rowLabelKey: 'name', itemKey: 'id', itemRowKey: 'rowId', titleKey: 'title', startKey: 'startDate', endKey: 'endDate', durationKey: 'duration', durationUnit: 'days', toneKey: 'tone' };

test('date-only input stays at local midnight and malformed spans are omitted', () => {
	assert.equal(parseGanttDate('2026-07-20').getHours(), 0);
	assert.equal(parseGanttDate('2026-02-30'), null);
	assert.equal(parseGanttDate(false), null);
	for (const item of [
		{ duration: 3 },
		{ startDate: '2026-07-20', duration: 0 },
		{ startDate: '2026-07-20', duration: -1 },
		{ startDate: '2026-07-20', duration: 1.5 },
		{ startDate: '2026-07-20', endDate: 'bad', duration: 3 },
		{ startDate: '2026-07-20', endDate: '2026-07-19' },
	]) assert.equal(resolveGanttSpan(item, fields), null);
});

test('explicit end wins and elapsed-hour durations can be fractional', () => {
	const span = resolveGanttSpan({ startDate: '2026-09-14', endDate: '2026-09-16', duration: 20 }, fields);
	assert.equal(span.end - span.start, 48 * 3600000);
	const short = resolveGanttSpan({ startDate: '2026-09-14T09:00', duration: 1.5 }, { ...fields, durationUnit: 'hours' });
	assert.equal(short.end - short.start, 90 * 60000);
});

test('calendar duration and hourly axis respect spring and autumn DST', () => {
	for (const [date, hours] of [['2026-03-29', 23], ['2026-10-25', 25]]) {
		const span = resolveGanttSpan({ startDate: date, duration: 1 }, fields);
		assert.equal(span.end - span.start, hours * 3600000);
		const axis = createGanttAxis({ startDate: date, days: 1, zoom: 'days' });
		assert.equal(axis.cells.length, hours);
		assert.equal(ganttXToDate(axis, axis.width, 'end'), span.end);
		for (const cell of axis.cells) assert.equal(ganttXToDate(axis, ganttDateToX(axis, cell.start + 1800000)), cell.start + 1800000);
	}
});

test('hidden nights and weekends preserve distinct start and end boundaries', () => {
	const axis = createGanttAxis({ startDate: '2026-09-11', days: 4, zoom: 'days', workingHours: [6, 18], hideNonWorkingHours: true, hideWeekends: true });
	assert.equal(axis.cells.length, 24);
	const fridayEnd = +new Date('2026-09-11T18:00');
	const mondayStart = +new Date('2026-09-14T06:00');
	assert.equal(ganttDateToX(axis, fridayEnd), 12 * 32);
	assert.equal(ganttDateToX(axis, mondayStart), 12 * 32);
	assert.equal(ganttXToDate(axis, 12 * 32, 'end'), fridayEnd);
	assert.equal(ganttXToDate(axis, 12 * 32, 'start'), mondayStart);
	assert.equal(ganttXToDate(axis, axis.width, 'end'), +new Date('2026-09-14T18:00'));
});

test('non-working periods remain valid and muted until explicitly hidden', () => {
	const axis = createGanttAxis({ startDate: '2026-09-11', days: 3, zoom: 'days', workingHours: [6, 18] });
	assert.equal(axis.cells.length, 72);
	assert.equal(axis.cells.filter((cell) => cell.muted).length, 60);
	assert.equal(ganttXToDate(axis, 24 * 32), +new Date('2026-09-12T00:00'));
	const custom = createGanttAxis({ startDate: '2026-09-11', days: 3, zoom: 'weeks', weekendDays: [5], hideWeekends: true });
	assert.equal(custom.cells.length, 2);
});

test('empty axes and clipped records produce no phantom items', () => {
	const axis = createGanttAxis({ startDate: '2026-09-12', days: 2, hideWeekends: true });
	assert.equal(axis.width, 0);
	assert.equal(ganttXToDate(axis, 0), null);
	const rows = layoutGanttRows([{ id: 0, name: 'Member' }], [{ id: 0, rowId: 0, startDate: '2026-09-12', duration: 2 }], fields, axis);
	assert.equal(rows[0].records.length, 0);
});

test('logical resolvers preserve zero ids and overlap lanes without mutating records', () => {
	const row = Object.freeze({ identity: 0, label: 'Maya' });
	const items = Object.freeze([
		Object.freeze({ id: 'later', person: 0, startDate: '2026-09-15', duration: 3 }),
		Object.freeze({ id: 'first', person: 0, startDate: '2026-09-14', duration: 2 }),
		Object.freeze({ id: 'next', person: 0, startDate: '2026-09-16', duration: 1 }),
	]);
	const axis = createGanttAxis({ startDate: '2026-09-14', days: 7 });
	const rows = layoutGanttRows([row], items, { ...fields, rowKey: (value) => value.identity, rowLabelKey: 'label', itemRowKey: 'person' }, axis);
	assert.equal(rows[0].row, row);
	assert.equal(rows[0].key, 0);
	assert.equal(rows[0].height, 96);
	assert.deepEqual(rows[0].records.map((record) => [record.key, record.top]), [['first', 12], ['later', 48], ['next', 12]]);
	assert.equal(items[0].id, 'later');
});

test('items wholly hidden are omitted and spans across omitted dates remain continuous', () => {
	const axis = createGanttAxis({ startDate: '2026-09-11', days: 4, hideWeekends: true });
	const items = [
		{ id: 'weekend', rowId: 1, startDate: '2026-09-12', duration: 2 },
		{ id: 'across', rowId: 1, startDate: '2026-09-11', endDate: '2026-09-15' },
	];
	const row = layoutGanttRows([{ id: 1 }], items, fields, axis)[0];
	assert.equal(row.records.length, 1);
	assert.equal(row.records[0].width, 96);
	assert.equal(row.records[0].end - row.records[0].start, 4 * 86400000);
});

test('moving a partially visible item preserves its original grab offset and calendar endpoints', () => {
	const axis = createGanttAxis({ startDate: '2026-03-23', days: 14, zoom: 'weeks' });
	const span = Object.freeze({ start: +new Date('2026-03-27T09:15'), end: +new Date('2026-03-30T17:15') });
	const moved = moveGanttSpan(axis, span, 6 * 48, 2 * 48, 'weeks');
	assert.equal(moved.start, +new Date('2026-03-29T09:15'));
	assert.equal(moved.end, +new Date('2026-04-01T17:15'));
	const back = moveGanttSpan(axis, moved, 8 * 48, -2 * 48, 'weeks');
	assert.deepEqual(back, span);
});

test('moving across hidden weekends preserves a timed booking instead of consuming hidden time', () => {
	const axis = createGanttAxis({ startDate: '2026-09-11', days: 5, zoom: 'weeks', hideWeekends: true });
	const span = { start: +new Date('2026-09-11T09:00'), end: +new Date('2026-09-11T11:00') };
	const moved = moveGanttSpan(axis, span, 12, 48, 'weeks');
	assert.equal(moved.start, +new Date('2026-09-14T09:00'));
	assert.equal(moved.end, +new Date('2026-09-14T11:00'));
});

test('hourly moves cross omitted nights with elapsed duration and configurable snapping', () => {
	const axis = createGanttAxis({ startDate: '2026-09-11', days: 4, zoom: 'days', workingHours: [6, 18], hideWeekends: true, hideNonWorkingHours: true });
	const span = { start: +new Date('2026-09-11T17:00'), end: +new Date('2026-09-11T17:30') };
	const moved = moveGanttSpan(axis, span, 11 * 32, 32, 'days', 15);
	assert.equal(moved.start, +new Date('2026-09-14T06:00'));
	assert.equal(moved.end - moved.start, 30 * 60000);
	assert.deepEqual(moveGanttSpan(axis, span, 11 * 32, 3, 'days', 15), span);
	assert.equal(moveGanttSpan(axis, span, 11 * 32, 8, 'days', 15).start, +new Date('2026-09-11T17:15'));
});

test('right-edge resizing keeps the start fixed and clamps before zero or the axis end', () => {
	const axis = createGanttAxis({ startDate: '2026-09-07', days: 14, zoom: 'weeks' });
	const span = Object.freeze({ start: +new Date('2026-09-08'), end: +new Date('2026-09-11') });
	assert.deepEqual(resizeGanttSpan(axis, span, 96, 'weeks'), { start: span.start, end: +new Date('2026-09-13') });
	assert.deepEqual(resizeGanttSpan(axis, span, -48, 'weeks'), { start: span.start, end: +new Date('2026-09-10') });
	assert.equal(resizeGanttSpan(axis, span, -10000, 'weeks').end, +new Date('2026-09-09'));
	assert.equal(resizeGanttSpan(axis, span, 10000, 'weeks').end, +axis.end);
});

test('resizing uses an exclusive end at hidden-time boundaries without rewriting unchanged ends', () => {
	const axis = createGanttAxis({ startDate: '2026-09-11', days: 4, zoom: 'days', workingHours: [6, 18], hideWeekends: true, hideNonWorkingHours: true });
	const span = { start: +new Date('2026-09-11T16:00'), end: +new Date('2026-09-11T17:00') };
	assert.equal(resizeGanttSpan(axis, span, 32, 'days', 30).end, +new Date('2026-09-11T18:00'));
	assert.equal(resizeGanttSpan(axis, span, 48, 'days', 30).end, +new Date('2026-09-14T06:30'));
	const hiddenEnd = { ...span, end: +new Date('2026-09-12T00:00') };
	assert.deepEqual(resizeGanttSpan(axis, hiddenEnd, 0, 'days', 30), hiddenEnd);
});
