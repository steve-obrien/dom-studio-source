const DEFAULT_STYLESHEET_URL = 'https://fonts.googleapis.com/css2';
const DEFAULT_FALLBACK = 'sans-serif';

/**
 * Normalize a user-provided font family record for search and rendering.
 *
 * @param {string|Record<string, unknown>} font Font family name or metadata record.
 * @param {number} index Position used for a stable fallback key.
 * @returns {Record<string, string>|null} Normalized font record, or null for invalid input.
 */
export function normalizeFont(font, index = 0) {
	const source = typeof font === 'string' ? { family: font } : font;
	if (!source || typeof source !== 'object') return null;
	const family = String(source.family || source.label || source.value || '').trim();
	if (!family) return null;
	const category = String(source.category || DEFAULT_FALLBACK).trim() || DEFAULT_FALLBACK;
	const value = String(source.value || family);
	const keywords = Array.isArray(source.keywords) ? source.keywords.join(' ') : String(source.keywords || '');

	return {
		...source,
		key: String(source.key || `${family}-${index}`),
		family,
		label: String(source.label || family),
		value,
		category,
		searchText: `${family} ${source.label || ''} ${category} ${keywords}`.toLowerCase(),
	};
}

/**
 * Rank and limit font records for a picker query.
 *
 * @param {Array<string|Record<string, unknown>>} fonts Available font records.
 * @param {string} query Current user query.
 * @param {number} limit Maximum number of preview rows.
 * @param {string} category Optional category filter.
 * @returns {Array<Record<string, string>>} Matching normalized font records.
 */
export function filterFonts(fonts, query = '', limit = 12, category = '') {
	const needle = query.trim().toLowerCase();
	const normalized = fonts
		.map(normalizeFont)
		.filter(Boolean)
		.filter((font) => !category || font.category === category);

	if (!needle) return normalized.slice(0, limit);

	return normalized
		.filter((font) => font.searchText.includes(needle))
		.sort((left, right) => fontMatchRank(left, needle) - fontMatchRank(right, needle)
			|| left.family.length - right.family.length
			|| left.label.localeCompare(right.label))
		.slice(0, limit);
}

/**
 * Build a Google Fonts CSS v2 URL for only the requested preview families and glyphs.
 *
 * @param {Array<string>} families Font family names to request.
 * @param {string} text Exact preview text to subset into the response.
 * @param {string} baseUrl Google Fonts CSS endpoint or compatible proxy endpoint.
 * @returns {string} Stylesheet URL, or an empty string when no families are supplied.
 */
export function buildGoogleFontsStylesheetUrl(families, text, baseUrl = DEFAULT_STYLESHEET_URL) {
	const uniqueFamilies = [...new Set(families.map((family) => String(family || '').trim()).filter(Boolean))]
		.sort((left, right) => left.localeCompare(right));
	if (!uniqueFamilies.length) return '';
	const familyQuery = uniqueFamilies
		.map((family) => `family=${encodeURIComponent(family).replace(/%20/g, '+')}`)
		.join('&');
	const textQuery = text ? `&text=${encodeURIComponent(text)}` : '';
	return `${baseUrl}?${familyQuery}${textQuery}&display=swap`;
}

/**
 * Create a safe inline font stack for a preview row.
 *
 * @param {Record<string, string>|null|undefined} font Normalized font record.
 * @returns {string} CSS font-family value.
 */
export function fontStack(font) {
	if (!font?.family) return DEFAULT_FALLBACK;
	const family = font.family.replace(/[\\']/g, '\\$&');
	const fallback = { serif: 'serif', monospace: 'monospace', handwriting: 'cursive', display: 'sans-serif', 'sans-serif': 'sans-serif' }[font.category] || DEFAULT_FALLBACK;
	return `'${family}', ${fallback}`;
}

/**
 * Score a font match so exact and prefix matches appear before loose matches.
 *
 * @param {Record<string, string>} font Normalized font record.
 * @param {string} needle Lowercase search query.
 * @returns {number} Lower scores sort first.
 */
function fontMatchRank(font, needle) {
	const family = font.family.toLowerCase();
	if (family === needle) return 0;
	if (family.startsWith(needle)) return 1;
	if (family.split(/\s+/).some((word) => word.startsWith(needle))) return 2;
	return 3;
}
