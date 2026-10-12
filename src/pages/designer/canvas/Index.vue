<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { DomButton, DomDesignerLayers, DomDesignerStage, DomFrameLayoutEditor, DomNativeSelect, DomNumberInput, DomTextInput, DomTextareaInput } from '../../lib/vue';
import { componentRegistry, lookupByName } from '../../_layout/inspector/componentRegistry.js';
import { alignFrameChild, createFrameLayout, measureFrameChild, readFrameLayout } from '../frame/frameLayout.js';
import { flattenFrames, isFrameNode } from '../frames/frameDocument.js';
import ArtboardViewport from './ArtboardViewport.vue';
import { CanvasNode } from './CanvasNode.js';
import {
	buildVueFile,
	canvasId,
	canvasTailwindContent,
	cloneWithNewIds,
	createCanvasDemo,
	createCanvasNode,
	createTextNode,
	findNode,
	importVueFile,
	isCanvasContainer,
	sampleVueFile,
	toTemplateLiteral,
} from './canvasDocument.js';

/**
 * Canvas: the first slice of the DOM designer.
 *
 * Figma-style pan and zoom over artboards, where every artboard is real HTML
 * rendered by Vue in its own iframe. Artboards are views of Vue files, so the
 * same component can be designed at several widths at once. Files import from,
 * and export back to, Vue SFC source with the original script and style kept.
 */

const STORAGE_KEY = 'dom-studio-canvas-v1';
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const artboardPresets = [
	{ label: 'Mobile', width: 390 },
	{ label: 'Tablet', width: 768 },
	{ label: 'Desktop', width: 1200 },
	{ label: 'Wide', width: 1440 },
];
const primitives = [
	{ id: 'frame', label: 'Frame', description: 'Flex container', create: () => createCanvasNode({ tag: 'div', label: 'Frame', layout: createFrameLayout({ mode: 'flex', gap: 12, padding: 16 }), attrs: { class: 'rounded-xl border border-border' }, placements: { absolute: { left: 24, top: 24, width: 280, height: 160 } } }) },
	{ id: 'section', label: 'Section', description: 'Padded page section', create: () => createCanvasNode({ tag: 'section', attrs: { class: 'space-y-4 p-6' }, children: [createCanvasNode({ tag: 'h2', attrs: { class: 'text-2xl font-semibold tracking-tight' }, children: [createTextNode('Section title')] })] }) },
	{ id: 'heading', label: 'Heading', description: 'h2', create: () => createCanvasNode({ tag: 'h2', attrs: { class: 'text-2xl font-semibold tracking-tight' }, placements: { absolute: { left: 24, top: 24, width: 240, height: 40 } }, children: [createTextNode('Heading')] }) },
	{ id: 'text', label: 'Text', description: 'Paragraph', create: () => createCanvasNode({ tag: 'p', attrs: { class: 'text-sm leading-6 text-muted-fg' }, placements: { absolute: { left: 24, top: 24, width: 240, height: 48 } }, children: [createTextNode('Write something useful.')] }) },
	{ id: 'image', label: 'Image', description: 'img', create: () => createCanvasNode({ tag: 'img', attrs: { src: 'https://placehold.co/480x320', alt: '', class: 'w-full rounded-xl' }, placements: { absolute: { left: 24, top: 24, width: 240, height: 160 } } }) },
	{ id: 'link', label: 'Link', description: 'a', create: () => createCanvasNode({ tag: 'a', attrs: { href: '#', class: 'text-sm font-medium text-primary underline underline-offset-4' }, placements: { absolute: { left: 24, top: 24, width: 120, height: 24 } }, children: [createTextNode('Learn more')] }) },
];

const doc = ref(createCanvasDemo());
const activeArtboardId = ref(doc.value.artboards[0].id);
const selected = ref('');
const css = ref('');
const compilerNotice = ref('');
const notice = ref('');
const zoom = ref(0.5);
const pan = ref({ x: 48, y: 72 });
const panning = ref(false);
const spaceHeld = ref(false);
const leftTab = ref('layers');
const insertQuery = ref('');
const showImport = ref(false);
const showCode = ref(false);
const importDraft = ref(sampleVueFile);
const importName = ref('Component.vue');
const snapping = ref(true);
const newAttribute = ref({ name: '', value: '' });
const detected = ref({});
const past = ref([]);
const future = ref([]);
const viewport = ref(null);
const artboardRefs = new Map();
let lastSnapshot = snapshot();
let historyTimer;
let saveTimer;
let compileTimer;
let compiledContent = '';
let gesture = null;
let disposed = false;

const artboards = computed(() => doc.value.artboards);
const activeArtboard = computed(() => artboards.value.find((board) => board.id === activeArtboardId.value) || artboards.value[0]);
const activeFile = computed(() => doc.value.files.find((file) => file.id === activeArtboard.value?.fileId) || doc.value.files[0]);
const entries = computed(() => (activeFile.value ? flattenFrames(activeFile.value.root) : []));
const activeEntry = computed(() => entries.value.find(({ node }) => node.id === selected.value) || null);
const active = computed(() => activeEntry.value?.node || null);
const parent = computed(() => activeEntry.value?.parent || null);
const layout = computed(() => active.value?.layout || detected.value[selected.value] || createFrameLayout());
const parentMode = computed(() => parent.value?.layout?.mode || detected.value[parent.value?.id]?.mode || 'flow');
const textNode = computed(() => (active.value?.children?.length === 1 && active.value.children[0].tag === '#text' && !active.value.children[0].expression ? active.value.children[0] : null));
const layers = computed(() => (activeFile.value ? [layer(activeFile.value.root)] : []));
const fileSource = computed(() => (activeFile.value ? buildVueFile(activeFile.value, isStudioComponent) : ''));
const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`);
const insertableComponents = computed(() => {
	const query = insertQuery.value.trim().toLowerCase();
	return componentRegistry
		.filter((entry) => entry.component && typeof entry.component === 'object' && entry.componentName)
		.filter((entry) => !query || `${entry.label} ${entry.componentName} ${entry.group}`.toLowerCase().includes(query))
		.slice(0, 80);
});
const attributeEntries = computed(() => Object.entries(active.value?.attrs || {}).filter(([key]) => key !== 'class'));
const geometry = computed(() => {
	if (active.value?.placements?.absolute) return active.value.placements.absolute;
	const element = activeViewport()?.element(selected.value);
	const host = activeViewport()?.element(parent.value?.id);
	return element && host ? measureFrameChild(element, host) : {};
});

/** Serialises the document for undo and local persistence. */
function snapshot() { return JSON.stringify(doc.value); }

/** Builds layer tree items, hiding whitespace text so the tree mirrors what designers see. */
function layer(node) {
	const label = node.label || (node.component ? node.tag : `${node.tag}${node.attrs?.id ? ` #${node.attrs.id}` : ''}`);
	const flags = node.directives?.filter((source) => /^v-(if|else|for)/.test(source)).map((source) => source.split('=')[0]) || [];
	return {
		id: node.id,
		label: flags.length ? `${label} · ${flags.join(' ')}` : label,
		open: true,
		acceptsChildren: isCanvasContainer(node),
		children: node.children.filter((child) => child.tag !== '#text').map(layer),
	};
}

/** Shared empty map; a fresh `{}` per render would re-render inactive artboards forever. */
const noDetectedLayouts = Object.freeze({});
const componentCache = new Map();

/** Resolves a template tag to a live DOM Studio component, or null for a placeholder. Cached: registry lookup is linear. */
function resolveComponent(tag) {
	if (!componentCache.has(tag)) {
		const entry = lookupByName(tag);
		componentCache.set(tag, entry && typeof entry.component === 'object' ? entry.component : null);
	}
	return componentCache.get(tag);
}

/** Only DOM Studio components get an import line in newly created files. */
function isStudioComponent(tag) {
	const entry = lookupByName(tag);
	return !!entry && typeof entry.component === 'object' && entry.componentName === tag;
}

/** Returns the viewport of the active artboard, which supplies measurements. */
function activeViewport() { return artboardRefs.get(activeArtboard.value?.id) || null; }

/** Stores artboard viewport refs by id; Vue passes null on unmount. */
function setArtboardRef(id, instance) {
	if (instance) artboardRefs.set(id, instance);
	else artboardRefs.delete(id);
}

/* History ---------------------------------------------------------------- */

/** Records one undo point after a burst of edits. */
function commitHistory() {
	clearTimeout(historyTimer);
	const next = snapshot();
	if (next === lastSnapshot) return;
	past.value = [...past.value.slice(-59), lastSnapshot];
	future.value = [];
	lastSnapshot = next;
}
/** Debounces continuous input (typing, dragging) into a single undo point. */
function queueHistory() {
	clearTimeout(historyTimer);
	historyTimer = setTimeout(commitHistory, 300);
	queueSave();
	queueCompile();
}
/** Restores a snapshot, keeping the selection when the node still exists. */
function restore(value) {
	doc.value = JSON.parse(value);
	lastSnapshot = value;
	if (!artboards.value.some((board) => board.id === activeArtboardId.value)) activeArtboardId.value = artboards.value[0]?.id;
	if (!entries.value.some(({ node }) => node.id === selected.value)) selected.value = '';
	refresh();
}
function undo() { commitHistory(); if (past.value.length) { future.value.push(lastSnapshot); restore(past.value.pop()); } }
function redo() { if (future.value.length) { past.value.push(lastSnapshot); restore(future.value.pop()); } }

/** Wraps a structural edit in its own undo point. */
function edit(change) {
	commitHistory();
	change();
	commitHistory();
	refresh();
}

/* Persistence and styles --------------------------------------------------- */

/** Saves the canvas in this browser only; storage failures leave the session working. */
function queueSave() {
	clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		try { window.localStorage.setItem(STORAGE_KEY, snapshot()); } catch { /* Private mode or quota: keep working in memory. */ }
	}, 500);
}

/** Loads a saved canvas, ignoring anything that does not look like one. */
function loadSaved() {
	try {
		const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
		if (saved?.files?.length && saved?.artboards?.length) return saved;
	} catch { /* Corrupt or blocked storage falls back to the demo. */ }
	return null;
}

/** Compiles utilities used by imported files so arbitrary Tailwind classes render in artboards. */
function queueCompile() {
	clearTimeout(compileTimer);
	compileTimer = setTimeout(compileCss, 400);
}
async function compileCss() {
	const content = canvasTailwindContent(doc.value.files);
	if (!content || content === compiledContent) return;
	compiledContent = content;
	try {
		const response = await fetch('/api/experiments/template-editor/tailwind.css', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });
		if (!response.ok) throw new Error('unavailable');
		const text = await response.text();
		if (!disposed) { css.value = text; compilerNotice.value = ''; }
	} catch {
		if (!disposed) compilerNotice.value = 'On-demand Tailwind is off here, so classes outside DOM Studio’s stylesheet may not render.';
	}
}

/* Layout detection and geometry ------------------------------------------- */

/** Reads each frame's resolved layout in the active artboard after the DOM settles. */
async function refresh() {
	await nextTick();
	if (disposed) return;
	const view = activeViewport();
	const next = {};
	for (const { node } of entries.value) {
		const element = view?.element(node.id);
		if (isFrameNode(node) && element) next[node.id] = readFrameLayout(element);
	}
	detected.value = next;
}

/** Captures each child's box so switching a frame to absolute keeps things where they are. */
function captureChildren(node) {
	const view = activeViewport();
	const element = view?.element(node.id);
	if (!element) return;
	for (const child of node.children) {
		const target = view.element(child.id);
		if (target) child.placements.absolute = measureFrameChild(target, element);
	}
}

/** Changes a frame's child layout, preserving geometry when entering absolute mode. */
async function setLayout(value) {
	const node = active.value;
	if (!node || !isFrameNode(node)) return;
	commitHistory();
	const oldMode = node.layout?.mode || detected.value[node.id]?.mode;
	if (value.mode === 'absolute' && oldMode !== 'absolute') {
		node.children = node.children.filter((child) => child.tag !== '#text' || child.text.trim()).map((child) => (child.tag === '#text' ? createCanvasNode({ tag: 'span', children: [child] }) : child));
		await nextTick();
		const element = activeViewport()?.element(node.id);
		if (element) node.absoluteHeight ??= element.offsetHeight;
		captureChildren(node);
	}
	node.layout = value;
	commitHistory();
	refresh();
}

/** Applies stage drags and resizes to the document; a source-absolute parent is adopted first. */
function patch({ id, style }) {
	const entry = findNode(activeFile.value.root, id);
	if (!entry?.parent) return;
	if (!entry.parent.layout) {
		captureChildren(entry.parent);
		entry.parent.layout = detected.value[entry.parent.id] || createFrameLayout({ mode: 'absolute' });
	}
	entry.node.placements.absolute = Object.fromEntries(['left', 'top', 'width', 'height'].map((key) => [key, parseFloat(style[key])]));
}

/** Numeric geometry edits for absolute children. */
function setGeometry(key, value) {
	if (value === '' || !Number.isFinite(Number(value)) || !active.value || !parent.value) return;
	if (!parent.value.layout) { captureChildren(parent.value); parent.value.layout = detected.value[parent.value.id] || createFrameLayout({ mode: 'absolute' }); }
	if (!active.value.placements.absolute) captureChildren(parent.value);
	active.value.placements.absolute[key] = ['width', 'height'].includes(key) ? Math.max(16, Number(value)) : Number(value);
}

/** Aligns the selection inside its frame. */
function align(alignment) {
	const view = activeViewport();
	const host = parent.value;
	const element = view?.element(host?.id);
	const child = view?.element(selected.value);
	if (!element || !child) return;
	edit(() => {
		if (!host.layout) { captureChildren(host); host.layout = detected.value[host.id] || createFrameLayout({ mode: 'absolute' }); }
		active.value.placements.absolute = alignFrameChild(measureFrameChild(child, element), { width: element.clientWidth, height: element.clientHeight }, alignment, host.layout.padding);
	});
}

/** Sets a CSS length on the selection, rejecting values that are not valid CSS. */
function setSize(key, value) {
	const clean = String(value).trim();
	if (!clean) { delete active.value.style[key]; return; }
	if (!CSS.supports(key, clean) || /url|expression|[;{}]/i.test(clean)) return;
	active.value.style[key] = clean;
}

/* Structure ----------------------------------------------------------------- */

/** Inserts inside the selected container, or after the selected leaf. */
function insert(node) {
	if (!activeFile.value) return;
	edit(() => {
		const target = active.value && isCanvasContainer(active.value) ? active.value : parent.value || activeFile.value.root;
		if (!target.layout && detected.value[target.id]?.mode === 'absolute') { captureChildren(target); target.layout = detected.value[target.id]; }
		if (active.value && !isCanvasContainer(active.value) && parent.value === target) target.children.splice(target.children.indexOf(active.value) + 1, 0, node);
		else target.children.push(node);
		selected.value = node.id;
	});
}

/** Creates a component node from the registry's starter props. */
function insertComponent(entry) {
	const attrs = {};
	const bindings = {};
	for (const [key, value] of Object.entries(entry.defaults?.props || {})) {
		if (value === undefined || typeof value === 'function') continue;
		if (typeof value === 'string') attrs[key] = value;
		else bindings[key] = toTemplateLiteral(value);
	}
	const children = entry.defaults?.text ? [createTextNode(entry.defaults.text)] : [];
	insert(createCanvasNode({ tag: entry.componentName, component: true, attrs, bindings, children, placements: { absolute: { left: 24, top: 24, width: 240, height: 64 } } }));
}

/** Removes the selection; the file root stays so every artboard has something to render. */
function remove() {
	if (!parent.value) return;
	const host = parent.value;
	edit(() => {
		host.children = host.children.filter((child) => child.id !== selected.value);
		selected.value = host.id;
	});
}

/** Duplicates the selection next to itself with fresh ids. */
function duplicate() {
	if (!parent.value) return;
	const host = parent.value;
	const copy = cloneWithNewIds(active.value);
	if (copy.placements?.absolute) copy.placements.absolute = { ...copy.placements.absolute, left: copy.placements.absolute.left + 16, top: copy.placements.absolute.top + 16 };
	edit(() => {
		host.children.splice(host.children.indexOf(active.value) + 1, 0, copy);
		selected.value = copy.id;
	});
}

/** Moves the selection earlier or later among its siblings. */
function reorder(direction) {
	const siblings = parent.value?.children;
	if (!siblings) return;
	const index = siblings.indexOf(active.value);
	const target = index + direction;
	if (target < 0 || target >= siblings.length) return;
	edit(() => { [siblings[index], siblings[target]] = [siblings[target], siblings[index]]; });
}

/** Applies a drag in the layer tree to the document. */
function moveLayer(event) {
	const root = activeFile.value?.root;
	const source = findNode(root, String(event.sourceValue));
	const target = findNode(root, String(event.targetValue));
	if (!source?.parent || !target || source.node === target.node) return;
	if (flattenFrames(source.node).some(({ node }) => node === target.node)) return;
	edit(() => {
		source.parent.children = source.parent.children.filter((child) => child !== source.node);
		if (event.position === 'inside' && isCanvasContainer(target.node)) target.node.children.push(source.node);
		else if (target.parent) {
			const list = target.parent.children;
			list.splice(list.indexOf(target.node) + (event.position === 'after' ? 1 : 0), 0, source.node);
		} else target.node.children.push(source.node);
		selected.value = source.node.id;
	});
}

/** Adds or overwrites a static attribute or prop. */
function addAttribute() {
	const name = newAttribute.value.name.trim();
	if (!/^[A-Za-z_:][\w:.-]*$/.test(name) || /^on/i.test(name) || !active.value) return;
	edit(() => { active.value.attrs[name] = newAttribute.value.value; });
	newAttribute.value = { name: '', value: '' };
}

/** Removes a static attribute or binding from the selection. */
function removeAttribute(key, kind = 'attrs') {
	edit(() => { delete active.value[kind][key]; });
}

/* Files and artboards ------------------------------------------------------- */

/** Adds an artboard for the active file to the right of the existing ones. */
function addArtboard(preset) {
	const right = Math.max(0, ...artboards.value.map((board) => board.x + board.width + 80));
	const board = { id: canvasId('board'), fileId: activeFile.value.id, name: preset.label, x: right, y: 0, width: preset.width, height: 760 };
	edit(() => { doc.value.artboards.push(board); activeArtboardId.value = board.id; });
	nextTick(() => focusArtboard(board));
}

/** Removes an artboard; its file is removed too when no other artboard shows it. */
function removeArtboard(board) {
	if (artboards.value.length < 2) return;
	edit(() => {
		doc.value.artboards = artboards.value.filter((item) => item.id !== board.id);
		if (!doc.value.artboards.some((item) => item.fileId === board.fileId)) doc.value.files = doc.value.files.filter((file) => file.id !== board.fileId);
		activeArtboardId.value = doc.value.artboards[0].id;
		selected.value = '';
	});
}

/** Starts a blank Vue file with one desktop artboard. */
function newFile() {
	const root = createCanvasNode({ tag: 'section', attrs: { class: 'min-h-full space-y-4 bg-canvas p-8 text-canvas-fg' }, children: [createCanvasNode({ tag: 'h1', attrs: { class: 'text-3xl font-semibold tracking-tight' }, children: [createTextNode('Untitled page')] })] });
	addFile({ id: canvasId('file'), name: `Page${doc.value.files.length + 1}.vue`, root, script: '', style: '' });
}

/** Adds a file and a desktop artboard for it below the current artboards. */
function addFile(file) {
	const bottom = Math.max(0, ...artboards.value.map((board) => board.y + (artboardRefs.get(board.id)?.$el?.offsetHeight || board.height) + 160));
	const board = { id: canvasId('board'), fileId: file.id, name: file.name.replace(/\.vue$/, ''), x: 0, y: bottom, width: 1200, height: 760 };
	edit(() => {
		doc.value.files.push(file);
		doc.value.artboards.push(board);
		activeArtboardId.value = board.id;
		selected.value = file.root.id;
	});
	nextTick(() => focusArtboard(board));
}

/** Imports pasted or uploaded Vue/HTML as a new file, or into the active file. */
function importSource(replace = false) {
	try {
		const name = importName.value.trim().replace(/[^\w.-]/g, '') || 'Component.vue';
		const { file, unsupported } = importVueFile(importDraft.value, /\.vue$/.test(name) ? name : `${name}.vue`);
		if (replace && activeFile.value) {
			edit(() => Object.assign(activeFile.value, { root: file.root, script: file.script, style: file.style, name: file.name }));
			selected.value = file.root.id;
		} else addFile(file);
		showImport.value = false;
		notice.value = `${file.name} opened.${unsupported ? ` ${unsupported} unsupported nodes or event attributes were left out.` : ''} Script and style blocks are kept for export.`;
		queueCompile();
	} catch (error) {
		notice.value = error.message;
	}
}

/** Reads a .vue or .html file from disk into the import box. */
function readUpload(event) {
	const file = event.target.files?.[0];
	if (!file) return;
	if (file.size > 200000) { notice.value = 'Use a file under 200 KB.'; return; }
	const reader = new FileReader();
	reader.onload = () => { importDraft.value = String(reader.result || ''); importName.value = file.name.replace(/\.html?$/, '.vue'); };
	reader.readAsText(file);
}

/** Copies the generated SFC. */
async function copySource() {
	try { await navigator.clipboard.writeText(fileSource.value); notice.value = `${activeFile.value.name} copied.`; }
	catch { notice.value = 'Clipboard unavailable. Select the code to copy it.'; }
}

/** Downloads the generated SFC under the file's name. */
function downloadSource() {
	const url = URL.createObjectURL(new Blob([fileSource.value], { type: 'text/plain' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = activeFile.value.name;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Resets to the starter canvas as an undoable action. */
function resetDemo() {
	edit(() => { doc.value = createCanvasDemo(); activeArtboardId.value = doc.value.artboards[0].id; selected.value = ''; });
	nextTick(fitAll);
}

/* Canvas navigation ---------------------------------------------------------- */

/** Zooms around a screen point so the content under the pointer stays put. */
function zoomAt(clientX, clientY, next) {
	const rect = viewport.value.getBoundingClientRect();
	const value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
	const px = clientX - rect.left;
	const py = clientY - rect.top;
	const worldX = (px - pan.value.x) / zoom.value;
	const worldY = (py - pan.value.y) / zoom.value;
	zoom.value = value;
	pan.value = { x: px - worldX * value, y: py - worldY * value };
}

/** Zooms around the viewport centre, for buttons and shortcuts. */
function zoomBy(factor) {
	const rect = viewport.value.getBoundingClientRect();
	zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom.value * factor);
}

/** Trackpad pinch and ctrl/cmd+wheel zoom; plain wheel pans. */
function onWheel(event) {
	event.preventDefault();
	if (event.ctrlKey || event.metaKey) {
		zoomAt(event.clientX, event.clientY, zoom.value * Math.exp(-event.deltaY * (event.deltaMode ? 0.05 : 0.01)));
		return;
	}
	const scale = event.deltaMode ? 16 : 1;
	pan.value = event.shiftKey
		? { x: pan.value.x - event.deltaY * scale, y: pan.value.y }
		: { x: pan.value.x - event.deltaX * scale, y: pan.value.y - event.deltaY * scale };
}

/** Measured artboard boxes in world coordinates. */
function artboardBounds(board) {
	const height = artboardRefs.get(board.id)?.$el?.offsetHeight || board.height;
	return { left: board.x, top: board.y - 28, right: board.x + board.width, bottom: board.y + height };
}

/** Frames a set of artboards in the viewport. */
function frame(boards) {
	if (!viewport.value || !boards.length) return;
	const boxes = boards.map(artboardBounds);
	const left = Math.min(...boxes.map((box) => box.left));
	const top = Math.min(...boxes.map((box) => box.top));
	const width = Math.max(...boxes.map((box) => box.right)) - left;
	const height = Math.max(...boxes.map((box) => box.bottom)) - top;
	const rect = viewport.value.getBoundingClientRect();
	const value = Math.min(1, Math.max(MIN_ZOOM, Math.min((rect.width - 96) / width, (rect.height - 96) / height)));
	zoom.value = value;
	pan.value = { x: (rect.width - width * value) / 2 - left * value, y: Math.max(48, (rect.height - height * value) / 2) - top * value };
}
function fitAll() { frame(artboards.value); }
function focusArtboard(board) { activeArtboardId.value = board.id; frame([board]); }

/** Pans with middle button, space+drag, or a drag on empty canvas. */
function onCanvasPointerdown(event) {
	const empty = event.target === viewport.value || event.target.dataset?.canvasWorld !== undefined;
	if (!(event.button === 1 || spaceHeld.value || (event.button === 0 && empty))) return;
	event.preventDefault();
	gesture = { kind: 'pan', pointer: event.pointerId, x: event.clientX, y: event.clientY, origin: { ...pan.value } };
	panning.value = true;
	viewport.value.setPointerCapture(event.pointerId);
}

/** Drags an artboard by its title. */
function onArtboardTitlePointerdown(event, board) {
	if (event.button !== 0 || spaceHeld.value) return;
	event.preventDefault();
	event.stopPropagation();
	activeArtboardId.value = board.id;
	commitHistory();
	gesture = { kind: 'artboard', board, pointer: event.pointerId, x: event.clientX, y: event.clientY, origin: { x: board.x, y: board.y } };
	viewport.value.setPointerCapture(event.pointerId);
}

function onCanvasPointermove(event) {
	if (!gesture || gesture.pointer !== event.pointerId) return;
	const dx = event.clientX - gesture.x;
	const dy = event.clientY - gesture.y;
	if (gesture.kind === 'pan') pan.value = { x: gesture.origin.x + dx, y: gesture.origin.y + dy };
	else {
		gesture.board.x = Math.round(gesture.origin.x + dx / zoom.value);
		gesture.board.y = Math.round(gesture.origin.y + dy / zoom.value);
	}
}

function onCanvasPointerup(event) {
	if (!gesture || gesture.pointer !== event.pointerId) return;
	if (gesture.kind === 'artboard') commitHistory();
	gesture = null;
	panning.value = false;
	if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId);
}

/** Selection from any artboard also makes that artboard active. */
function selectFromArtboard(board, id) {
	activeArtboardId.value = board.id;
	selected.value = id;
}

/* Keyboard ------------------------------------------------------------------ */

/** True while the user is typing, so shortcuts never steal keystrokes. */
function isTyping(event) {
	const target = event.target;
	return target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
}

function onKeydown(event) {
	if (isTyping(event)) return;
	const mod = event.metaKey || event.ctrlKey;
	if (event.code === 'Space' && !event.repeat) { spaceHeld.value = true; event.preventDefault(); return; }
	if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
	if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return; }
	if (mod && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicate(); return; }
	if (mod && (event.key === '=' || event.key === '+')) { event.preventDefault(); zoomBy(1.25); return; }
	if (mod && event.key === '-') { event.preventDefault(); zoomBy(0.8); return; }
	if (event.shiftKey && event.code === 'Digit1') { event.preventDefault(); fitAll(); return; }
	if (event.shiftKey && event.code === 'Digit0') { event.preventDefault(); zoomBy(1 / zoom.value); return; }
	if ((event.key === 'Delete' || event.key === 'Backspace') && selected.value) { event.preventDefault(); remove(); return; }
	if (event.key === 'Escape' && parent.value) { event.preventDefault(); selected.value = parent.value.id; }
}

function onKeyup(event) {
	if (event.code === 'Space') spaceHeld.value = false;
}

watch(doc, queueHistory, { deep: true, flush: 'sync' });
watch(activeArtboardId, refresh);

onMounted(() => {
	const saved = loadSaved();
	if (saved) {
		doc.value = saved;
		lastSnapshot = snapshot();
		activeArtboardId.value = saved.artboards[0].id;
	}
	window.addEventListener('keydown', onKeydown);
	window.addEventListener('keyup', onKeyup);
	window.addEventListener('blur', () => { spaceHeld.value = false; });
	viewport.value?.addEventListener('wheel', onWheel, { passive: false });
	compileCss();
	setTimeout(fitAll, 120);
});

onBeforeUnmount(() => {
	disposed = true;
	clearTimeout(historyTimer);
	clearTimeout(compileTimer);
	clearTimeout(saveTimer);
	window.removeEventListener('keydown', onKeydown);
	window.removeEventListener('keyup', onKeyup);
	viewport.value?.removeEventListener('wheel', onWheel);
});
</script>

<template>
	<main class="flex min-h-dvh flex-col bg-canvas text-canvas-fg lg:h-dvh lg:min-h-[640px] lg:overflow-hidden">
		<header class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2">
			<div class="flex min-w-0 items-center gap-3">
				<RouterLink to="/designer" class="text-xs text-muted-fg hover:text-primary">← Designer</RouterLink>
				<h1 class="text-sm font-semibold tracking-tight">Canvas <span class="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">Beta</span></h1>
				<span v-if="activeFile" class="hidden truncate font-mono text-xs text-muted-fg sm:inline">{{ activeFile.name }}</span>
			</div>
			<div class="flex flex-wrap items-center gap-1.5">
				<DomButton size="sm" variant="secondary" @click="showImport = !showImport">Open Vue file</DomButton>
				<DomButton size="sm" variant="ghost" @click="newFile">New file</DomButton>
				<span class="mx-1 h-5 w-px bg-border" aria-hidden="true"></span>
				<DomButton size="sm" variant="ghost" :disabled="!past.length" title="Undo (⌘Z)" @click="undo">Undo</DomButton>
				<DomButton size="sm" variant="ghost" :disabled="!future.length" title="Redo (⇧⌘Z)" @click="redo">Redo</DomButton>
			</div>
			<div class="ml-auto flex flex-wrap items-center gap-1.5">
				<label class="mr-2 hidden items-center gap-2 text-xs text-muted-fg md:flex"><input v-model="snapping" type="checkbox">Snap</label>
				<DomButton size="sm" variant="ghost" aria-label="Zoom out" title="Zoom out (⌘−)" @click="zoomBy(0.8)">−</DomButton>
				<button type="button" class="w-14 rounded-md py-1 text-center text-xs tabular-nums text-muted-fg hover:bg-secondary" title="Reset to 100% (⇧0)" @click="zoomBy(1 / zoom)">{{ zoomLabel }}</button>
				<DomButton size="sm" variant="ghost" aria-label="Zoom in" title="Zoom in (⌘+)" @click="zoomBy(1.25)">+</DomButton>
				<DomButton size="sm" variant="ghost" title="Zoom to fit (⇧1)" @click="fitAll">Fit</DomButton>
				<span class="mx-1 h-5 w-px bg-border" aria-hidden="true"></span>
				<DomButton size="sm" :variant="showCode ? 'primary' : 'secondary'" @click="showCode = !showCode">{{ showCode ? 'Hide code' : 'Code' }}</DomButton>
			</div>
		</header>

		<p v-if="notice" role="status" class="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-secondary/40 px-4 py-2 text-sm">
			<span>{{ notice }}</span>
			<button type="button" class="text-xs text-muted-fg hover:text-canvas-fg" @click="notice = ''">Dismiss</button>
		</p>

		<section v-if="showImport" class="shrink-0 space-y-3 border-b border-border p-4">
			<div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
				<DomTextareaInput v-model="importDraft" label="Vue SFC or HTML" :rows="8" description="Paste output from an app generator or your codebase. The template becomes editable layers; script and style blocks are kept as they are and returned on export. Nothing runs." />
				<div class="space-y-3">
					<DomTextInput v-model="importName" label="File name" />
					<label class="block text-sm"><span class="mb-1 block font-medium">Or choose a file</span><input type="file" accept=".vue,.html,.htm,text/html" class="block w-full text-xs" @change="readUpload"></label>
					<div class="flex flex-wrap gap-2">
						<DomButton size="sm" @click="importSource(false)">Open as new file</DomButton>
						<DomButton size="sm" variant="secondary" @click="importSource(true)">Replace current</DomButton>
						<DomButton size="sm" variant="ghost" @click="importDraft = sampleVueFile">Sample</DomButton>
					</div>
				</div>
			</div>
		</section>

		<div class="grid grid-cols-1 lg:min-h-0 lg:flex-1 lg:grid-cols-[16rem_minmax(0,1fr)_19rem]">
			<aside class="order-2 flex max-h-[28rem] min-h-0 flex-col border-t border-border lg:order-none lg:max-h-none lg:border-t-0 lg:border-r">
				<div class="flex shrink-0 gap-1 border-b border-border p-2" role="tablist" aria-label="Left panel">
					<button v-for="tab in ['layers', 'insert']" :key="tab" type="button" role="tab" :aria-selected="leftTab === tab" class="flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition" :class="leftTab === tab ? 'bg-secondary text-canvas-fg' : 'text-muted-fg hover:text-canvas-fg'" @click="leftTab = tab">{{ tab }}</button>
				</div>
				<div v-if="leftTab === 'layers'" class="min-h-0 flex-1 space-y-4 overflow-auto p-3">
					<section>
						<h2 class="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">Artboards</h2>
						<ul class="space-y-0.5">
							<li v-for="board in artboards" :key="board.id">
								<button type="button" class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm transition hover:bg-secondary" :class="board.id === activeArtboard?.id && 'bg-secondary font-medium'" @click="focusArtboard(board)">
									<span class="truncate">{{ board.name }}</span>
									<span class="shrink-0 text-xs tabular-nums text-muted-fg">{{ board.width }}</span>
								</button>
							</li>
						</ul>
					</section>
					<section>
						<h2 class="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">Layers · {{ activeFile?.name }}</h2>
						<DomDesignerLayers v-model="selected" :items="layers" @reorder="moveLayer" />
					</section>
				</div>
				<div v-else class="min-h-0 flex-1 space-y-4 overflow-auto p-3">
					<section>
						<h2 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">HTML</h2>
						<div class="grid grid-cols-2 gap-1.5">
							<button v-for="item in primitives" :key="item.id" type="button" class="rounded-lg border border-border p-2 text-left transition hover:border-primary" @click="insert(item.create())">
								<span class="block text-sm font-medium">{{ item.label }}</span>
								<span class="block text-[11px] text-muted-fg">{{ item.description }}</span>
							</button>
						</div>
					</section>
					<section>
						<h2 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">DOM Studio components</h2>
						<DomTextInput v-model="insertQuery" label="Search components" placeholder="Grid, chart, tabs…" />
						<ul class="mt-2 space-y-0.5">
							<li v-for="entry in insertableComponents" :key="entry.id">
								<button type="button" class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm transition hover:bg-secondary" @click="insertComponent(entry)">
									<span class="truncate">{{ entry.label }}</span>
									<span class="shrink-0 text-[11px] text-muted-fg">{{ entry.group }}</span>
								</button>
							</li>
						</ul>
					</section>
				</div>
			</aside>

			<section class="relative order-1 h-[60vh] min-w-0 overflow-hidden lg:order-none lg:h-auto">
				<div
					ref="viewport"
					class="absolute inset-0 touch-none overflow-hidden bg-secondary/60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)]"
					:class="panning ? 'cursor-grabbing' : spaceHeld ? 'cursor-grab' : ''"
					:style="{ backgroundSize: `${24 * zoom}px ${24 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }"
					@pointerdown="onCanvasPointerdown"
					@pointermove="onCanvasPointermove"
					@pointerup="onCanvasPointerup"
					@pointercancel="onCanvasPointerup"
				>
					<div data-canvas-world class="absolute left-0 top-0 origin-top-left" :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }">
						<div v-for="board in artboards" :key="board.id" class="absolute" :style="{ left: `${board.x}px`, top: `${board.y}px` }">
							<div
								class="absolute bottom-full left-0 flex cursor-move select-none items-center gap-2 whitespace-nowrap pb-2 text-muted-fg"
								:class="board.id === activeArtboard?.id && 'text-primary'"
								:style="{ fontSize: `${12 / zoom}px` }"
								@pointerdown="onArtboardTitlePointerdown($event, board)"
							>
								<span class="font-medium">{{ board.name }}</span>
								<span class="tabular-nums opacity-70">{{ board.width }}</span>
							</div>
							<div class="shadow-lg ring-1" :class="board.id === activeArtboard?.id ? 'ring-primary' : 'ring-border'">
								<ArtboardViewport
									:ref="(instance) => setArtboardRef(board.id, instance)"
									:width="board.width"
									:min-height="board.height"
									:css="css"
									:title="`${board.name} artboard`"
									@ready="board.id === activeArtboard?.id && refresh()"
									@wheel="onWheel"
									@keydown="onKeydown"
									@pointerdown="activeArtboardId = board.id"
								>
									<DomDesignerStage
										:model-value="board.fileId === activeFile?.id ? selected : ''"
										positioning
										frame-scoped
										:snapping="snapping"
										:spacing-snapping="snapping"
										class="bg-canvas text-canvas-fg"
										:style="{ minHeight: `${board.height}px` }"
										@update:model-value="selectFromArtboard(board, $event)"
										@style-change="patch"
									>
										<CanvasNode
											v-if="doc.files.find((file) => file.id === board.fileId)"
											:node="doc.files.find((file) => file.id === board.fileId).root"
											:detected="board.id === activeArtboard?.id ? detected : noDetectedLayouts"
											:resolve-component="resolveComponent"
										/>
									</DomDesignerStage>
								</ArtboardViewport>
							</div>
						</div>
					</div>
					<div v-if="spaceHeld || panning" class="absolute inset-0" aria-hidden="true"></div>
				</div>
				<p v-if="compilerNotice" class="pointer-events-none absolute bottom-3 left-3 max-w-md rounded-md bg-canvas/90 px-3 py-2 text-xs text-muted-fg shadow">{{ compilerNotice }}</p>
				<p class="pointer-events-none absolute bottom-3 right-3 hidden rounded-md bg-canvas/90 px-3 py-2 text-[11px] text-muted-fg shadow md:block">Scroll to pan · ⌘/Ctrl + scroll to zoom · Space + drag · ⇧1 fit</p>

				<aside v-if="showCode" class="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-canvas shadow-xl">
					<div class="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
						<p class="truncate font-mono text-xs">{{ activeFile?.name }}</p>
						<div class="flex gap-1.5">
							<DomButton size="sm" variant="secondary" @click="copySource">Copy</DomButton>
							<DomButton size="sm" variant="secondary" @click="downloadSource">Download</DomButton>
							<DomButton size="sm" variant="ghost" @click="showCode = false">Close</DomButton>
						</div>
					</div>
					<pre class="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-5 [tab-size:2]">{{ fileSource }}</pre>
				</aside>
			</section>

			<aside class="order-3 min-h-0 space-y-5 border-t border-border p-4 lg:order-none lg:overflow-auto lg:border-t-0 lg:border-l">
				<template v-if="active">
					<div>
						<p class="text-xs text-muted-fg">{{ active.component ? 'Vue component' : isFrameNode(active) ? 'Frame' : 'Element' }}</p>
						<h2 class="mt-0.5 font-mono text-sm font-semibold">&lt;{{ active.tag }}&gt;</h2>
						<p class="mt-1 text-xs text-muted-fg">{{ parent ? `Inside ${parent.label || parent.tag} · ${parentMode}` : 'File root' }}</p>
					</div>
					<div v-if="active.directives.length" class="space-y-1">
						<p class="text-xs font-medium">Template logic</p>
						<ul class="flex flex-wrap gap-1"><li v-for="source in active.directives" :key="source" class="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">{{ source }}</li></ul>
						<p class="text-[11px] leading-4 text-muted-fg">Kept on export. The canvas shows every branch and one item of each loop.</p>
					</div>
					<DomTextareaInput v-if="textNode" v-model="textNode.text" label="Text" :rows="3" />
					<DomTextareaInput v-if="active.tag !== 'template'" :model-value="active.attrs.class || ''" label="Classes" :rows="3" description="Tailwind utilities and theme classes." @update:model-value="active.attrs.class = $event" />

					<section class="space-y-2 border-t border-border pt-4">
						<h3 class="text-sm font-semibold">{{ active.component ? 'Props' : 'Attributes' }}</h3>
						<div v-for="[key, value] in attributeEntries" :key="key" class="flex items-end gap-1.5">
							<DomTextInput class="min-w-0 flex-1" :label="key" :model-value="value" @update:model-value="active.attrs[key] = $event" />
							<DomButton size="sm" variant="ghost" :aria-label="`Remove ${key}`" @click="removeAttribute(key)">×</DomButton>
						</div>
						<div v-for="(value, key) in active.bindings" :key="`bind-${key}`" class="flex items-end gap-1.5">
							<DomTextInput class="min-w-0 flex-1 font-mono" :label="`:${key}`" :model-value="value" @update:model-value="active.bindings[key] = $event" />
							<DomButton size="sm" variant="ghost" :aria-label="`Remove :${key}`" @click="removeAttribute(key, 'bindings')">×</DomButton>
						</div>
						<form class="flex items-end gap-1.5" @submit.prevent="addAttribute">
							<DomTextInput v-model="newAttribute.name" class="min-w-0 flex-1" label="Name" placeholder="title" />
							<DomTextInput v-model="newAttribute.value" class="min-w-0 flex-1" label="Value" />
							<DomButton size="sm" type="submit">Add</DomButton>
						</form>
					</section>

					<section v-if="isFrameNode(active)" class="space-y-3 border-t border-border pt-4">
						<h3 class="text-sm font-semibold">Layout</h3>
						<p v-if="!active.layout" class="text-xs leading-5 text-muted-fg">Read from the HTML at {{ activeArtboard?.width }}px. Changing a control adds an explicit override.</p>
						<DomFrameLayoutEditor :model-value="layout" @update:model-value="setLayout" />
					</section>

					<section v-if="parent && parentMode === 'absolute'" class="space-y-3 border-t border-border pt-4">
						<h3 class="text-sm font-semibold">Position in frame</h3>
						<div class="grid grid-cols-2 gap-2"><DomNumberInput v-for="key in ['left', 'top', 'width', 'height']" :key="key" :label="key" :model-value="Math.round(geometry[key] ?? 0)" @update:model-value="setGeometry(key, $event)" /></div>
						<div class="grid grid-cols-3 gap-1"><DomButton v-for="edge in ['left', 'center', 'right', 'top', 'middle', 'bottom']" :key="edge" size="sm" variant="secondary" :aria-label="`Align ${edge}`" @click="align(edge)">{{ edge }}</DomButton></div>
					</section>
					<section v-else-if="parent" class="space-y-3 border-t border-border pt-4">
						<h3 class="text-sm font-semibold">Size and spacing</h3>
						<div class="grid grid-cols-2 gap-2"><DomTextInput v-for="key in ['width', 'height', 'margin-top', 'margin-bottom']" :key="key" :label="key" :model-value="active.style[key] || ''" placeholder="From classes" @update:model-value="setSize(key, $event)" /></div>
					</section>

					<div v-if="parent" class="flex flex-wrap gap-1.5 border-t border-border pt-4">
						<DomButton size="sm" variant="secondary" @click="selected = parent.id">Select parent</DomButton>
						<DomButton size="sm" variant="secondary" @click="reorder(-1)">Earlier</DomButton>
						<DomButton size="sm" variant="secondary" @click="reorder(1)">Later</DomButton>
						<DomButton size="sm" variant="secondary" title="⌘D" @click="duplicate">Duplicate</DomButton>
						<DomButton size="sm" variant="danger" @click="remove">Delete</DomButton>
					</div>
				</template>

				<template v-else-if="activeArtboard">
					<div>
						<p class="text-xs text-muted-fg">Artboard</p>
						<h2 class="mt-0.5 font-semibold">{{ activeArtboard.name }}</h2>
						<p class="mt-1 text-xs text-muted-fg">Select a layer on the canvas or in the layer list.</p>
					</div>
					<DomTextInput v-model="activeArtboard.name" label="Name" />
					<DomNumberInput :model-value="activeArtboard.width" label="Width" :min="240" :max="2560" @update:model-value="Number.isFinite(Number($event)) && (activeArtboard.width = Math.min(2560, Math.max(240, Number($event))))" />
					<DomNativeSelect label="Preset" :model-value="String(activeArtboard.width)" :options="artboardPresets.map((preset) => ({ label: `${preset.label} · ${preset.width}`, value: String(preset.width) }))" @update:model-value="activeArtboard.width = Number($event)" />
					<DomTextInput v-if="activeFile" v-model="activeFile.name" label="File name" />
					<section class="space-y-2 border-t border-border pt-4">
						<h3 class="text-sm font-semibold">Add a breakpoint</h3>
						<p class="text-xs leading-5 text-muted-fg">A new artboard for {{ activeFile?.name }}. Edits show in every artboard of the same file.</p>
						<div class="flex flex-wrap gap-1.5"><DomButton v-for="preset in artboardPresets" :key="preset.width" size="sm" variant="secondary" @click="addArtboard(preset)">{{ preset.label }}</DomButton></div>
					</section>
					<div class="flex flex-wrap gap-1.5 border-t border-border pt-4">
						<DomButton size="sm" variant="secondary" :disabled="artboards.length < 2" @click="removeArtboard(activeArtboard)">Remove artboard</DomButton>
						<DomButton size="sm" variant="ghost" @click="resetDemo">Reset canvas</DomButton>
					</div>
				</template>
			</aside>
		</div>
	</main>
</template>
