/**
 * The text style edited by DomTypographyEditor, as plain data.
 *
 * Keys follow CSS in camelCase. Numbers carry the usual units: `fontSize` and
 * `letterSpacing` are pixels and `lineHeight` is a multiple of the font size.
 * Any value may also be a CSS string (`1.5rem`, `0.02em`, `24px`), and an
 * empty string means unset, so the text inherits it.
 */

export const typographyKeys = ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'color', 'textAlign', 'fontStyle', 'textDecoration', 'textTransform'];

export const fontFamilyOptions = [
	{ label: 'System sans', value: 'ui-sans-serif, system-ui, sans-serif' },
	{ label: 'Inter', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
	{ label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
	{ label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
	{ label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
	{ label: 'Trebuchet', value: '"Trebuchet MS", Helvetica, sans-serif' },
	{ label: 'Condensed', value: 'Impact, "Arial Narrow", sans-serif' },
	{ label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
	{ label: 'Times', value: '"Times New Roman", Times, serif' },
	{ label: 'System serif', value: 'ui-serif, Georgia, serif' },
	{ label: 'System mono', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
	{ label: 'Courier', value: '"Courier New", Courier, monospace' },
];

export const fontWeightOptions = [
	{ label: 'Thin', value: '100' },
	{ label: 'Extra light', value: '200' },
	{ label: 'Light', value: '300' },
	{ label: 'Regular', value: '400' },
	{ label: 'Medium', value: '500' },
	{ label: 'Semibold', value: '600' },
	{ label: 'Bold', value: '700' },
	{ label: 'Extra bold', value: '800' },
	{ label: 'Black', value: '900' },
];

const cssNames = {
	fontFamily: 'font-family',
	fontWeight: 'font-weight',
	fontSize: 'font-size',
	lineHeight: 'line-height',
	letterSpacing: 'letter-spacing',
	color: 'color',
	textAlign: 'text-align',
	fontStyle: 'font-style',
	textDecoration: 'text-decoration-line',
	textTransform: 'text-transform',
};
const pixelKeys = new Set(['fontSize', 'letterSpacing']);

/**
 * A complete text style, for editors that own their text (a poster layer).
 * Pass `{}` to `typographyFromCss` instead when everything should inherit.
 *
 * @param {object} overrides Values to start from.
 * @returns {object} Typography record.
 */
export function createTypography(overrides = {}) {
	return {
		fontFamily: fontFamilyOptions[0].value,
		fontWeight: '400',
		fontSize: 16,
		lineHeight: 1.5,
		letterSpacing: 0,
		color: '#171717',
		textAlign: 'left',
		fontStyle: 'normal',
		textDecoration: 'none',
		textTransform: 'none',
		...overrides,
	};
}

/** One value as CSS; numbers get their unit. Unset values return ''. */
function cssValue(key, value) {
	if (value === '' || value === null || value === undefined) return '';
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) return '';
		return pixelKeys.has(key) ? `${Number(value.toFixed(3))}px` : String(Number(value.toFixed(3)));
	}
	const text = String(value).trim();
	// Values reach inline styles, so declarations and URLs are refused.
	return /[;{}<>]|\burl\s*\(/i.test(text) ? '' : text;
}

/**
 * Inline CSS properties (kebab-case) for a typography record. Unset values
 * are empty strings, so callers can remove those properties.
 *
 * @param {object} typography Typography record.
 * @returns {Record<string, string>}
 */
export function typographyToCssProperties(typography = {}) {
	return Object.fromEntries(typographyKeys.map((key) => [cssNames[key], cssValue(key, typography[key])]));
}

/**
 * A Vue `:style` object (camelCase) with only the values that are set.
 *
 * @param {object} typography Typography record.
 * @returns {Record<string, string>}
 */
export function typographyToStyle(typography = {}) {
	return Object.fromEntries(typographyKeys
		.map((key) => [key === 'textDecoration' ? 'textDecorationLine' : key, cssValue(key, typography[key])])
		.filter(([, value]) => value !== ''));
}

/**
 * Reads inline CSS properties (kebab-case) into a typography record. Pixel
 * lengths and unitless line heights become numbers; other values stay CSS.
 *
 * @param {Record<string, string>} style Inline style.
 * @returns {object} Typography record; missing properties are ''.
 */
export function typographyFromCss(style = {}) {
	return Object.fromEntries(typographyKeys.map((key) => {
		const raw = String(style[cssNames[key]] ?? (key === 'textDecoration' ? style['text-decoration'] ?? '' : '')).trim();
		if (pixelKeys.has(key) && /^-?\d*\.?\d+px$/.test(raw)) return [key, Number.parseFloat(raw)];
		if (key === 'lineHeight' && /^\d*\.?\d+$/.test(raw)) return [key, Number(raw)];
		return [key, raw];
	}));
}

/** Whether a weight reads as bold (600 and up, or `bold`). */
export function isBold(weight) {
	return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600;
}

/** Adds or removes one `text-decoration-line` keyword (`underline`, `line-through`). */
export function toggleDecoration(value, line) {
	const lines = new Set(String(value || '').split(/\s+/).filter((part) => part && part !== 'none'));
	if (lines.has(line)) lines.delete(line);
	else lines.add(line);
	return lines.size ? [...lines].join(' ') : 'none';
}
