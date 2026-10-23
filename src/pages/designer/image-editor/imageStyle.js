/**
 * Image settings as plain values, read from and written to CSS: the image
 * source, how it fits its box, and colour filters.
 *
 * Filters the controls don't know (drop-shadow, hue-rotate, url()) are kept
 * as written, after the known ones.
 */

/** The filters the image controls offer, with their neutral values. */
export const imageFilters = [
	{ key: 'brightness', label: 'Brightness', unit: '%', neutral: 100, max: 200 },
	{ key: 'contrast', label: 'Contrast', unit: '%', neutral: 100, max: 200 },
	{ key: 'saturate', label: 'Saturation', unit: '%', neutral: 100, max: 200 },
	{ key: 'grayscale', label: 'Greyscale', unit: '%', neutral: 0, max: 100 },
	{ key: 'sepia', label: 'Sepia', unit: '%', neutral: 0, max: 100 },
	{ key: 'blur', label: 'Blur', unit: 'px', neutral: 0, max: 40 },
];

/**
 * Reads a CSS filter into the known values and the rest.
 *
 * @param {string} css A CSS `filter` value.
 * @returns {{ values: Record<string, number>, rest: string }}
 */
export function parseFilter(css = '') {
	const values = Object.fromEntries(imageFilters.map((filter) => [filter.key, filter.neutral]));
	const rest = [];
	for (const [whole, name, argument] of String(css).matchAll(/([a-z-]+)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi)) {
		const filter = imageFilters.find((item) => item.key === name.toLowerCase());
		const number = Number.parseFloat(argument);
		if (!filter || !Number.isFinite(number)) { rest.push(whole); continue; }
		// Ratios such as brightness(1.2) are the same as percentages.
		values[filter.key] = filter.unit === '%' && !argument.includes('%') ? number * 100 : number;
	}
	return { values, rest: rest.join(' ') };
}

/**
 * Writes filter values back as CSS, leaving out neutral ones. Empty when
 * nothing applies.
 */
export function formatFilter(values = {}, rest = '') {
	const parts = imageFilters.filter((filter) => Number.isFinite(values[filter.key]) && values[filter.key] !== filter.neutral).map((filter) => `${filter.key}(${Math.round(values[filter.key] * 100) / 100}${filter.unit})`);
	return [...parts, rest].filter(Boolean).join(' ');
}

/**
 * Whether a value is an image source that is safe to write into a page: an
 * http(s) URL, a root or relative path, or a PNG, JPEG, WebP, GIF or AVIF data URL.
 */
export function safeImageSource(value) {
	const text = String(value || '').trim();
	if (!text) return '';
	if (/^data:image\/(png|jpeg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(text)) return text;
	if (/^(\/(?!\/)|\.{1,2}\/)[^\s"'<>]*$/.test(text)) return text;
	try {
		const url = new URL(text);
		return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
	} catch {
		return '';
	}
}

/** Reads a chosen image file as a data URL, so nothing leaves the browser. */
export function readImageFile(file, { maxBytes = 5 * 1024 * 1024 } = {}) {
	return new Promise((resolve, reject) => {
		if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file?.type || '')) { reject(new Error('Choose a PNG, JPEG, WebP, GIF or AVIF image.')); return; }
		if (file.size > maxBytes) { reject(new Error(`Choose an image under ${Math.round(maxBytes / 1024 / 1024)} MB, or upload it somewhere and use its URL.`)); return; }
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error('The image could not be read.'));
		reader.readAsDataURL(file);
	});
}
