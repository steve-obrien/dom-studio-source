import { colorToHexAlpha, cssColorWithAlpha } from '../../lib/css/color.js';

/**
 * Small CSS value helpers shared by the material editors, so a value written
 * by an editor can be read back into the same editor.
 */

/**
 * Splits a CSS value on a separator that sits outside parentheses and quotes.
 *
 * @param {string} value CSS value, such as a `box-shadow` list.
 * @param {string} separator `,` for lists or ` ` for whitespace-separated tokens.
 * @returns {Array<string>} Trimmed, non-empty parts.
 */
export function splitCssList(value, separator = ',') {
	const parts = [];
	let depth = 0;
	let quote = '';
	let current = '';
	for (const char of String(value ?? '')) {
		if (quote) {
			if (char === quote) quote = '';
			current += char;
			continue;
		}
		if (char === '"' || char === "'") quote = char;
		else if (char === '(') depth += 1;
		else if (char === ')') depth = Math.max(0, depth - 1);
		const splits = separator === ' ' ? /\s/.test(char) : char === separator;
		if (depth === 0 && splits) {
			if (current.trim()) parts.push(current.trim());
			current = '';
			continue;
		}
		current += char;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}

/**
 * Whether a CSS colour expression is safe to write into an inline style.
 * Variables are allowed; declarations, at-rules and URLs are not.
 *
 * @param {string} value Colour expression.
 * @returns {boolean}
 */
export function isSafeCssColor(value) {
	const text = String(value ?? '').trim();
	if (!text || text.length > 160 || /[;{}@<>]|\burl\s*\(/i.test(text)) return false;
	if (typeof CSS !== 'undefined' && CSS.supports) return CSS.supports('color', text) || /var\(\s*--/.test(text);
	return /^(#[0-9a-f]{3,8}|[a-z]+|(rgba?|hsla?|oklch|oklab|lab|lch|color|color-mix|var)\(.*\))$/i.test(text);
}

/**
 * Splits a serialised colour into an editable colour and an alpha percentage,
 * reversing `cssColorWithAlpha`.
 *
 * @param {string} value CSS colour.
 * @returns {{ color: string, alpha: number }}
 */
export function splitColorAlpha(value) {
	const text = String(value ?? '').trim();
	const mix = text.match(/^color-mix\(\s*in\s+\w+\s*,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*transparent\s*\)$/i);
	if (mix) return { color: mix[1], alpha: Number(mix[2]) };
	if (/^rgba?\(|^#[0-9a-f]{4}$|^#[0-9a-f]{8}$/i.test(text) || (/^oklch\(/i.test(text) && text.includes('/'))) {
		const parsed = colorToHexAlpha(text);
		return { color: parsed.color, alpha: parsed.alpha };
	}
	if (text === 'transparent') return { color: '#000000', alpha: 0 };
	return { color: text || '#000000', alpha: 100 };
}

/**
 * Reads a pixel length; a bare `0` counts. Other units return `null`.
 *
 * @param {string} token CSS length.
 * @returns {number|null}
 */
export function pxValue(token) {
	const match = String(token ?? '').trim().match(/^(-?\d*\.?\d+)(px)?$/i);
	if (!match) return null;
	if (!match[2] && Number(match[1]) !== 0) return null;
	return Number(match[1]);
}

/**
 * Applies an alpha percentage to a colour, leaving opaque colours as written
 * so `#171717` stays `#171717` in the CSS.
 *
 * @param {string} color CSS colour.
 * @param {number} alpha Opacity from 0 to 100.
 * @returns {string}
 */
export function colorWithAlpha(color, alpha = 100) {
	return Number(alpha) >= 100 && color ? String(color).trim() : cssColorWithAlpha(color, alpha);
}
