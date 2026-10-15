import { pxValue, splitCssList } from '../_shared/cssValue.js';

export const borderStyleOptions = [
	{ label: 'Solid', value: 'solid' },
	{ label: 'Dashed', value: 'dashed' },
	{ label: 'Dotted', value: 'dotted' },
	{ label: 'Double', value: 'double' },
	{ label: 'None', value: 'none' },
];

/** Creates a caller-owned uniform border record with a finite, nonnegative pixel width. */
export function createDesignerBorder(overrides = {}) {
	const width = Number.parseFloat(overrides.width ?? 1);
	return { enabled: true, style: 'solid', color: '#171717', ...overrides, width: Number.isFinite(width) ? Math.max(0, width) : 1 };
}

/** Serializes a uniform border without discarding values when its visibility is disabled. */
export function borderToCss(border) {
	if (!border?.enabled || border.style === 'none') return 'none';
	const value = createDesignerBorder(border);
	const style = borderStyleOptions.some((option) => option.value === value.style) ? value.style : 'solid';
	return `${value.width}px ${style} ${value.color}`;
}

/**
 * Reads a CSS `border` shorthand back into a border record. `none` reads as
 * a hidden border. Returns `null` for values the editor cannot represent.
 *
 * @param {string} css `border` value, such as `1px solid #171717`.
 * @returns {object|null} Border record.
 */
export function borderFromCss(css) {
	const value = String(css ?? '').trim();
	if (!value || value === 'none' || value === '0') return createDesignerBorder({ enabled: false });
	const border = { enabled: true, width: 3, style: 'none', color: 'currentColor' };
	const tokens = splitCssList(value, ' ');
	if (tokens.length > 3) return null;
	for (const token of tokens) {
		const px = pxValue(token);
		if (px !== null) border.width = px;
		else if (borderStyleOptions.some((option) => option.value === token)) border.style = token;
		else if (/^(thin|medium|thick)$/.test(token)) border.width = { thin: 1, medium: 3, thick: 5 }[token];
		else if (/[;{}]|\burl\s*\(/i.test(token) || /^-?[\d.]+[a-z%]+$/i.test(token)) return null;
		else border.color = token;
	}
	return createDesignerBorder(border);
}
