import { frameLayoutStyle, createFrameLayout } from '../frame/frameLayout.js';

const containers = new Set('div section main article aside header footer nav ul ol li figure figcaption form fieldset blockquote'.split(' '));
const tags = new Set([...containers, ...'h1 h2 h3 h4 h5 h6 p span strong em b i u s small code pre a button img br hr label input textarea select option details summary time'.split(' ')]);
const voidTags = new Set(['img', 'br', 'hr', 'input']);
const attributes = new Set('class id title alt src href role type placeholder value name width height loading datetime'.split(' '));
let sequence = 0;

/** Allocates identities independently of source HTML ids, including across repeated imports. */
export function frameId() { return `frame-node-${++sequence}`; }

/** Creates an application-owned HTML node with independent child layout and parent placement. */
export function createFrameNode(options = {}) {
	return { id: frameId(), tag: 'div', attrs: {}, style: {}, layout: null, placements: {}, children: [], ...options };
}

/** Identifies elements which can expose container layout controls in the demo. */
export function isFrameNode(node) { return containers.has(node?.tag); }

/** Produces a flat tree for selection, with the immediate parent preserved. */
export function flattenFrames(node, parent = null, depth = 0) {
	return [{ node, parent, depth }, ...(node.children || []).flatMap((child) => flattenFrames(child, node, depth + 1))];
}

/** Supplies literal class candidates to the existing compiler without HTML-encoding arbitrary variants. */
export function frameTailwindContent(root) {
	return flattenFrames(root).flatMap(({ node }) => String(node.attrs?.class || '').split(/\s+/).filter(Boolean)).map((token) => {
		const quote = ['"', "'", '`'].find((character) => !token.includes(character));
		if (!quote) throw new Error('A utility class contains an unsupported combination of quotes.');
		return `class=${quote}${token}${quote}`;
	}).join('\n');
}

/** Permits ordinary navigation and raster images without importing executable URL schemes. */
function safeUrl(value, image) {
	const clean = value.replace(/[\u0000-\u0020\u007f]/g, '');
	if (image && /^data:image\/(png|jpeg|gif|webp);base64,[a-z\d+/=]+$/i.test(clean)) return true;
	if (/^(https?:|\/|#|\.\/|\.\.\/)/i.test(clean)) return true;
	return !/^[a-z][a-z\d+.-]*:/i.test(clean);
}

/** Parses an inert template into a bounded, allowlisted native HTML tree; no source code executes. */
export function importFrameHtml(html, document) {
	if (html.length > 100000) throw new Error('Use an HTML fragment under 100 KB.');
	const template = document.createElement('template');
	template.innerHTML = html;
	let count = 0;
	let removed = 0;
	/** Converts safe elements and literal text while preserving mixed-content whitespace. */
	function visit(element, depth = 0) {
		if (++count > 1500 || depth > 40) throw new Error('Use fewer than 1,500 nodes and 40 nesting levels.');
		if (element.nodeType === 3) return createFrameNode({ tag: '#text', text: element.textContent });
		if (element.nodeType !== 1) return null;
		const tag = element.tagName.toLowerCase();
		if (!tags.has(tag)) { removed++; return null; }
		const attrs = {};
		for (const attr of element.attributes) {
			if (!attributes.has(attr.name) && !/^aria-[a-z-]+$/.test(attr.name)) { if (attr.name !== 'style') removed++; continue; }
			if ((attr.name === 'src' || attr.name === 'href') && !safeUrl(attr.value, attr.name === 'src')) { removed++; continue; }
			if (attr.name === 'class') {
				attrs.class = attr.value.split(/\s+/).filter((token) => !/url\(|expression\(|javascript:|@import/i.test(token)).join(' ');
			} else attrs[attr.name] = attr.value;
		}
		const style = {};
		for (const key of element.style) {
			const value = element.style.getPropertyValue(key);
			if (/url\s*\(|expression\s*\(|@import|\\|\/\*/i.test(value) || key.startsWith('--') || /^(behavior|-moz-binding)$/i.test(key)) { removed++; continue; }
			style[key] = value + (element.style.getPropertyPriority(key) ? ' !important' : '');
		}
		return createFrameNode({ tag, attrs, style, children: [...element.childNodes].map((child) => visit(child, depth + 1)).filter(Boolean) });
	}
	const children = [...template.content.childNodes].map((child) => visit(child)).filter((node) => node && (node.tag !== '#text' || node.text.trim()));
	if (!children.length) throw new Error('Paste some supported HTML elements to import.');
	const root = children.length === 1 && isFrameNode(children[0]) ? children[0] : createFrameNode({ children });
	return { root, removed };
}

/** Applies managed layout above source utilities while leaving unrelated source styling intact. */
export function frameNodeStyle(node, parent) {
	const style = { ...node.style };
	if (node.layout) {
		for (const [key, value] of Object.entries(frameLayoutStyle(node.layout))) style[key] = `${value} !important`;
	}
	if (node.absoluteHeight && node.layout?.mode === 'absolute') style.height = `${node.absoluteHeight}px !important`;
	if (parent?.layout) {
		if (parent.layout.mode === 'absolute') {
			Object.assign(style, { position: 'absolute !important', margin: '0px !important', inset: 'auto !important', boxSizing: 'border-box', flex: 'none !important' });
			for (const [key, value] of Object.entries(node.placements?.absolute || { left: 24, top: 24, width: 160, height: 100 })) style[key] = `${value}px !important`;
		} else {
			Object.assign(style, { position: 'relative !important', inset: 'auto !important' });
			if (node.sourceAbsolute) Object.assign(style, { width: 'auto !important', height: node.absoluteHeight ? `${node.absoluteHeight}px !important` : 'auto !important' });
		}
	}
	return style;
}

/** Escapes literal source content for safe HTML projection. */
function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

/** Exports actual native markup, without selection markers, layer ids or designer components. */
export function exportFrameHtml(node, parent = null) {
	if (node.tag === '#text') return escapeHtml(node.text);
	const style = Object.entries(frameNodeStyle(node, parent)).map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`).join(';');
	const attrs = Object.entries({ ...node.attrs, ...(style ? { style } : {}) }).map(([key, value]) => ` ${key}="${escapeHtml(value)}"`).join('');
	const open = `<${node.tag}${attrs}>`;
	if (voidTags.has(node.tag)) return open;
	return `${open}${node.children.map((child) => exportFrameHtml(child, node)).join('')}</${node.tag}>`;
}

/** Builds a deterministic nested absolute → flex → absolute composition for the initial demo. */
export function createFrameDemo() {
	/** Creates a coloured content tile without coupling it to its parent's layout mode. */
	function tile(label, left, top) {
		return createFrameNode({ tag: 'p', attrs: { class: 'rounded-lg bg-primary p-3 text-sm font-medium text-primary-fg' }, placements: { absolute: { left, top, width: 120, height: 48 } }, children: [createFrameNode({ tag: '#text', text: label })] });
	}
	const composition = createFrameNode({ label: 'Absolute composition', layout: createFrameLayout({ mode: 'absolute', padding: 16 }), attrs: { class: 'rounded-xl border border-border bg-secondary' }, style: { flex: '1', minWidth: '240px', height: '240px' }, children: [tile('Move me', 16, 24), tile('Same gap', 16, 88), tile('Snap here', 16, 152)] });
	const copy = createFrameNode({ label: 'Flow content', layout: createFrameLayout({ mode: 'flow' }), style: { width: '220px' }, children: [createFrameNode({ tag: 'h2', attrs: { class: 'text-3xl font-semibold tracking-tight' }, children: [createFrameNode({ tag: '#text', text: 'A frame inside a frame.' })] }), createFrameNode({ tag: 'p', attrs: { class: 'mt-4 text-sm leading-6 text-muted-fg' }, children: [createFrameNode({ tag: '#text', text: 'This row uses flex. The panel beside it has its own absolute layout. Select a frame and change how it arranges its children.' })] })] });
	const row = createFrameNode({ label: 'Flex row', layout: createFrameLayout({ mode: 'flex', gap: 24, padding: 24, align: 'center' }), attrs: { class: 'rounded-2xl border border-border bg-canvas shadow-sm' }, placements: { absolute: { left: 40, top: 90, width: 660, height: 320 } }, children: [copy, composition] });
	const root = createFrameNode({ label: 'Absolute canvas', layout: createFrameLayout({ mode: 'absolute' }), style: { minHeight: '520px', width: '100%' }, children: [row] });
	// Stable initial identities also keep repeated SSR requests aligned with hydration.
	flattenFrames(root).forEach(({ node }, index) => { node.id = `demo-frame-${index}`; });
	return root;
}

export const tailwindFrameExample = `<section class="mx-auto max-w-4xl p-6 md:p-10">
	<div class="mb-6 flex items-center justify-between gap-4">
		<div><p class="text-sm text-indigo-600">Workspace</p><h1 class="text-3xl font-semibold tracking-tight">A quieter place to work.</h1></div>
		<button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">New project</button>
	</div>
	<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
		<article class="rounded-xl border border-slate-200 bg-white p-5 text-slate-900"><p class="text-sm text-slate-500">In progress</p><h2 class="mt-3 text-xl font-semibold">Website refresh</h2><p class="mt-3 text-sm leading-6">A useful home for the things we make.</p></article>
		<article class="rounded-xl border border-slate-200 bg-white p-5 text-slate-900"><p class="text-sm text-slate-500">Review</p><h2 class="mt-3 text-xl font-semibold">Mobile experience</h2><p class="mt-3 text-sm leading-6">Small details. A much better daily flow.</p></article>
		<article class="relative min-h-48 rounded-xl bg-indigo-600 p-5 text-white"><span class="absolute left-5 top-5 text-sm">Free composition</span><strong class="absolute bottom-5 left-5 text-2xl">Make room<br>for ideas.</strong></article>
	</div>
</section>`;
