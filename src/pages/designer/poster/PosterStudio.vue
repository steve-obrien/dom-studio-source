<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { DomSplitterPanel, DomButton, DomDialog, DomTextInput, DomNativeSelect, DomDesignerLayers, DomDesignerStage } from '../../lib/vue';
import NodeInspector from '../core/NodeInspector.vue';
import CodeView from '../core/CodeView.vue';
import { copySubtree, fromTree } from '../core/editorDocument.js';
import { createHistory } from '../core/history.js';
import { beginPlainTextEdit } from '../core/inlineText.js';
import { applyOperation } from '../core/operations.js';
import { treeFromType } from '../core/typeRegistry.js';
import AlignTools from '../stage/AlignTools.vue';
import DesignerRulers from '../stage/DesignerRulers.vue';
import { alignRects, boundsOf, distributeRects } from '../stage/alignGeometry.js';
import { exportPosterHtml, posterHtmlLines, posterLayerStyle, safePosterImage } from './posterModel.js';
import PosterThumbnail from './PosterThumbnail.vue';
import { formatOperations, formatSource, resizePoster } from './posterResize.js';
import { createTemplateLibrary, posterToTemplate, templateIndustries, templateKinds, templateOperations, templateToPoster } from './socialTemplates.js';
import { createPosterTypes, documentToPoster, posterToDocument } from './posterTypes.js';
import { cssEditorContextKey } from '../_shared/cssEditorContext.js';
import { useGoogleFonts } from '../typography-editor/googleFonts.js';

// Material editors draw as inspector sections here, not cards.
provide(cssEditorContextKey, { framed: computed(() => false), colorVariables: computed(() => ({})) });

/**
 * Poster studio on the editor core. The poster and social-card pages are this
 * component with different starting documents and formats.
 *
 * The document is the source of truth; `documentToPoster` projects it onto the
 * poster model for rendering and HTML export. Every change is an operation in
 * one history, and the inspector is generated from the poster types.
 */
const props = defineProps({
	create: { type: Function, required: true },
	name: { type: String, default: 'Poster studio' },
	guide: { type: String, default: '/designer/assembly#poster' },
	presets: { type: Array, default: () => [] },
	fileName: { type: String, default: 'dom-studio-poster.html' },
	credit: { type: Object, default: null },
	codeOpen: { type: Boolean, default: false },
	initialSelection: { type: String, default: '' },
	frameLabel: { type: String, default: 'Poster' },
	formatsOpen: { type: Boolean, default: false },
	templates: { type: Array, default: () => [] },
	templateStorage: { type: Object, default: null },
	/** Replaces the plain HTML view, e.g. DomMonacoCodeView; gets `codeEditorProps`. */
	codeEditor: { type: [Object, Function], default: null },
	codeEditorProps: { type: Object, default: () => ({}) },
	/** Sits inside a page (such as the homepage): fills its container, drops the site links, and only takes shortcuts while the pointer or focus is inside. */
	embedded: { type: Boolean, default: false },
});

const types = createPosterTypes();
const doc = ref(posterToDocument(props.create()));
const counts = ref({ undo: 0, redo: 0 });
const history = createHistory({ apply: (operation) => applyOperation(doc.value, operation), onChange: () => { counts.value = history.size(); } });
const selected = ref(props.initialSelection || 'frame');
const selection = ref(props.initialSelection ? [props.initialSelection] : []);
const workspace = ref(null);
const root = ref(null);
const pointerInside = ref(false);
const upload = ref(null);
const templateUpload = ref(null);
const artwork = ref(null);
const zoomChoice = ref('fit');
const snapping = ref(true);
const spacingSnapping = ref(false);
const rulers = ref(true);
const leftPanelWidth = ref(220);
const rightPanelWidth = ref(300);
const fitScale = ref(0.3);
const mobilePanel = ref('poster');
const showCode = ref(props.codeOpen);
const showFormats = ref(props.formatsOpen);
const showTemplates = ref(false);
const templateIndustry = ref('all');
const templateKind = ref('all');
const library = props.templateStorage ? createTemplateLibrary(props.templateStorage) : null;
const savedTemplates = ref([]);
const notice = ref('');
const imageErrors = ref({});
const imageUrlDraft = ref('');
/** The text layer being edited on the stage, its text as typed so far, and a count per layer that re-renders it afterwards. */
const editing = shallowRef(null);
const editText = ref(null);
const revisions = ref({});
let observer;
let disposed = false;
let additiveLayerClick = false;

const poster = computed(() => documentToPoster(doc.value));
const frame = computed(() => doc.value.nodes[doc.value.rootId]);
const frameType = types.get('poster:frame');
const active = computed(() => {
	const node = doc.value.nodes[selected.value];
	return node?.parent ? node : null;
});
const activeType = computed(() => active.value && types.get(active.value.type));
const activeLayer = computed(() => active.value && poster.value.layers.find((layer) => layer.id === active.value.id));
const activeIndex = computed(() => (active.value ? frame.value.children.indexOf(active.value.id) : -1));
const selectedNodes = computed(() => selection.value.map((id) => doc.value.nodes[id]).filter((node) => node?.parent));
const movable = computed(() => selectedNodes.value.filter((node) => !node.locked));
const multiple = computed(() => selectedNodes.value.length > 1);
const scale = computed(() => (zoomChoice.value === 'fit' ? fitScale.value : Number(zoomChoice.value)));
const layers = computed(() => poster.value.layers.toReversed().map((layer) => ({ id: layer.id, label: `${layer.name}${layer.locked ? ' · locked' : ''}${layer.hidden ? ' · hidden' : ''}` })));
// While text is edited on the stage, the HTML view shows it as it is typed.
const shownPoster = computed(() => (editing.value && editText.value !== null ? { ...poster.value, layers: poster.value.layers.map((layer) => (layer.id === editing.value.id ? { ...layer, value: editText.value } : layer)) } : poster.value));
const source = computed(() => posterHtmlLines(shownPoster.value));
// Google fonts used by text layers load while the studio is open.
useGoogleFonts(() => poster.value.layers.filter((layer) => layer.type === 'text'));
const sourceText = computed(() => source.value.map((line) => line.text).join('\n'));
// Editor line ranges per source entry; text layers can span several lines.
const sourceRanges = computed(() => {
	let start = 1;
	return source.value.map((line) => {
		const end = start + (line.text.match(/\n/g)?.length || 0);
		const range = { id: line.id, start, end };
		start = end + 1;
		return range;
	});
});
// The selected layer's lines in the HTML view; the frame is its opening tag.
const sourceHighlight = computed(() => {
	const id = selected.value === frame.value?.id ? 'frame' : selected.value;
	const range = sourceRanges.value.find((item) => item.id === id);
	return range ? { start: range.start, end: range.end } : null;
});

/** Selecting a line in the HTML view selects its layer. */
function pickLine(line) {
	const id = sourceRanges.value.find((item) => line >= item.start && line <= item.end)?.id;
	if (id) pickLayer(id);
}
const selectionBox = computed(() => (selectedNodes.value.length ? boundsOf(selectedNodes.value.map(rectOf)) : null));
/** Formats derive from the design as last edited, never from the previous format, so switching never drifts. */
const formatBase = ref(null);
const formatDesign = computed(() => formatSource(formatBase.value, poster.value));
/** The design at every preset size, resized with each layer's pins. */
const previews = computed(() => props.presets.map((preset) => {
	const [width, height] = preset.value.split('x').map(Number);
	return { ...preset, current: preset.value === `${poster.value.width}x${poster.value.height}`, poster: resizePoster(formatDesign.value, { width, height }) };
}));
/** Template filters list only the industries and kinds that have templates. */
const galleryTemplates = computed(() => [...savedTemplates.value.map((template) => ({ ...template, saved: true })), ...props.templates]);
const industryOptions = computed(() => [{ label: `All industries (${galleryTemplates.value.length})`, value: 'all' }, ...templateIndustries.filter((item) => galleryTemplates.value.some((template) => template.industry === item.value)).map((item) => ({ label: `${item.label} (${galleryTemplates.value.filter((template) => template.industry === item.value).length})`, value: item.value }))]);
const kindOptions = computed(() => [{ label: 'All post types', value: 'all' }, ...templateKinds.filter((item) => galleryTemplates.value.some((template) => template.kind === item.value && (templateIndustry.value === 'all' || template.industry === templateIndustry.value))).map((item) => ({ label: item.label, value: item.value }))]);
const visibleTemplates = computed(() => galleryTemplates.value.filter((template) => (templateIndustry.value === 'all' || template.industry === templateIndustry.value) && (templateKind.value === 'all' || template.kind === templateKind.value)).map((template) => ({ ...template, preview: resizePoster(template.poster, { width: poster.value.width, height: poster.value.height }), industryLabel: [template.saved && 'Yours', templateIndustries.find((item) => item.value === template.industry)?.label].filter(Boolean).join(' · ') })));
watch(templateIndustry, () => { if (!kindOptions.value.some((item) => item.value === templateKind.value)) templateKind.value = 'all'; });
const formatOptions = computed(() => {
	const current = `${poster.value.width}x${poster.value.height}`;
	return props.presets.some((preset) => preset.value === current) ? props.presets : [{ label: `Custom · ${poster.value.width} × ${poster.value.height}`, value: current }, ...props.presets];
});

watch(selected, (id) => {
	if (editing.value && id !== editing.value.id) finishTextEdit();
	if (!selection.value.includes(id)) selection.value = doc.value.nodes[id]?.parent ? [id] : [];
});

/* History ------------------------------------------------------------------------ */

/** Applies operations as one undo step; continuous edits pass a merge key. */
function run(operations, options) {
	try {
		history.run(operations, options);
	} catch (error) {
		notice.value = error.message;
	}
}
/** Drops selections of layers an undo or redo removed. */
function settleSelection() {
	selection.value = selection.value.filter((id) => doc.value.nodes[id]);
	if (!doc.value.nodes[selected.value]) selected.value = selection.value[selection.value.length - 1] || 'frame';
}
function undo() { finishTextEdit(); history.undo(); settleSelection(); }
function redo() { finishTextEdit(); history.redo(); settleSelection(); }

/* Editing text in place ----------------------------------------------------------- */

/** Double-click on a text layer: edit its text where it is, as on the designer canvas (see inlineText.js). */
function startTextEdit({ id, element, x, y }) {
	finishTextEdit();
	const node = doc.value.nodes[id];
	if (node?.type !== 'poster:text') return;
	selection.value = [id];
	selected.value = id;
	if (node.locked) { notice.value = 'This layer is locked. Unlock it to edit its text.'; return; }
	const session = beginPlainTextEdit({ element, point: { x, y }, onChange: () => { if (editing.value) editText.value = editing.value.session.text(); }, onEnd: finishTextEdit });
	editing.value = { id, session };
	editText.value = session.text();
}
/** Ends in-place editing, writing the text to the layer as one undo step. */
function finishTextEdit() {
	const current = editing.value;
	if (!current) return;
	editing.value = null;
	editText.value = null;
	const value = current.session.text();
	current.session.stop();
	// The browser changed the element's DOM itself, so it is rendered afresh from the document.
	revisions.value = { ...revisions.value, [current.id]: (revisions.value[current.id] || 0) + 1 };
	const node = doc.value.nodes[current.id];
	if (node && value !== node.props.value) run({ op: 'setProp', id: current.id, key: 'value', value });
}

/* Layers ------------------------------------------------------------------------- */

function rectOf(node) {
	return { id: node.id, left: node.props.x, top: node.props.y, width: node.props.width, height: node.props.height };
}
function setProp(node, key, value, merge = '') {
	run({ op: 'setProp', id: node.id, key, value }, { merge });
}
/** Inspector edits; typing and sliders merge into one undo step per field. */
function onInspector(node, { key, value, merge }) {
	if (node.locked) return;
	if (key === 'value' && editing.value?.id === node.id) finishTextEdit();
	setProp(node, key, value, merge ? `prop:${node.id}:${key}` : '');
}
function setLabel(value) {
	if (!active.value || active.value.locked) return;
	run({ op: 'setField', id: active.value.id, key: 'label', value: String(value) }, { merge: `label:${active.value.id}` });
}
function toggle(field) {
	if (!active.value || (field === 'hidden' && active.value.locked)) return;
	run({ op: 'setField', id: active.value.id, key: field, value: active.value[field] ? undefined : true });
}
/** Adds a text, image or shape layer above the existing artwork. */
function addLayer(type, overrides = {}, label = '') {
	const { width, height } = poster.value;
	const entry = types.get(`poster:${type}`);
	const layerHeight = Math.round(Math.min(entry.defaults.props.height, height / 2));
	const tree = treeFromType(entry, { label: label || entry.label, props: { x: 80, y: Math.round(Math.max(0, height / 3 - layerHeight / 4)), width: Math.max(16, Math.min(920, width - 160)), height: layerHeight, ...overrides } });
	const fragment = fromTree(tree, { parent: frame.value.id });
	run({ op: 'insert', parent: frame.value.id, index: frame.value.children.length, fragment });
	selected.value = fragment.rootId;
	return fragment.rootId;
}
/** Duplicates the selected layer with a fresh id and an offset. */
function duplicate() {
	if (!active.value) return;
	const fragment = copySubtree(doc.value, active.value.id, { freshIds: true });
	const copy = fragment.nodes[fragment.rootId];
	copy.label = `${activeLayer.value.name} copy`;
	delete copy.locked;
	copy.props = { ...copy.props, x: copy.props.x + 30, y: copy.props.y + 30 };
	run({ op: 'insert', parent: frame.value.id, index: activeIndex.value + 1, fragment });
	selected.value = fragment.rootId;
}
/** Deletes the selected unlocked layers; undo restores them. */
function remove() {
	const ids = movable.value.map((node) => node.id);
	if (!ids.length) return;
	run(ids.map((id) => ({ op: 'remove', id })));
	selection.value = [];
	selected.value = 'frame';
}
/** Changes stacking order: forward is towards the viewer. */
function restack(direction) {
	if (!active.value || active.value.locked) return;
	const index = activeIndex.value + direction;
	if (index < 0 || index >= frame.value.children.length) return;
	run({ op: 'move', id: active.value.id, parent: frame.value.id, index });
}
/** Applies a drag in the layer list, which shows layers front to back. */
function moveLayer(event) {
	const source = doc.value.nodes[String(event.sourceValue)];
	const target = doc.value.nodes[String(event.targetValue)];
	if (!source?.parent || !target?.parent || source === target) return;
	const siblings = frame.value.children.filter((id) => id !== source.id);
	const index = siblings.indexOf(target.id) + (event.position === 'after' ? 0 : 1);
	run({ op: 'move', id: source.id, parent: frame.value.id, index });
	selected.value = source.id;
}
/** Shift or Cmd/Ctrl in the layer list adds to the selection. */
function pickLayer(value) {
	const id = String(value);
	if (!doc.value.nodes[id]?.parent) { selection.value = []; selected.value = frame.value.id; return; }
	if (additiveLayerClick && doc.value.nodes[id]?.parent) {
		const base = selection.value.includes(selected.value) || !active.value ? selection.value : [...selection.value, selected.value];
		selection.value = base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
		selected.value = selection.value.includes(id) ? id : selection.value[selection.value.length - 1] || 'frame';
		return;
	}
	selection.value = [id];
	selected.value = id;
}

/* Geometry ----------------------------------------------------------------------- */

/** Applies the stage's CSS geometry to the layer props; locked layers stay put. */
function patch({ id, style }) {
	const node = doc.value.nodes[id];
	if (!node?.parent || node.locked) return;
	const operations = [];
	for (const [css, key] of [['left', 'x'], ['top', 'y'], ['width', 'width'], ['height', 'height']]) {
		const parsed = Number.parseFloat(style[css]);
		if (!Number.isFinite(parsed)) continue;
		const value = key === 'width' || key === 'height' ? Math.max(16, parsed) : parsed;
		if (value !== node.props[key]) operations.push({ op: 'setProp', id, key, value });
	}
	run(operations, { merge: `drag:${selection.value.join(',') || id}` });
}
/** Aligns the selection to itself, or a single layer to the poster. */
function align(alignment) {
	const rects = movable.value.map(rectOf);
	if (!rects.length) return;
	const bounds = rects.length === 1 ? { left: 0, top: 0, width: poster.value.width, height: poster.value.height } : boundsOf(rects);
	moveTo(alignRects(rects, alignment, bounds));
}
function distribute(axis) {
	moveTo(distributeRects(movable.value.map(rectOf), axis));
}
function moveTo(rects) {
	run(rects.flatMap((rect) => {
		const node = doc.value.nodes[rect.id];
		return [['x', rect.left], ['y', rect.top]].filter(([key, value]) => node.props[key] !== value).map(([key, value]) => ({ op: 'setProp', id: rect.id, key, value }));
	}));
}
/** Resizes the frame; each layer follows its pins so the composition holds. */
function setPreset(value) {
	const [width, height] = value.split('x').map(Number);
	if (!props.presets.some((preset) => preset.value === value) || value === `${poster.value.width}x${poster.value.height}`) return;
	finishTextEdit();
	formatBase.value = formatDesign.value;
	run(formatOperations(doc.value, resizePoster(formatBase.value, { width, height })));
	nextTick(fit);
}

/* Templates ---------------------------------------------------------------------- */

/** Replaces the design with a template at the current format; undo brings it back. */
function applyTemplate(template) {
	finishTextEdit();
	const { operations, firstId } = templateOperations(doc.value, template.poster);
	run(operations);
	selection.value = firstId ? [firstId] : [];
	selected.value = firstId || frame.value.id;
	showTemplates.value = false;
	notice.value = `${template.title} applied. Undo to go back to your design.`;
}

/** Loads saved templates each time the gallery opens, so other tabs' saves appear. */
watch(showTemplates, async (open) => {
	if (!open || !library) return;
	try { savedTemplates.value = await library.list(); }
	catch (error) { notice.value = `Saved templates could not load: ${error.message}`; }
});
/** Saves the design as a new template; existing templates are never overwritten. */
async function saveAsTemplate() {
	try {
		const id = await library.saveAs(poster.value, { industry: templateIndustry.value === 'all' ? undefined : templateIndustry.value, kind: templateKind.value === 'all' ? undefined : templateKind.value }, props.templates.map((template) => template.id));
		savedTemplates.value = await library.list();
		notice.value = `Saved as a new template (${id}).`;
	} catch (error) {
		notice.value = `The template could not be saved: ${error.message}`;
	}
}
/** Downloads the design as a template file, tagged with the gallery's current filters. */
function saveTemplate() {
	const template = posterToTemplate(poster.value, { industry: templateIndustry.value === 'all' ? undefined : templateIndustry.value, kind: templateKind.value === 'all' ? undefined : templateKind.value });
	const url = URL.createObjectURL(new Blob([`${JSON.stringify(template, null, '\t')}\n`], { type: 'application/json' }));
	const link = document.createElement('a');
	link.href = url; link.download = `${template.id}.json`; link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	notice.value = `Saved ${template.id}.json. Add it to the templates folder to list it in the gallery.`;
}
/** Opens a template file from disk; it is checked like every other template. */
function openTemplateFile(event) {
	const file = event.target.files?.[0];
	event.target.value = '';
	if (!file) return;
	if (file.size > 2 * 1024 * 1024) { notice.value = 'Choose a template file under 2 MB.'; return; }
	file.text().then((value) => {
		if (disposed) return;
		const poster = templateToPoster(JSON.parse(value));
		if (!poster.layers.length) throw new Error('empty');
		applyTemplate({ title: poster.title, poster });
	}).catch(() => { if (!disposed) notice.value = 'That file is not a template this studio can open.'; });
}

/* Images ------------------------------------------------------------------------- */

/** Commits a supported image URL and clears any previous loading error. */
function setImage(value) {
	if (!active.value || active.value.locked) return;
	const url = safePosterImage(value);
	if (!url) { notice.value = 'Use an http or https image URL, or upload a PNG, JPEG, WebP or GIF.'; return; }
	setProp(active.value, 'value', url);
	delete imageErrors.value[active.value.id];
}
/** Reads a user-selected raster image locally; no upload leaves the browser. */
function uploadImage(event) {
	const file = event.target.files?.[0];
	const targetId = active.value?.type === 'poster:image' && !active.value.locked ? active.value.id : null;
	if (!file) return;
	if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 8 * 1024 * 1024) {
		notice.value = 'Choose a PNG, JPEG, WebP or GIF under 8 MB.'; event.target.value = ''; return;
	}
	const reader = new FileReader();
	reader.onload = () => {
		if (disposed) return;
		const value = String(reader.result);
		if (targetId && doc.value.nodes[targetId]) {
			run([{ op: 'setProp', id: targetId, key: 'value', value }, { op: 'setField', id: targetId, key: 'label', value: file.name }]);
			selected.value = targetId;
		} else {
			addLayer('image', { value }, file.name);
		}
		notice.value = 'Image added locally. Export HTML to keep your work.';
	};
	reader.onerror = () => { if (!disposed) notice.value = 'That image could not be read. Try another file.'; };
	reader.readAsDataURL(file);
	event.target.value = '';
}
watch(() => [selected.value, activeLayer.value?.value], () => {
	imageUrlDraft.value = activeLayer.value?.type === 'image' && !activeLayer.value.value.startsWith('data:') ? activeLayer.value.value : '';
}, { immediate: true });

/* Export ------------------------------------------------------------------------- */

/** Downloads a standalone HTML document containing local images and the current CSS. */
function download(design, fileName = props.fileName) {
	finishTextEdit();
	design ??= poster.value;
	const url = URL.createObjectURL(new Blob([exportPosterHtml(design)], { type: 'text/html' }));
	const link = document.createElement('a');
	link.href = url; link.download = fileName; link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	notice.value = 'HTML exported. Linked photos still need an internet connection.';
}
/** Copies the exact export document, reporting clipboard failures without losing edits. */
async function copy() {
	finishTextEdit();
	try { await navigator.clipboard.writeText(exportPosterHtml(poster.value)); notice.value = 'HTML copied.'; }
	catch { notice.value = 'Clipboard unavailable. Use Export HTML instead.'; }
}

/* Viewport ----------------------------------------------------------------------- */

/** Fits the full-resolution HTML into the workspace without changing the document. */
function fit() {
	if (!workspace.value) return;
	const gutter = rulers.value ? 20 : 0;
	fitScale.value = Math.max(0.05, Math.min(1, (workspace.value.clientWidth - 72 - gutter) / poster.value.width, (workspace.value.clientHeight - 80 - gutter) / poster.value.height));
}
/** Zooms around the pointer; ordinary wheel events keep native scrolling. */
async function wheelZoom(event) {
	if (!event.metaKey && !event.ctrlKey) return;
	event.preventDefault();
	const area = workspace.value;
	const sheet = artwork.value;
	if (!area || !sheet) return;
	const before = sheet.getBoundingClientRect();
	const oldScale = scale.value;
	const x = (event.clientX - before.left) / oldScale;
	const y = (event.clientY - before.top) / oldScale;
	const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? area.clientHeight : 1);
	const next = Math.max(0.05, Math.min(3, oldScale * Math.exp(-delta * 0.002)));
	zoomChoice.value = String(next);
	await nextTick();
	if (disposed || workspace.value !== area) return;
	const after = sheet.getBoundingClientRect();
	area.scrollLeft += after.left + x * next - event.clientX;
	area.scrollTop += after.top + y * next - event.clientY;
}
/** Undo, redo, duplicate and delete from the keyboard, outside text fields. */
function onKeydown(event) {
	if (props.embedded && !pointerInside.value && !root.value?.contains(document.activeElement)) return;
	const target = event.target;
	if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
	const command = event.metaKey || event.ctrlKey;
	const key = event.key.toLowerCase();
	if (command && key === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
	else if (command && key === 'y') { event.preventDefault(); redo(); }
	else if (command && key === 'd') { event.preventDefault(); duplicate(); }
	else if ((event.key === 'Delete' || event.key === 'Backspace') && movable.value.length) { event.preventDefault(); remove(); }
	else if (event.key === 'Escape' && selected.value !== 'frame') { selection.value = []; selected.value = 'frame'; }
}
function mount() {
	observer = new ResizeObserver(fit);
	observer.observe(workspace.value);
	workspace.value.addEventListener('wheel', wheelZoom, { passive: false });
	window.addEventListener('keydown', onKeydown);
	fit();
}
function cleanup() {
	disposed = true;
	workspace.value?.removeEventListener('wheel', wheelZoom);
	window.removeEventListener('keydown', onKeydown);
	observer?.disconnect();
}
watch(rulers, () => nextTick(fit));
onMounted(mount);
onBeforeUnmount(cleanup);
</script>

<template>
	<main ref="root" class="flex min-h-0 flex-col bg-canvas text-canvas-fg" :class="embedded ? 'h-full' : 'h-dvh'" @pointerenter="pointerInside = true" @pointerleave="pointerInside = false">
		<header class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
			<div class="flex flex-wrap items-center gap-3"><template v-if="!embedded"><RouterLink to="/designer" class="text-sm text-muted-fg hover:text-canvas-fg">← UI designer</RouterLink><RouterLink :to="guide" class="text-sm text-primary underline underline-offset-4">Assembly guide</RouterLink><span class="h-4 border-l border-border"></span></template><h1 class="text-sm font-semibold">{{ name }}</h1><span class="rounded bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">Beta</span></div>
			<div class="flex items-center gap-2"><DomButton size="sm" variant="ghost" :disabled="!counts.undo" title="Undo (⌘Z)" @click="undo">Undo</DomButton><DomButton size="sm" variant="ghost" :disabled="!counts.redo" title="Redo (⇧⌘Z)" @click="redo">Redo</DomButton><DomButton size="sm" variant="ghost" :aria-pressed="showCode" @click="showCode = !showCode">HTML</DomButton><DomButton v-if="templates.length" size="sm" variant="ghost" @click="showTemplates = true">Templates</DomButton><DomButton v-if="presets.length > 1" size="sm" variant="ghost" :aria-pressed="showFormats" @click="showFormats = !showFormats">Formats</DomButton><DomButton size="sm" @click="download()">Export HTML</DomButton></div>
		</header>
		<nav class="flex shrink-0 border-b border-border p-1 md:hidden" aria-label="Editor panels"><button v-for="panel in ['layers', 'poster', 'inspect']" :key="panel" type="button" class="flex-1 rounded px-3 py-2 text-sm capitalize" :class="mobilePanel === panel ? 'bg-secondary font-semibold' : 'text-muted-fg'" :aria-pressed="mobilePanel === panel" @click="mobilePanel = panel">{{ panel }}</button></nav>
		<DomSplitterPanel v-model:start-size="leftPanelWidth" v-model:end-size="rightPanelWidth" :min-start="180" :min-main="280" :min-end="240" class="poster-panels min-h-0 flex-1" :data-panel="mobilePanel">
			<template #start>
			<aside class="h-full min-h-0 overflow-auto border-r border-border" :class="mobilePanel === 'layers' ? 'block' : 'hidden md:block'" aria-label="Layers">
				<div v-if="presets.length" class="border-b border-border p-4"><DomNativeSelect :model-value="`${poster.width}x${poster.height}`" :options="formatOptions" label="Format" @update:model-value="setPreset" /></div>
				<div class="p-4"><h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">Add a layer</h2><div class="grid grid-cols-3 gap-1"><DomButton size="sm" variant="secondary" @click="addLayer('text')">Text</DomButton><DomButton size="sm" variant="secondary" @click="addLayer('image')">Image</DomButton><DomButton size="sm" variant="secondary" @click="addLayer('shape')">Shape</DomButton></div></div>
				<div class="px-2" @pointerdown.capture="additiveLayerClick = $event.shiftKey || $event.metaKey || $event.ctrlKey" @keydown.capture="additiveLayerClick = $event.shiftKey"><div class="flex items-center justify-between px-2 pb-2"><h2 class="text-xs font-semibold">Layers</h2><span class="text-[10px] text-muted-fg">Front to back</span></div><DomDesignerLayers :model-value="selected" :items="layers" label="Layers" @update:model-value="pickLayer" @reorder="moveLayer" /></div>
				<div class="m-4 space-y-3 border-t border-border pt-4"><button type="button" class="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm" :class="selected === 'frame' && 'bg-secondary'" @click="selected = 'frame'"><span>{{ frameLabel }} settings</span><span class="size-4 rounded border border-border" :style="{ background: poster.background }"></span></button><p class="text-xs leading-5 text-muted-fg">Real HTML at {{ poster.width }} × {{ poster.height }}. Shift-click layers to select several.</p><p class="text-xs leading-5 text-muted-fg">Edits stay in this tab. Export HTML before leaving.</p></div>
			</aside>
			</template>
			<template #default>
			<section class="flex h-full min-h-0 min-w-0 flex-col" :class="mobilePanel === 'poster' ? 'flex' : 'hidden md:flex'" aria-label="Workspace">
				<div class="flex h-10 shrink-0 items-center justify-between border-b border-border px-4 text-[11px] text-muted-fg"><span class="truncate">{{ poster.title }}</span><span class="shrink-0">{{ poster.width }} × {{ poster.height }}</span></div>
				<div ref="workspace" class="poster-workspace min-h-0 flex-1 overflow-auto p-9">
					<div ref="artwork" class="relative mx-auto shadow-xl" :style="{ width: `${poster.width * scale}px`, height: `${poster.height * scale}px` }">
						<DesignerRulers v-if="rulers" :width="poster.width" :height="poster.height" :scale="scale" :selection="selectionBox" />
						<DomDesignerStage v-model="selected" v-model:selection="selection" :snapping="snapping" :spacing-snapping="spacingSnapping" :positioning="Boolean(active && !active.locked && !active.hidden)" :editing="editing?.id || ''" class="absolute left-0 top-0 origin-top-left [--primary:var(--chart-1)]" :style="{ width: `${poster.width}px`, height: `${poster.height}px`, transform: `scale(${scale})` }" @style-change="patch" @edit-text="startTextEdit">
							<article :aria-label="poster.title" :style="{ position: 'relative', width: `${poster.width}px`, height: `${poster.height}px`, overflow: 'hidden', background: poster.background }">
								<template v-for="(layer, index) in poster.layers" :key="`${layer.id}:${revisions[layer.id] || 0}`">
									<img v-if="layer.type === 'image'" :src="safePosterImage(layer.value)" :alt="layer.name" :data-designer-id="layer.hidden ? undefined : layer.id" :style="posterLayerStyle(layer, index)" draggable="false" @error="imageErrors[layer.id] = true" @load="delete imageErrors[layer.id]" />
									<component :is="layer.type === 'text' ? 'p' : 'div'" v-else :data-designer-id="layer.hidden ? undefined : layer.id" :style="posterLayerStyle(layer, index)">{{ layer.type === 'text' ? layer.value : '' }}</component>
								</template>
							</article>
						</DomDesignerStage>
					</div>
				</div>
				<div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-canvas px-4 py-2"><span class="truncate text-xs text-muted-fg">{{ multiple ? `${selectedNodes.length} layers` : activeLayer?.name || poster.title }}{{ !multiple && active?.locked ? ' · locked' : '' }}</span><label class="flex shrink-0 items-center gap-1 text-xs" title="Snap to the poster and visible layers. Hold Control while moving or resizing to bypass."><input v-model="snapping" type="checkbox" class="accent-primary" />Snap</label><label class="flex shrink-0 items-center gap-1 text-xs" title="Repeat horizontal and vertical gaps while dragging. Independent of alignment snapping; hold Control to bypass."><input v-model="spacingSnapping" type="checkbox" class="accent-primary" />Spacing</label><label class="flex shrink-0 items-center gap-1 text-xs"><input v-model="rulers" type="checkbox" class="accent-primary" />Rulers</label><label class="flex items-center gap-2 text-xs"><span>Zoom</span><select v-model="zoomChoice" aria-label="Stage zoom" class="rounded border border-border bg-canvas px-2 py-1"><option value="fit">Fit · {{ Math.round(fitScale * 100) }}%</option><option v-if="zoomChoice !== 'fit' && !['0.25', '0.5', '0.75', '1'].includes(zoomChoice)" :value="zoomChoice">{{ Math.round(scale * 100) }}%</option><option value="0.25">25%</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option></select></label></div>
				<div v-if="showFormats && presets.length > 1" class="shrink-0 border-t border-border bg-canvas p-3"><div class="mb-2 flex items-center justify-between gap-3"><h2 class="text-xs font-semibold">Every format <span class="font-normal text-muted-fg">· live previews that follow each layer's pins</span></h2></div><div class="flex gap-4 overflow-x-auto pb-1"><div v-for="preview in previews" :key="preview.value" class="flex shrink-0 flex-col items-start gap-1.5"><button type="button" class="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="preview.current ? 'ring-2 ring-primary' : 'hover:bg-secondary'" :aria-label="`Edit as ${preview.label}`" :aria-pressed="preview.current" @click="setPreset(preview.value)"><PosterThumbnail :poster="preview.poster" :height="120" /></button><div class="flex w-full items-center justify-between gap-2 px-1"><span class="truncate text-[11px]" :class="preview.current ? 'font-semibold' : 'text-muted-fg'">{{ preview.label }}</span><button type="button" class="shrink-0 text-[11px] text-primary underline underline-offset-2" :aria-label="`Export ${preview.label} as HTML`" @click="download(preview.poster, `${fileName.replace(/\.html$/, '')}-${preview.value}.html`)">HTML</button></div></div></div></div>
				<div v-if="showCode" class="flex h-64 shrink-0 flex-col border-t border-border bg-canvas"><div class="flex items-center justify-between px-3 py-2"><h2 class="text-xs font-semibold">Linked HTML <span class="font-normal text-muted-fg">· select a line to inspect its layer</span></h2><DomButton size="sm" variant="ghost" @click="copy">Copy HTML</DomButton></div><component :is="codeEditor || CodeView" v-bind="codeEditor ? { ...codeEditorProps, options: { wordWrap: 'on', ...codeEditorProps.options } } : {}" class="min-h-0 flex-1 border-t border-border" readonly :model-value="sourceText" :highlight="sourceHighlight" :label="`${frameLabel} HTML`" @cursor="pickLine" /></div>
			</section>
			</template>
			<template #end>
			<aside class="h-full min-h-0 overflow-auto border-l border-border" :class="mobilePanel === 'inspect' ? 'block' : 'hidden md:block'" aria-label="Properties">
				<template v-if="multiple">
					<div class="flex items-center justify-between border-b border-border px-4 py-3"><h2 class="text-sm font-semibold">{{ selectedNodes.length }} layers</h2><span class="text-[10px] uppercase tracking-wider text-muted-fg">Selection</span></div>
					<div class="space-y-4 p-4">
						<AlignTools :distribute="movable.length > 2" :disabled="!movable.length" @align="align" @distribute="distribute" />
						<p class="text-xs leading-5 text-muted-fg">Align uses the selection's edges. Distribute needs three or more layers and keeps the outer ones in place.<template v-if="movable.length < selectedNodes.length"> Locked layers stay where they are.</template></p>
						<DomButton size="sm" variant="ghost" :disabled="!movable.length" @click="remove">Delete {{ movable.length }} {{ movable.length === 1 ? 'layer' : 'layers' }}</DomButton>
					</div>
				</template>
				<template v-else-if="active">
					<div class="flex items-center justify-between border-b border-border px-4 py-3"><h2 class="text-sm font-semibold">{{ activeLayer.name }}</h2><span class="text-[10px] uppercase tracking-wider text-muted-fg">{{ activeType.label }}</span></div>
					<div class="flex flex-wrap gap-1 border-b border-border p-3"><DomButton size="sm" variant="ghost" @click="toggle('locked')">{{ active.locked ? 'Unlock' : 'Lock' }}</DomButton><DomButton size="sm" variant="ghost" :disabled="active.locked" @click="toggle('hidden')">{{ active.hidden ? 'Show' : 'Hide' }}</DomButton><DomButton size="sm" variant="ghost" @click="duplicate">Duplicate</DomButton><DomButton size="sm" variant="ghost" :disabled="active.locked" @click="remove">Delete</DomButton></div>
					<p v-if="active.locked" class="bg-secondary px-4 py-3 text-xs leading-5 text-muted-fg">This layer is locked. Unlock it to change its properties or position.</p>
					<div class="min-w-0 space-y-5 p-4">
						<DomTextInput label="Layer name" :model-value="activeLayer.name" :disabled="active.locked" @update:model-value="setLabel" />
						<div class="space-y-2"><AlignTools :target="frameLabel.toLowerCase()" :disabled="active.locked" @align="align" /><div class="flex gap-2"><DomButton size="sm" variant="secondary" :disabled="activeIndex === 0 || active.locked" @click="restack(-1)">Send back</DomButton><DomButton size="sm" variant="secondary" :disabled="activeIndex === frame.children.length - 1 || active.locked" @click="restack(1)">Bring forward</DomButton></div></div>
						<fieldset v-if="active.type === 'poster:image'" :disabled="active.locked" class="min-w-0 space-y-3 disabled:opacity-50">
							<DomTextInput v-model="imageUrlDraft" label="Image URL" placeholder="https://…" />
							<div class="flex flex-wrap gap-2"><DomButton size="sm" variant="secondary" :disabled="!imageUrlDraft" @click="setImage(imageUrlDraft)">Apply URL</DomButton><DomButton size="sm" variant="secondary" @click="upload.click()">Replace with local image</DomButton></div>
							<p v-if="imageErrors[active.id]" role="status" class="text-xs text-destructive">The photo could not load. Try another URL or a local image.</p>
						</fieldset>
						<NodeInspector :node="active" :type="activeType" :bindable="false" :extra-props="false" :disabled="active.locked" @set-prop="onInspector(active, $event)" />
					</div>
				</template>
				<template v-else>
					<div class="flex items-center justify-between border-b border-border px-4 py-3"><h2 class="text-sm font-semibold">{{ frameLabel }}</h2><span class="text-[10px] uppercase tracking-wider text-muted-fg">Frame</span></div>
					<div class="space-y-4 p-4">
						<NodeInspector :node="frame" :type="frameType" :bindable="false" :extra-props="false" @set-prop="onInspector(frame, $event)" />
						<p class="text-xs leading-5 text-muted-fg">Cmd/Ctrl + mouse wheel zooms the stage. Double-click text to edit it on the poster; Enter or Escape finishes. Drag a layer's outline to move it, or a corner or edge handle to resize. Shift-click to select several layers and align them. Arrow keys move by 1px; Shift moves by 10px; Alt resizes.</p>
					</div>
				</template>
			</aside>
			</template>
		</DomSplitterPanel>
		<footer class="flex min-h-8 shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-fg"><span role="status">{{ notice || 'HTML elements · no canvas · export to keep your work' }}</span><a v-if="credit" class="shrink-0 underline underline-offset-2" :href="credit.href" target="_blank" rel="noopener noreferrer">{{ credit.label }}</a></footer>
		<DomDialog v-if="templates.length" v-model="showTemplates" title="Templates" :description="`Every template opens at ${poster.width} × ${poster.height} and stays editable. Your current design is replaced; undo brings it back. Saving always adds a new template.`" width="min(1100px, 95vw)">
			<div class="flex flex-wrap items-end gap-3 pb-4"><div class="w-60 max-w-full"><DomNativeSelect v-model="templateIndustry" :options="industryOptions" label="Industry" /></div><div class="w-48 max-w-full"><DomNativeSelect v-model="templateKind" :options="kindOptions" label="Post type" /></div><div class="ml-auto flex flex-wrap gap-2"><DomButton v-if="library" size="sm" variant="secondary" title="Save this design as a new template, tagged with the selected industry and post type. Existing templates are never overwritten." @click="saveAsTemplate">Save as new template</DomButton><DomButton size="sm" variant="ghost" title="Download this design as a template file" @click="saveTemplate">Download template file</DomButton><DomButton size="sm" variant="ghost" @click="templateUpload.click()">Open template file</DomButton></div></div>
			<ul class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4" aria-label="Templates">
				<li v-for="template in visibleTemplates" :key="template.id"><button type="button" class="flex w-full flex-col items-center gap-2 rounded-lg p-2 text-left hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" @click="applyTemplate(template)"><PosterThumbnail :poster="template.preview" :height="Math.min(220, Math.round(170 * template.preview.height / template.preview.width))" /><span class="w-full"><span class="block truncate text-sm font-medium">{{ template.title }}</span><span class="block truncate text-xs text-muted-fg">{{ template.industryLabel }}</span></span></button></li>
			</ul>
		</DomDialog>
		<input v-if="templates.length" ref="templateUpload" type="file" accept="application/json,.json" class="hidden" aria-label="Open template file" @change="openTemplateFile" />
		<input ref="upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" aria-label="Upload image" @change="uploadImage" />
	</main>
</template>

<style scoped>
.poster-workspace {
	background-color: var(--secondary);
	background-image: radial-gradient(var(--border) 1px, transparent 1px);
	background-size: 16px 16px;
}
/* Slot wrappers belong to the splitter; on mobile expose only the selected panel. */
@media (max-width: 767px) {
	.poster-panels { display: block; min-width: 0 !important; }
	.poster-panels :deep(> button), .poster-panels :deep(> section) { display: none; }
	.poster-panels[data-panel="layers"] :deep(> section:nth-child(1)),
	.poster-panels[data-panel="poster"] :deep(> section:nth-child(3)),
	.poster-panels[data-panel="inspect"] :deep(> section:nth-child(5)) { display: block; height: 100%; }
}
</style>
