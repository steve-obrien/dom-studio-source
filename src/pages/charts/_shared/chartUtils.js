/**
 * Converts a measurement without turning missing values into misleading zeros.
 * @param {unknown} value Raw application value.
 * @returns {number|undefined} Finite measurement, or a missing value.
 */
export function chartNumber(value) {
	if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return undefined;
	const number = Number(value);
	return Number.isFinite(number) ? number : undefined;
}

/**
 * Resolves a stable palette colour from a series key or an explicit CSS colour.
 * @param {string} key Stable series or category key.
 * @param {string} [color] Semantic token or CSS colour.
 * @returns {string} CSS colour expression.
 */
export function chartColor(key, color) {
	if (color) return /^(primary|secondary|muted-fg|success|warning|destructive|chart-[1-5])$/.test(color) ? `var(--${color})` : color;
	let hash = 0;
	for (const character of String(key)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
	return `var(--chart-${hash % 5 + 1}, var(--primary))`;
}

/**
 * Normalizes series definitions and removes ambiguous duplicate keys.
 * @param {Array<string|object>} series Field keys or series definitions.
 * @returns {Array<object>} Labelled, consistently coloured series.
 */
export function chartSeries(series) {
	const seen = new Set();
	return series.flatMap((entry) => {
		const item = typeof entry === 'string' ? { key: entry } : entry;
		if (!item?.key || seen.has(item.key)) return [];
		seen.add(item.key);
		return [{ ...item, label: item.label || item.key, color: chartColor(item.key, item.color) }];
	});
}

/**
 * Projects records into numeric chart coordinates while retaining original rows.
 * Continuous axes are sorted without modifying the supplied collection.
 * @param {Array<object>} rows Application-owned records.
 * @param {string} xKey Category, number, or date field.
 * @param {'category'|'number'|'time'} xType Horizontal axis interpretation.
 * @param {Array<object>} series Normalized series definitions.
 * @returns {Array<object>} Renderable points with original row indexes.
 */
export function chartPoints(rows, xKey, xType, series) {
	const points = rows.flatMap((row, index) => {
		if (!row || typeof row !== 'object') return [];
		const rawX = row[xKey];
		const x = xType === 'time'
			? (rawX == null || rawX === '' ? NaN : new Date(rawX).getTime())
			: xType === 'number' ? chartNumber(rawX) : index;
		if (!Number.isFinite(x)) return [];
		return [{ row, index, x, values: Object.fromEntries(series.map((item) => [item.key, chartNumber(row[item.key])])) }];
	});
	return xType === 'category' ? points : points.sort((a, b) => a.x - b.x);
}

/**
 * Formats finite values consistently across axes, tooltips, and data tables.
 * @param {unknown} value Raw value.
 * @param {object} options Locale, format, currency, and optional custom formatter.
 * @returns {string} Human-readable measurement.
 */
export function formatChartValue(value, { locale = 'en-GB', format = 'number', currency = 'GBP', valueFormatter } = {}) {
	const number = chartNumber(value);
	if (number === undefined) return '—';
	if (valueFormatter) return String(valueFormatter(number));
	const options = format === 'currency'
		? { style: 'currency', currency, maximumFractionDigits: 0 }
		: format === 'percent'
			? { style: 'percent', maximumFractionDigits: 1 }
			: { maximumFractionDigits: 2, ...(format === 'compact' ? { notation: 'compact' } : {}) };
	return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Normalizes each non-negative row to percentages of its visible series total.
 * Missing values remain missing, and an all-zero row remains zero.
 * @param {Array<object>} points Chart points.
 * @param {Array<object>} series Visible series.
 * @returns {Array<object>} New points with values in the range 0–100.
 */
export function percentagePoints(points, series) {
	return points.map((point) => {
		const total = series.reduce((sum, item) => sum + (point.values[item.key] || 0), 0);
		return { ...point, values: Object.fromEntries(series.map((item) => {
			const value = point.values[item.key];
			return [item.key, value === undefined ? undefined : total ? value / total * 100 : 0];
		})) };
	});
}
