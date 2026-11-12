const dayLength = 86400000;
export const accessClickDimensions = ['placement', 'section', 'device', 'browser', 'signal'];

/**
 * Validates an inclusive UTC report window, capped at one year per request.
 * @param {{ days?: number|string, from?: string, to?: string }} [options] Report selection.
 * @param {Date} [now] Current server date for default windows.
 * @returns {{ from: string, to: string }} Normalized inclusive date range.
 */
export function accessClickDateRange({ days, from, to } = {}, now = new Date()) {
	if (days !== undefined && (from || to)) throw new Error('Use --days or --from/--to, not both.');
	if ((from && !to) || (!from && to)) throw new Error('Supply both --from and --to.');
	if (!from && !to) {
		const count = Number(days ?? 30);
		if (!Number.isInteger(count) || count < 1 || count > 366) throw new Error('--days must be between 1 and 366.');
		to = now.toISOString().slice(0, 10);
		from = new Date(Date.parse(to) - (count - 1) * dayLength).toISOString().slice(0, 10);
	}
	for (const value of [from, to]) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))
			|| new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Dates must be real calendar dates in YYYY-MM-DD format.');
	}
	const duration = (Date.parse(to) - Date.parse(from)) / dayLength;
	if (duration < 0 || duration > 365) throw new Error('The report range must contain between 1 and 366 days.');
	return { from, to };
}

/**
 * Reads persisted counters; a missing table is an error rather than a false zero.
 * @param {import('knex').Knex} db Application database connection.
 * @param {{ from: string, to: string }} range Inclusive UTC report window.
 * @returns {Promise<object>} Total, daily series, dimension summaries and CSV-ready rows.
 */
export async function readAccessClickReport(db, range) {
	const { from, to } = accessClickDateRange(range);
	const rows = await db('access_click_daily').select('day', ...accessClickDimensions, 'clicks')
		.whereBetween('day', [from, to]).orderBy('day').orderBy(accessClickDimensions).timeout(10000);
	return summarizeAccessClicks(rows, { from, to });
}

/**
 * Fills quiet days and derives every total from the same aggregate snapshot.
 * @param {object[]} rows Persisted daily dimension counters.
 * @param {{ from: string, to: string }} range Inclusive UTC report window.
 * @returns {object} Anonymous click report; counts are clicks, not unique people or purchases.
 */
export function summarizeAccessClicks(rows, { from, to }) {
	const daily = new Map();
	const groups = Object.fromEntries(accessClickDimensions.map(createDimensionMap));
	for (let date = Date.parse(from); date <= Date.parse(to); date += dayLength) {
		daily.set(new Date(date).toISOString().slice(0, 10), 0);
	}
	let total = 0;
	const normalizedRows = [];
	for (const row of rows) {
		if (!daily.has(row.day)) continue;
		const clicks = Number(row.clicks);
		if (!Number.isSafeInteger(clicks) || clicks < 0 || !Number.isSafeInteger(total + clicks)) throw new Error('Invalid or oversized click count.');
		total += clicks;
		daily.set(row.day, daily.get(row.day) + clicks);
		const normalized = { day: row.day, clicks };
		for (const dimension of accessClickDimensions) {
			const value = row[dimension];
			normalized[dimension] = value;
			groups[dimension].set(value, (groups[dimension].get(value) || 0) + clicks);
		}
		normalizedRows.push(normalized);
	}
	const breakdowns = {};
	for (const dimension of accessClickDimensions) {
		breakdowns[dimension] = Array.from(groups[dimension], dimensionCount).sort(compareCounts);
	}
	return { from, to, timezone: 'UTC', total, daily: Array.from(daily, dailyCount), breakdowns, rows: normalizedRows };
}

/** @param {string} dimension Counter field. @returns {[string, Map]} Empty dimension summary. */
function createDimensionMap(dimension) { return [dimension, new Map()]; }
/** @param {[string, number]} entry Dimension/count pair. @returns {object} Summary row. */
function dimensionCount([value, clicks]) { return { value, clicks }; }
/** @param {[string, number]} entry UTC day/count pair. @returns {object} Daily row. */
function dailyCount([day, clicks]) { return { day, clicks }; }
/** @param {object} a First row. @param {object} b Second row. @returns {number} Stable descending count order. */
function compareCounts(a, b) { return b.clicks - a.clicks || a.value.localeCompare(b.value); }

/**
 * Exports the same aggregate data as CSV with quoted, spreadsheet-safe cells.
 * @param {object} report Completed access-click report.
 * @returns {string} CSV including a header even when no clicks were recorded.
 */
export function accessClickReportCsv(report) {
	const columns = ['day', ...accessClickDimensions, 'clicks'];
	const lines = [columns.join(',')];
	for (const row of report.rows) {
		const cells = [];
		for (const column of columns) cells.push(csvCell(row[column]));
		lines.push(cells.join(','));
	}
	return lines.join('\n') + '\n';
}

/** @param {unknown} value Aggregate cell. @returns {string} Quoted cell safe to open in spreadsheets. */
function csvCell(value) {
	const text = String(value ?? '');
	return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
}
