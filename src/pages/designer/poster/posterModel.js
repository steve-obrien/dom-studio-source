import { createBackgroundState, backgroundImageToCss } from '../background-editor/backgroundModel.js';
import { createBackdrop, backdropToCss } from '../backdrop-editor/backdropModel.js';
import { createDesignerBorder, borderToCss } from '../border-editor/borderModel.js';
import { shadowListToCss } from '../shadow-editor/shadowModel.js';
import { typographyToStyle } from '../typography-editor/typographyModel.js';
import { googleFontLinks } from '../typography-editor/googleFonts.js';

export const posterImage = 'https://images.unsplash.com/photo-1609674750700-33895b9b7ce1?auto=format&fit=crop&w=1080&q=85';
export const fontOptions = [
	{ label: 'Condensed', value: 'Impact, "Arial Narrow", sans-serif' },
	{ label: 'Sans serif', value: 'Arial, Helvetica, sans-serif' },
	{ label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
	{ label: 'Monospace', value: 'monospace' },
];

/** Creates a complete HTML layer with deterministic, caller-supplied identity. */
export function createPosterLayer(type, id, overrides = {}) {
	return {
		id, type, name: type === 'text' ? 'Text' : type === 'image' ? 'Image' : 'Shape',
		value: type === 'text' ? 'Your next adventure' : type === 'image' ? posterImage : '',
		x: 80, y: 480, width: 920, height: type === 'text' ? 260 : 600, pinX: 'auto', pinY: 'auto',
		background: createBackgroundState({}, { allowEmpty: true }), backdrop: createBackdrop(), border: createDesignerBorder({ enabled: false }), locked: false, hidden: false, opacity: 100, radius: 0, shadows: [],
		color: '#171717', fill: type === 'shape' ? '#f4d35e' : 'transparent',
		fontFamily: fontOptions[0].value, fontSize: 100, fontWeight: '400', lineHeight: 1.1, letterSpacing: -2,
		textAlign: 'center', textTransform: 'uppercase', fontStyle: 'normal', textDecoration: 'none',
		objectFit: 'cover', objectY: 50, blur: 0, saturation: 100, brightness: 100, sepia: 0,
		...overrides,
	};
}

/** Returns the initial portrait poster; the photo is locked so text remains easy to select. */
export function createPoster() {
	return {
		version: 1, title: 'A weekend in the Highlands', width: 1080, height: 1920, background: '#ffffff',
		layers: [
			createPosterLayer('image', 'photo', { name: 'Glencoe, Scottish Highlands', x: 0, y: 0, width: 1080, height: 1920, locked: true }),
			createPosterLayer('text', 'headline', { name: 'Headline', value: 'A WEEKEND IN\nTHE HIGHLANDS', x: 40, y: 90, width: 1000, height: 350, fontSize: 120 }),
		],
	};
}

/** Returns a link-preview card at the Open Graph size, built from the same layers as the poster. */
export function createSocialCard() {
	const sans = fontOptions[1].value;
	const text = { fontFamily: sans, textAlign: 'left', textTransform: 'none', letterSpacing: 0 };
	return {
		version: 1, title: 'Small ideas. Worth sharing.', width: 1200, height: 630, background: '#f4f1ea',
		layers: [
			createPosterLayer('shape', 'accent', { name: 'Accent', x: 0, y: 0, width: 24, height: 630, fill: '#e4572e' }),
			createPosterLayer('text', 'brand', { name: 'Brand', value: 'DOM STUDIO / FIELD NOTES', x: 80, y: 72, width: 640, height: 40, ...text, fontSize: 24, fontWeight: '700', letterSpacing: 4, lineHeight: 1.2, color: '#e4572e' }),
			createPosterLayer('text', 'headline', { name: 'Headline', value: 'Small ideas.\nWorth sharing.', x: 80, y: 160, width: 1000, height: 260, ...text, fontSize: 104, fontWeight: '900', letterSpacing: -3, lineHeight: 1.02 }),
			createPosterLayer('text', 'caption', { name: 'Caption', value: 'Made with real HTML. Ready for your next idea.', x: 80, y: 470, width: 900, height: 60, ...text, fontSize: 32, lineHeight: 1.3, color: '#525252' }),
		],
	};
}

/**
 * Returns an Instagram post built to be resized: the photo fills the frame,
 * the brand and badge hold the top corners, and the copy sits on a scrim
 * pinned to the bottom edge and stretched between the sides.
 */
export function createSocialPost() {
	const sans = fontOptions[1].value;
	const text = { fontFamily: sans, textAlign: 'left', textTransform: 'none', letterSpacing: 0, lineHeight: 1.2, color: '#ffffff' };
	return {
		version: 1, title: 'Five days in the Highlands', width: 1080, height: 1350, background: '#0f172a',
		layers: [
			createPosterLayer('image', 'photo', { name: 'Glencoe, Scottish Highlands', x: 0, y: 0, width: 1080, height: 1350, objectY: 40, locked: true }),
			createPosterLayer('shape', 'scrim', { name: 'Scrim', x: 0, y: 760, width: 1080, height: 590, fill: '#0f172a', opacity: 72 }),
			createPosterLayer('text', 'brand', { name: 'Brand', value: 'NORTHBOUND TRAVEL', x: 64, y: 64, width: 600, height: 40, ...text, fontSize: 28, fontWeight: '700', letterSpacing: 4 }),
			createPosterLayer('shape', 'badge', { name: 'Badge', x: 856, y: 48, width: 176, height: 176, radius: 88, fill: '#f4d35e' }),
			createPosterLayer('text', 'badge-label', { name: 'Badge label', value: 'NEW\nROUTE', x: 856, y: 96, width: 176, height: 80, ...text, fontSize: 30, fontWeight: '900', lineHeight: 1.1, textAlign: 'center', color: '#171717' }),
			createPosterLayer('text', 'headline', { name: 'Headline', value: 'Five days in\nthe Highlands', x: 64, y: 840, width: 952, height: 250, ...text, fontSize: 104, fontWeight: '900', letterSpacing: -2, lineHeight: 1.02, pinX: 'stretch' }),
			createPosterLayer('text', 'details', { name: 'Details', value: 'Departs 14 March · From £890 · Small groups', x: 64, y: 1150, width: 952, height: 60, ...text, fontSize: 34, color: '#e2e8f0', pinX: 'stretch' }),
		],
	};
}

/** Projects a layer into ordinary CSS, shared by the visible HTML and exported document. */
export function posterLayerStyle(layer, index) {
	return {
		position: 'absolute', boxSizing: 'border-box', margin: '0', left: `${layer.x}px`, top: `${layer.y}px`,
		width: `${layer.width}px`, height: `${layer.height}px`, zIndex: index,
		opacity: layer.opacity / 100, borderRadius: `${layer.radius}px`, boxShadow: shadowListToCss(layer.shadows), border: borderToCss(layer.border),
		...(layer.hidden ? { display: 'none' } : {}),
		...(layer.type === 'image' ? {
			objectFit: layer.objectFit, objectPosition: `50% ${layer.objectY}%`,
			filter: `blur(${layer.blur}px) saturate(${layer.saturation}%) brightness(${layer.brightness}%) sepia(${layer.sepia}%)`,
		} : { backgroundColor: layer.fill, backgroundImage: backgroundImageToCss(layer.background), backdropFilter: backdropToCss(layer.backdrop), WebkitBackdropFilter: backdropToCss(layer.backdrop) }),
		...(layer.type === 'text' ? {
			...typographyToStyle(layer), whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
		} : {}),
	};
}

/** Escapes text and quoted attributes so user content cannot become executable markup. */
export function escapeHtml(value) {
	return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/** Accepts browser image URLs and raster data URLs, rejecting executable or vector payloads. */
export function safePosterImage(value) {
	if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
	try {
		const url = new URL(value);
		return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
	} catch { return ''; }
}

/** Serializes camel-case styles as escaped HTML attributes. */
function styleAttribute(style) {
	return escapeHtml(Object.entries(style).map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`).join(';'));
}

/** Returns selectable source lines without any editor overlays, selection IDs or hidden layers. */
export function posterHtmlLines(poster) {
	return [
		{ id: 'frame', text: `<article aria-label="${escapeHtml(poster.title)}" style="position:relative;width:${poster.width}px;height:${poster.height}px;overflow:hidden;background:${escapeHtml(poster.background)}">` },
		...poster.layers.flatMap((layer, index) => {
			if (layer.hidden) return [];
			const style = styleAttribute(posterLayerStyle(layer, index));
			const text = layer.type === 'image'
				? `<img src="${escapeHtml(safePosterImage(layer.value))}" alt="${escapeHtml(layer.name)}" style="${style}">`
				: `<${layer.type === 'text' ? 'p' : 'div'} style="${style}">${layer.type === 'text' ? escapeHtml(layer.value) : ''}</${layer.type === 'text' ? 'p' : 'div'}>`;
			return [{ id: layer.id, text: `\t${text}` }];
		}),
		{ id: 'frame', text: '</article>' },
	];
}

/** Generates a standalone HTML document with the original poster dimensions. */
export function exportPosterHtml(poster) {
	return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(poster.title)}</title>${googleFontLinks(poster.layers.filter((layer) => layer.type === 'text')).map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('')}<style>body{margin:0}*{box-sizing:border-box}@media print{@page{margin:0}body{print-color-adjust:exact}}</style></head>\n<body>\n${posterHtmlLines(poster).map((line) => line.text).join('\n')}\n</body>\n</html>`;
}

/** Applies finite CSS geometry emitted by the shared stage; locked layers cannot be moved. */
export function applyPosterGeometry(layer, style) {
	if (!layer || layer.locked) return;
	for (const [css, key] of [['left', 'x'], ['top', 'y'], ['width', 'width'], ['height', 'height']]) {
		const value = Number.parseFloat(style[css]);
		if (Number.isFinite(value)) layer[key] = ['width', 'height'].includes(key) ? Math.max(16, value) : value;
	}
}
