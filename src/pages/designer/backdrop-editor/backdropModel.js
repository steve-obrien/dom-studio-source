/** Shared theme editor helper: createBackdrop. */
export function createBackdrop(overrides = {}) {
	return {
		enabled: false,
		open: true,
		blur: 0,
		saturate: 1,
		...overrides,
		blur: Number.parseFloat(overrides.blur ?? 0),
		saturate: Number.parseFloat(overrides.saturate ?? 1),
	};
}

/** Serializes enabled blur and saturation into a backdrop-filter value. */
export function backdropToCss(backdrop) {
	if (!backdrop?.enabled) return 'none';
	const parts = [];
	const blur = Number.parseFloat(backdrop.blur);
	const saturate = Number.parseFloat(backdrop.saturate);
	if (blur > 0) parts.push(`blur(${formatCssNumber(blur)}px)`);
	if (Number.isFinite(saturate) && saturate !== 1) parts.push(`saturate(${formatCssNumber(saturate)})`);
	return parts.length ? parts.join(' ') : 'none';
}

/** Shared theme editor helper: parseBackdropValue. */
export function parseBackdropValue(value) {
	const raw = String(value || '').trim();
	if (!raw || raw === 'none') return createBackdrop();
	return createBackdrop({
		enabled: true,
		blur: Number.parseFloat(raw.match(/blur\(\s*(-?\d+(?:\.\d+)?)px\s*\)/i)?.[1] ?? 0),
		saturate: Number.parseFloat(raw.match(/saturate\(\s*(-?\d+(?:\.\d+)?)\s*\)/i)?.[1] ?? 1),
	});
}

/** Formats a CSS number. */
function formatCssNumber(value) {
	return Number(Number.parseFloat(value || 0).toFixed(3)).toString();
}
