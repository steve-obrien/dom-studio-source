import { resolveResourceKey, resolveResourceValue } from '../_shared/resourceRecord.js';

/**
 * Parses an instant or local calendar date without interpreting YYYY-MM-DD as UTC.
 * Invalid, missing, and overflowing calendar dates return null.
 * @param {unknown} value Date, timestamp, or ISO-compatible string.
 * @returns {Date|null} Independent valid date.
 */
export function parseGanttDate(value) {
	if (value === null || value === undefined || value === '') return null;
	let date;
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number);
		date = new Date(year, month - 1, day);
		if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	} else if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
		date = new Date(value);
	}
	return date && Number.isFinite(date.getTime()) ? date : null;
}

/**
 * Advances local calendar days, preserving wall-clock time across DST boundaries.
 * @param {Date} date Starting date.
 * @param {number} days Number of calendar days.
 * @returns {Date} Shifted copy.
 */
export function addGanttDays(date, days) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/**
 * Creates fixed-width visible cells; omitted time retains its original timestamps.
 * Hour cells follow elapsed time so DST days contain their actual 23 or 25 hours.
 * @param {object} options Range, zoom, workingHours, weekendDays, and hiding flags.
 * @returns {{cells: Array<object>, width: number, cellWidth: number, start: Date, end: Date}} Axis geometry.
 */
export function createGanttAxis(options) {
	const start = parseGanttDate(options.startDate) || new Date();
	start.setHours(0, 0, 0, 0);
	const days = Math.min(3660, Math.max(1, Math.floor(Number(options.days) || 84)));
	const end = addGanttDays(start, days);
	const hourly = options.zoom === 'days';
	const cellWidth = hourly ? 32 : options.zoom === 'months' ? 14 : 48;
	const workingHours = options.workingHours || [6, 18];
	const hourStart = Math.max(0, Math.min(23, Number(workingHours[0]) || 0));
	const hourEnd = Math.max(hourStart + 1, Math.min(24, Number(workingHours[1]) || 24));
	const weekends = Array.isArray(options.weekendDays) ? options.weekendDays : [0, 6];
	const cells = [];
	for (let day = start; day < end; day = addGanttDays(day, 1)) {
		const weekend = weekends.includes(day.getDay());
		if (weekend && options.hideWeekends) continue;
		const nextDay = addGanttDays(day, 1);
		for (let cursor = day; cursor < nextDay;) {
			const next = hourly ? new Date(Math.min(+cursor + 3600000, +nextDay)) : nextDay;
			const outsideHours = hourly && (cursor.getHours() < hourStart || cursor.getHours() >= hourEnd);
			if (!(outsideHours && options.hideNonWorkingHours)) {
				cells.push({ start: +cursor, end: +next, left: cells.length * cellWidth, width: cellWidth, muted: weekend || outsideHours });
			}
			cursor = next;
		}
	}
	return { cells, width: cells.length * cellWidth, cellWidth, start, end };
}

/**
 * Maps an instant to compressed-axis pixels. Hidden periods map to their boundary.
 * @param {object} axis Result of createGanttAxis.
 * @param {number|Date} value Instant to locate.
 * @returns {number} Clamped horizontal coordinate.
 */
export function ganttDateToX(axis, value) {
	const time = +value;
	let low = 0;
	let high = axis.cells.length;
	while (low < high) {
		const middle = (low + high) >> 1;
		if (axis.cells[middle].end <= time) low = middle + 1;
		else high = middle;
	}
	const cell = axis.cells[low];
	if (!cell) return axis.width;
	return cell.left + Math.max(0, (time - cell.start) / (cell.end - cell.start)) * cell.width;
}

/**
 * Converts pixels back into real time, distinguishing range starts from ends at a gap.
 * @param {object} axis Visible axis.
 * @param {number} x Horizontal coordinate.
 * @param {'start'|'end'} edge Boundary bias at omitted periods.
 * @returns {number|null} Timestamp, or null for an empty axis.
 */
export function ganttXToDate(axis, x, edge = 'start') {
	if (!axis.cells.length) return null;
	const bounded = Math.max(0, Math.min(axis.width, x));
	const index = Math.min(axis.cells.length - 1, Math.max(0, edge === 'end' ? Math.ceil(bounded / axis.cellWidth) - 1 : Math.floor(bounded / axis.cellWidth)));
	const cell = axis.cells[index];
	return cell.start + ((bounded - cell.left) / cell.width) * (cell.end - cell.start);
}

/**
 * Resolves an item span. Explicit ends take precedence; durations must be positive.
 * Day durations are whole local calendar days; hours/minutes are elapsed time.
 * @param {object} item Application-owned record.
 * @param {object} fields Field resolvers and durationUnit.
 * @param {number} index Source index supplied to resolvers.
 * @returns {{start: number, end: number}|null} Valid exclusive-end interval.
 */
export function resolveGanttSpan(item, fields, index = 0) {
	const start = parseGanttDate(resolveResourceValue(item, fields.startKey, index));
	if (!start) return null;
	const rawEnd = resolveResourceValue(item, fields.endKey, index);
	let end = parseGanttDate(rawEnd);
	if (rawEnd === undefined || rawEnd === null || rawEnd === '') {
		const duration = Number(resolveResourceValue(item, fields.durationKey, index));
		if (!Number.isFinite(duration) || duration <= 0) return null;
		if (fields.durationUnit === 'days') {
			if (!Number.isInteger(duration)) return null;
			end = addGanttDays(start, duration);
		} else {
			end = new Date(+start + duration * (fields.durationUnit === 'minutes' ? 60000 : 3600000));
		}
	}
	return end && +end > +start ? { start: +start, end: +end } : null;
}

/**
 * Projects item records into lane geometry and stacks overlapping spans.
 * Source records are never sorted in place or mutated. Invalid/off-axis items are omitted.
 * @param {Array<object>} rows Application-owned resource or feature rows.
 * @param {Array<object>} items Application-owned scheduled items.
 * @param {object} fields Logical field mappings and rowHeight.
 * @param {object} axis Visible axis.
 * @returns {Array<object>} Rows retaining source identity, with stacked item records.
 */
export function layoutGanttRows(rows, items, fields, axis) {
	const groups = new Map();
	for (const [index, item] of items.entries()) {
		const span = resolveGanttSpan(item, fields, index);
		if (!span) continue;
		const left = ganttDateToX(axis, span.start);
		const right = ganttDateToX(axis, span.end);
		if (right <= left) continue;
		const rowId = resolveResourceValue(item, fields.itemRowKey, index);
		const group = groups.get(rowId) || [];
		group.push({ item, key: resolveResourceKey(item, fields.itemKey, index), title: resolveResourceValue(item, fields.titleKey, index), tone: resolveResourceValue(item, fields.toneKey, index), ...span, left, width: right - left });
		groups.set(rowId, group);
	}
	return rows.map((row, index) => {
		const key = resolveResourceKey(row, fields.rowKey, index);
		const records = (groups.get(key) || []).sort((a, b) => a.start - b.start || a.end - b.end);
		const tracks = [];
		for (const record of records) {
			let track = tracks.findIndex((end) => end <= record.left);
			if (track === -1) track = tracks.length;
			tracks[track] = record.left + record.width;
			record.top = 12 + track * 36;
		}
		return { row, key, label: resolveResourceValue(row, fields.rowLabelKey, index), records, height: Math.max(Number(fields.rowHeight) || 64, 24 + tracks.length * 36) };
	});
}

/**
 * Resolves the shared movement, resize, and creation increment in axis pixels.
 * @param {object} axis Visible time axis.
 * @param {string} zoom Current zoom level.
 * @param {number} selectionStep Hourly-view increment in minutes.
 * @returns {number} Positive pixel increment.
 */
export function ganttSnapWidth(axis, zoom, selectionStep = 30) {
	return axis.cellWidth * (zoom === 'days' ? Math.min(60, Math.max(1, Number(selectionStep) || 30)) / 60 : 1);
}

/**
 * Moves a span by snapped pointer distance without changing its source record.
 * Week/month movement preserves both local wall-clock endpoints across DST;
 * hourly movement preserves elapsed duration. Hidden cells affect where the
 * pointer lands, but are never subtracted from the stored interval.
 * @param {object} axis Visible time axis.
 * @param {{start: number, end: number}} span Original exclusive interval.
 * @param {number} anchorX Axis coordinate where the item was grabbed.
 * @param {number} deltaX Pointer travel in axis pixels, including scrolling.
 * @param {string} zoom Current zoom.
 * @param {number} selectionStep Hourly increment in minutes.
 * @returns {{start: number, end: number}} Proposed interval.
 */
export function moveGanttSpan(axis, span, anchorX, deltaX, zoom, selectionStep = 30) {
	const step = ganttSnapWidth(axis, zoom, selectionStep);
	const delta = Math.round(deltaX / step) * step;
	if (!axis.cells.length || !delta) return { start: span.start, end: span.end };
	const anchor = Math.max(0, Math.min(axis.width - step, Math.floor(anchorX / step) * step));
	const target = Math.max(0, Math.min(axis.width - step, anchor + delta));
	const from = ganttXToDate(axis, anchor);
	const to = ganttXToDate(axis, target);
	if (zoom === 'days') return { start: span.start + to - from, end: span.end + to - from };
	const first = new Date(from);
	const last = new Date(to);
	const days = (Date.UTC(last.getFullYear(), last.getMonth(), last.getDate()) - Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) / 86400000;
	return { start: +addGanttDays(new Date(span.start), days), end: +addGanttDays(new Date(span.end), days) };
}

/**
 * Adjusts only an item's exclusive end using the shared visible-time increment.
 * A changed span retains at least one visible selection increment. The true end
 * is preserved for zero movement, including ends inside hidden nights/weekends.
 * @param {object} axis Visible time axis.
 * @param {{start: number, end: number}} span Original exclusive interval.
 * @param {number} deltaX Pointer travel from the original right edge.
 * @param {string} zoom Current zoom.
 * @param {number} selectionStep Hourly increment in minutes.
 * @returns {{start: number, end: number}} Proposed interval.
 */
export function resizeGanttSpan(axis, span, deltaX, zoom, selectionStep = 30) {
	const step = ganttSnapWidth(axis, zoom, selectionStep);
	const delta = Math.round(deltaX / step) * step;
	if (!axis.cells.length || !delta) return { start: span.start, end: span.end };
	const minimum = Math.min(axis.width, ganttDateToX(axis, span.start) + step);
	const position = Math.max(minimum, Math.min(axis.width, ganttDateToX(axis, span.end) + delta));
	const end = ganttXToDate(axis, position, 'end');
	return { start: span.start, end: end > span.start ? end : span.end };
}
