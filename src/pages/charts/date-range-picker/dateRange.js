const DAY = 86_400_000;

/** @param {string} value Canonical date. @returns {number|null} UTC timestamp for a real calendar date. */
export function dateStamp(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
	const stamp = Date.parse(`${value}T00:00:00Z`);
	return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp : null;
}

/** @param {number} stamp UTC timestamp. @returns {string} Canonical date without a timezone conversion. */
function dateString(stamp) { return new Date(stamp).toISOString().slice(0, 10); }

/**
 * Validates inclusive date ranges against optional application bounds.
 * @param {{start?: string, end?: string}} range Proposed range.
 * @param {string} [min] Earliest available date.
 * @param {string} [max] Latest available date.
 * @returns {string} Validation message, or an empty string.
 */
export function rangeError(range, min = '', max = '') {
	if (dateStamp(range?.start) === null || dateStamp(range?.end) === null) return 'Choose a valid start and end date.';
	if (range.start > range.end) return 'End date must be on or after start date.';
	if (min && range.start < min) return `Choose dates on or after ${min}.`;
	if (max && range.end > max) return `Choose dates on or before ${max}.`;
	return '';
}

/**
 * Calculates reporting presets using calendar arithmetic independent of DST.
 * @param {string} anchor Canonical date treated as today.
 * @returns {Array<object>} Inclusive preset ranges.
 */
export function dateRangePresets(anchor) {
	const end = dateStamp(anchor);
	if (end === null) return [];
	const date = new Date(end);
	const monthStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
	return [
		{ label: 'Last 7 days', start: dateString(end - 6 * DAY), end: anchor },
		{ label: 'Last 30 days', start: dateString(end - 29 * DAY), end: anchor },
		{ label: 'This month', start: dateString(monthStart), end: anchor },
		{ label: 'Last month', start: dateString(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)), end: dateString(monthStart - DAY) },
	];
}

/**
 * Derives an equal-length previous period or the matching dates a year earlier.
 * Leap-day comparisons clamp to the final valid day of the earlier February.
 * @param {{start: string, end: string}} range Inclusive reporting range.
 * @param {'none'|'previous-period'|'previous-year'} comparison Comparison mode.
 * @returns {{start: string, end: string}|null} Derived comparison dates.
 */
export function comparisonRange(range, comparison) {
	if (rangeError(range) || comparison === 'none') return null;
	const start = dateStamp(range.start);
	const end = dateStamp(range.end);
	if (comparison === 'previous-period') return { start: dateString(start - (end - start + DAY)), end: dateString(start - DAY) };
	if (comparison !== 'previous-year') return null;
	return { start: previousYear(start), end: previousYear(end) };
}

/** @param {number} stamp Valid UTC date. @returns {string} Date in the preceding year, clamped at month end. */
function previousYear(stamp) {
	const date = new Date(stamp);
	const year = date.getUTCFullYear() - 1;
	const month = date.getUTCMonth();
	const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	return dateString(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}
