import { onBeforeUnmount, watch } from 'vue';
import { fontStack } from '../../forms/font-picker/fontPicker.js';
import { googleFonts } from '../../forms/font-picker/googleFonts.js';
import { fontFamilyOptions } from './typographyModel.js';

/**
 * Google Fonts for designs.
 *
 * A typography record stores a CSS stack such as `'Lato', sans-serif`. A
 * stack whose first family is in the Google Fonts catalog is a Google font:
 * the editor loads it while the design is open, and exports link it.
 */

const catalog = new Map(googleFonts.map((font) => [font.family.toLowerCase(), font]));

/**
 * Font picker records: installed fonts first (never fetched), then Google Fonts.
 *
 * @param {Array<{ label: string, value: string }>} systemFonts Installed font stacks.
 * @param {boolean} includeGoogle Whether to add the Google Fonts catalog.
 * @returns {Array<object>} Records for DomFontPicker's `fonts`.
 */
export function fontPickerRecords(systemFonts = fontFamilyOptions, includeGoogle = true) {
	const system = systemFonts.map((font) => ({ family: font.label, label: font.label, value: font.value, category: 'system', source: 'system' }));
	if (!includeGoogle) return system;
	return [...system, ...googleFonts.map((font) => ({ ...font, value: fontStack(font) }))];
}

/**
 * The Google family a CSS stack starts with, or '' for installed fonts.
 *
 * @param {string} stack CSS `font-family` value.
 * @returns {string} Family name as Google Fonts lists it.
 */
export function googleFontFamily(stack) {
	const first = String(stack || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
	return catalog.get(first.toLowerCase())?.family || '';
}

/**
 * Stylesheet URLs for the Google fonts a design uses. Each family is its own
 * request, plus one per extra weight, so a weight a family lacks only loses
 * that weight (the browser synthesises it).
 *
 * @param {Array<{ fontFamily?: string, fontWeight?: string|number }>} usages Text styles in the design.
 * @param {string} baseUrl Google Fonts CSS v2 endpoint or a compatible proxy.
 * @returns {Array<string>} Stylesheet URLs.
 */
export function googleFontLinks(usages, baseUrl = 'https://fonts.googleapis.com/css2') {
	const weights = new Map();
	for (const usage of usages) {
		const family = googleFontFamily(usage?.fontFamily);
		if (!family) continue;
		if (!weights.has(family)) weights.set(family, new Set());
		const weight = Number(usage.fontWeight);
		if (Number.isInteger(weight) && weight >= 100 && weight <= 900 && weight !== 400) weights.get(family).add(weight);
	}
	const encode = (family) => encodeURIComponent(family).replace(/%20/g, '+');
	return [...weights.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([family, extra]) => [
		`${baseUrl}?family=${encode(family)}&display=swap`,
		...[...extra].sort().map((weight) => `${baseUrl}?family=${encode(family)}:wght@${weight}&display=swap`),
	]);
}

/**
 * Keeps `<link>` elements for a design's Google fonts in the document head
 * while the editor is mounted. Artboard iframes copy the head's stylesheets,
 * so canvas artboards get the fonts too.
 *
 * @param {() => Array<object>} usages Returns the design's text styles.
 * @returns {void}
 */
export function useGoogleFonts(usages) {
	if (typeof document === 'undefined') return;
	const links = new Map();
	watch(() => googleFontLinks(usages()).join('\n'), (joined) => {
		const wanted = new Set(joined ? joined.split('\n') : []);
		for (const [href, link] of links) if (!wanted.has(href)) { link.remove(); links.delete(href); }
		for (const href of wanted) {
			if (links.has(href)) continue;
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = href;
			link.dataset.domDesignFont = '';
			document.head.append(link);
			links.set(href, link);
		}
	}, { immediate: true });
	onBeforeUnmount(() => { links.forEach((link) => link.remove()); links.clear(); });
}
