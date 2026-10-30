import { exportFile, importFile } from '../canvas/canvasWorkspace.js';
import { escapeHtml, posterLayerStyle, safePosterImage } from '../poster/posterModel.js';
import { resizeLayer } from '../poster/posterResize.js';
import { googleFontLinks } from '../typography-editor/googleFonts.js';

/**
 * A social post as a designer file.
 *
 * The Social post studio is DomDesigner: a post is an ordinary HTML file
 * whose root `<article>` is the post and whose layers are absolutely placed
 * by their own inline style. Canvas editing, the code view, text editing and
 * marks are the designer's own. This module adds what is particular to posts:
 * opening a poster or template as a file, resizing to another format with
 * each layer's pins (`data-pin-x`, `data-pin-y`), and exporting a standalone
 * HTML document.
 */

/** Serializes camel-case styles the way the poster export does. */
function styleAttribute(style) {
	return escapeHtml(Object.entries(style).map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`).join(';'));
}

/**
 * A poster (or template poster) as Vue source. Line breaks in text become
 * `<br>`, since the template compiler folds whitespace.
 *
 * @param {object} poster Poster model.
 * @returns {string} Vue SFC with one `<article>`.
 */
export function posterToSource(poster) {
	const layers = poster.layers.filter((layer) => !layer.hidden).map((layer, index) => {
		const pins = [['data-pin-x', layer.pinX], ['data-pin-y', layer.pinY]].filter(([, pin]) => pin && pin !== 'auto').map(([name, pin]) => ` ${name}="${pin}"`).join('');
		// Line breaks are written as <br>, and the exported markup is indented, so text does not keep source whitespace (no pre-wrap).
		// eslint-disable-next-line no-unused-vars
		const { whiteSpace, ...css } = posterLayerStyle(layer, index);
		const style = styleAttribute(css);
		if (layer.type === 'image') return `\t<img src="${escapeHtml(safePosterImage(layer.value))}" alt="${escapeHtml(layer.name)}"${pins} style="${style}">`;
		if (layer.type === 'text') return `\t<p${pins} style="${style}">${escapeHtml(layer.value).replace(/\n/g, '<br>')}</p>`;
		return `\t<div${pins} style="${style}"></div>`;
	});
	return `<template>\n<article aria-label="${escapeHtml(poster.title)}" style="position:relative;width:${poster.width}px;height:${poster.height}px;overflow:hidden;background:${escapeHtml(poster.background)}">\n${layers.join('\n')}\n</article>\n</template>\n`;
}

/**
 * Opens a poster as a designer file, with its layer names and locks.
 *
 * @param {object} poster Poster model.
 * @param {string} [name] File name.
 * @returns {object} Designer file.
 */
export function posterToFile(poster, name = 'Post.vue') {
	const { file } = importFile(posterToSource(poster), name);
	const root = file.doc.nodes[file.doc.rootId];
	poster.layers.filter((layer) => !layer.hidden).forEach((layer, index) => {
		const node = file.doc.nodes[root.children[index]];
		if (!node) return;
		node.label = layer.name;
		if (layer.locked) node.locked = true;
	});
	return file;
}

/** A pixel length from inline style, or null. */
function px(value) {
	const number = Number.parseFloat(value);
	return Number.isFinite(number) && /^\s*-?[\d.]+(px)?\s*$/.test(String(value)) ? number : null;
}

/** The post's size, read from its root element's inline style. */
export function postSize(doc) {
	const root = doc.nodes[doc.rootId];
	return { width: px(root?.style?.width) || 1080, height: px(root?.style?.height) || 1080 };
}

/** A layer's box: where the designer placed it, else where its style puts it. */
function boxOf(node) {
	const style = node.style || {};
	const placed = node.placements?.absolute || {};
	const pick = (key) => (Number.isFinite(placed[key]) && (placed.sized !== false || key === 'left' || key === 'top') ? placed[key] : px(style[key]));
	return { x: pick('left'), y: pick('top'), width: pick('width'), height: pick('height') };
}

/**
 * Operations that move a post into another format, as one undo step. Each
 * absolutely placed layer follows its pins (see posterResize.js); type size,
 * letter spacing and corner radius scale with the smaller frame ratio.
 *
 * @param {object} doc Document to resize from (the design as last edited).
 * @param {string} fileId File the operations apply to.
 * @param {{ width: number, height: number }} to New size.
 * @returns {Array<object>} Operations.
 */
export function formatOperations(doc, fileId, to) {
	const root = doc.nodes[doc.rootId];
	const from = postSize(doc);
	const operations = [];
	for (const id of root.children) {
		const node = doc.nodes[id];
		if (!node || node.type === 'text' || String(node.style?.position).trim() !== 'absolute') continue;
		const box = boxOf(node);
		if ([box.x, box.y, box.width, box.height].some((value) => value === null)) continue;
		const style = node.style;
		const layer = { ...box, pinX: node.props?.['data-pin-x'] || 'auto', pinY: node.props?.['data-pin-y'] || 'auto', fontSize: px(style['font-size']) ?? undefined, letterSpacing: px(style['letter-spacing']) ?? undefined, radius: px(style['border-radius']) || 0 };
		const next = resizeLayer(layer, from, to);
		const value = { ...style, left: `${next.x}px`, top: `${next.y}px`, width: `${next.width}px`, height: `${next.height}px` };
		if (next.fontSize !== undefined) value['font-size'] = `${next.fontSize}px`;
		if (next.letterSpacing !== undefined) value['letter-spacing'] = `${next.letterSpacing}px`;
		if (next.radius !== undefined) value['border-radius'] = `${next.radius}px`;
		operations.push({ file: fileId, op: 'setField', id, key: 'style', value });
		if (node.placements?.absolute) {
			const { absolute, ...rest } = node.placements;
			operations.push({ file: fileId, op: 'setField', id, key: 'placements', value: rest });
		}
	}
	operations.push({ file: fileId, op: 'setField', id: root.id, key: 'style', value: { ...root.style, width: `${to.width}px`, height: `${to.height}px` } });
	return operations;
}

/**
 * The file's document at another format, for previews and export. Only the
 * resized nodes are copied; the rest are shared with `file.doc`, so this is
 * cheap enough to run for every format on every frame of a drag. Clone it
 * before editing it.
 *
 * @param {object} file Designer file.
 * @param {{ width: number, height: number }} to Size.
 * @returns {object} Document.
 */
export function resizedDocument(file, to) {
	const doc = { ...file.doc, nodes: { ...file.doc.nodes } };
	for (const operation of formatOperations(file.doc, file.id, to)) {
		doc.nodes[operation.id] = { ...doc.nodes[operation.id], [operation.key]: operation.value };
	}
	return doc;
}

/**
 * The post's markup: the file's template without the `<template>` wrapper.
 *
 * @param {object} file Designer file.
 * @returns {string} HTML.
 */
export function postMarkup(file) {
	const source = exportFile(file);
	const match = /<template>([\s\S]*)<\/template>/.exec(source);
	return (match ? match[1] : source).trim();
}

/** Google Fonts stylesheets for the fonts a post uses. */
export function postFontLinks(doc) {
	return googleFontLinks(Object.values(doc.nodes).filter((node) => node.style?.['font-family']).map((node) => ({ fontFamily: node.style['font-family'], fontWeight: node.style['font-weight'] })));
}

/**
 * A standalone HTML document for a post, as the poster export writes one.
 *
 * @param {object} file Designer file.
 * @returns {string} HTML document.
 */
export function exportPostHtml(file) {
	const root = file.doc.nodes[file.doc.rootId];
	const title = root?.props?.['aria-label'] || 'Social post';
	const fonts = postFontLinks(file.doc).map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('');
	return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>${fonts}<style>body{margin:0}*{box-sizing:border-box}@media print{@page{margin:0}body{print-color-adjust:exact}}</style></head>\n<body>\n${postMarkup(file)}\n</body>\n</html>`;
}
