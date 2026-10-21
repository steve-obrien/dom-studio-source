<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue';
import { DomBackdropEditor, DomBackgroundEditor, DomBorderEditor, DomButton, DomDesignerLayers, DomDesignerStage, DomFrameLayoutEditor, DomJsonInput, DomNativeSelect, DomNumberInput, DomShadowEditor, DomTextInput, DomTypographyEditor } from '../../lib/vue';
import { alignFrameChild, createFrameLayout, measureFrameChild, readFrameLayout } from '../frame/frameLayout.js';
import { isFrameNode } from '../frames/frameDocument.js';
import { componentType, createEditorTypes, studioComponentEntries } from './componentTypes.js';
import NodeInspector from './NodeInspector.vue';
import InspectorIcon from '../_shared/InspectorIcon.vue';
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';
import ScrubField from '../_shared/ScrubField.vue';
import ControlIconButton from '../_shared/ControlIconButton.vue';
import StyleControlSection from '../_shared/StyleControlSection.vue';
import { cssEditorContextKey } from '../_shared/cssEditorContext.js';
import { useNodeStyle } from './nodeStyle.js';
import { useGoogleFonts } from '../typography-editor/googleFonts.js';
import AlignTools from '../stage/AlignTools.vue';
import { copySubtree, fromTree, isExpr, subtreeIds } from './editorDocument.js';
import { EditorRender } from './EditorRender.js';
import { beginInlineEdit, inlineEditTarget, sourceCaret } from './inlineText.js';
import { createHistory } from './history.js';
import { previewData, scriptData } from './previewData.js';
import { treeFromType } from './typeRegistry.js';
import { exportMappedVue, tailwindContent } from './vueAdapter.js';
import CodeView from './CodeView.vue';
import { applySource, nodeAtLine } from './sourceSync.js';
import { createBrowserStorage, createSaver } from './storage.js';
import ArtboardViewport from '../canvas/ArtboardViewport.vue';
import { applyWorkspaceOperation, createCanvasDemo, importFile, restoreWorkspace, workspaceId } from '../canvas/canvasWorkspace.js';
import { createComponentCatalog } from './componentCatalog.js';

/**
 * DomDesigner: the DOM designer built on the shared editor core.
 *
 * Figma-style pan and zoom over artboards, where every artboard is real HTML
 * rendered by Vue in its own iframe. Artboards are views of Vue files, so the
 * same component can be designed at several widths at once.
 *
 * Each file is an editor document (a flat map of nodes keyed by id), every
 * edit is an operation with an inverse, and the inspector is generated from
 * each node's type. Bindings render with preview data, or as variables.
 *
 * Where the work is kept is up to the app: `storage` saves the workspace
 * (this browser by default), and `fileStorage` opens and saves source files
 * in a project. `catalog` lists the components people can insert.
 */
defineOptions({ name: 'DomDesigner' });

const props = defineProps({
	/** Components people can insert: `catalogFromExports(await import('@getdom/studio/vue'))` or `createComponentCatalog(records)`. */
	catalog: { type: Object, default: null },
	/** Storage adapter for the whole workspace; defaults to this browser's localStorage. */
	storage: { type: Object, default: null },
	/** Id the workspace is saved under. */
	storageKey: { type: String, default: 'dom-studio-canvas-v2' },
	/** Older ids to read from when nothing is saved under `storageKey`. */
	legacyStorageKeys: { type: Array, default: () => [] },
	/** File storage adapter (`createFileStorage`) for opening and saving project files; off when null. */
	fileStorage: { type: Object, default: null },
	/** Compiles Tailwind CSS for the classes in the workspace: `(content: string) => Promise<string>`. Off when null. */
	compileCss: { type: Function, default: null },
	/** Creates the workspace shown when nothing is saved, and after Reset. */
	createWorkspace: { type: Function, default: createCanvasDemo },
	/** Title in the toolbar. */
	title: { type: String, default: 'Canvas' },
	/** Small badge beside the title, such as "Beta". */
	badge: { type: String, default: '' },
	/**
	 * Replaces the built-in code view, such as `DomMonacoCodeView`. It receives
	 * `modelValue`, `highlight` ({ start, end } lines), `label` and `readonly`, and
	 * emits `update:modelValue`, `cursor` (a one-based line), `focus` and `blur`.
	 */
	codeEditor: { type: [Object, Function], default: null },
	/** Extra props for `codeEditor`, such as Monaco's `load`. */
	codeEditorProps: { type: Object, default: () => ({}) },
	/** Offer Google Fonts in the text controls and load the ones in use. Turn off for email, which can only use installed fonts. */
	googleFonts: { type: Boolean, default: true },
});
const emit = defineEmits(['save']);
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const artboardPresets = [
	{ label: 'Mobile', width: 390 },
	{ label: 'Tablet', width: 768 },
	{ label: 'Desktop', width: 1200 },
	{ label: 'Wide', width: 1440 },
];
const absoluteBox = (width, height) => ({ placements: { absolute: { left: 24, top: 24, width, height } } });
const primitives = [
	{ id: 'frame', label: 'Frame', description: 'Flex container', tree: () => ({ type: 'html:div', label: 'Frame', layout: createFrameLayout({ mode: 'flex', gap: 12, padding: 16 }), props: { class: 'rounded-xl border border-border' }, children: [], ...absoluteBox(280, 160) }) },
	{ id: 'section', label: 'Section', description: 'Padded page section', tree: () => ({ type: 'html:section', props: { class: 'space-y-4 p-6' }, children: [{ type: 'html:h2', props: { class: 'text-2xl font-semibold tracking-tight' }, children: [{ type: 'text', props: { value: 'Section title' } }] }] }) },
	{ id: 'heading', label: 'Heading', description: 'h2', tree: () => typeTree('html:h2', absoluteBox(240, 40)) },
	{ id: 'text', label: 'Text', description: 'Paragraph', tree: () => typeTree('html:p', absoluteBox(240, 48)) },
	{ id: 'image', label: 'Image', description: 'img', tree: () => typeTree('html:img', absoluteBox(240, 160)) },
	{ id: 'link', label: 'Link', description: 'a', tree: () => typeTree('html:a', absoluteBox(120, 24)) },
];

/** Shared empty map; a fresh `{}` per render would re-render inactive artboards forever. */
const noDetectedLayouts = Object.freeze({});
const catalog = props.catalog || createComponentCatalog([]);
const types = createEditorTypes(catalog);
const htmlTypeGroups = Object.entries(types.list().filter((entry) => entry.adapter === 'html' && entry.type !== 'text').reduce((groups, entry) => {
	(groups[entry.group] ||= []).push(entry);
	return groups;
}, {}));
const studioEntries = studioComponentEntries(catalog);

const workspace = ref(props.createWorkspace());
const activeArtboardId = ref(workspace.value.artboards[0].id);
const selected = ref('');
const viewMode = ref('data');
// Canvas: Figma-style artboards to pan and zoom. Page: the active artboard as one full-size, scrolling viewport.
const canvasModeKey = 'dom-designer-canvas-mode';
const canvasMode = ref('canvas');
const pageSize = ref(null);
const css = ref('');
const compilerNotice = ref('');
const notice = ref('');
const zoom = ref(0.5);
const pan = ref({ x: 48, y: 72 });
const panning = ref(false);
const spaceHeld = ref(false);
const leftTab = ref('layers');
const insertQuery = ref('');
const showCode = ref(false);
const codeDraft = ref(null);
const codeRanges = ref(null);
const codeError = ref('');
const codeWarning = ref('');
const projectFiles = ref(null);
const snapping = ref(true);
const detected = ref({});
const historySize = ref({ undo: 0, redo: 0 });
// Text being edited in place on the canvas: its artboard, file, layer and browser session.
const editing = shallowRef(null);
const editState = ref({ caret: null, marks: null });
const revisions = ref({});
const viewport = ref(null);
const artboardRefs = new Map();
// The workspace saves through a storage adapter; project files go through the file adapter when one is given.
const storage = props.storage || createBrowserStorage({ prefix: '' });
const fileStorage = props.fileStorage;
const saver = createSaver({ save: async (id, value, options) => { await storage.save(id, value, options); emit('save', { id, value }); } }, { delay: 500, onError: (error) => { notice.value = `Could not save: ${error.message}`; } });
let codeTimer;
let compileTimer;
let compiledContent = '';
let gesture = null;
let disposed = false;

const history = createHistory({
	apply: (operation) => applyWorkspaceOperation(workspace.value, operation),
	onChange() {
		historySize.value = history.size();
		queueSave();
		queueCompile();
	},
});

const artboards = computed(() => workspace.value.artboards);
const shownArtboards = computed(() => (canvasMode.value === 'page' ? artboards.value.filter((board) => board.id === activeArtboard.value?.id) : artboards.value));
const activeArtboard = computed(() => artboards.value.find((board) => board.id === activeArtboardId.value) || artboards.value[0]);
const activeFile = computed(() => fileById(activeArtboard.value?.fileId) || workspace.value.files[0]);
const doc = computed(() => activeFile.value?.doc || null);
const active = computed(() => doc.value?.nodes[selected.value] || null);
const parent = computed(() => (active.value?.parent ? doc.value.nodes[active.value.parent] : null));
const activeType = computed(() => (active.value ? types.get(active.value.type) : null));
const textChild = computed(() => {
	const children = active.value?.children || [];
	const child = children.length === 1 ? doc.value.nodes[children[0]] : null;
	return child?.type === 'text' ? child : null;
});
/**
 * Mixed content, such as `Turn what… <span>people can find.</span>`: the text
 * runs and inline elements in order, so text beside elements stays editable.
 * An element with a single text child shows that text too.
 */
const inlineContent = computed(() => {
	if (!active.value || textChild.value) return [];
	const children = active.value.children.map((id) => doc.value.nodes[id]).filter(Boolean);
	if (!children.some((child) => child.type === 'text' && textOf(child).trim())) return [];
	return children.filter((child) => child.type !== 'text' || textOf(child).trim()).map((child) => {
		const inner = child.type !== 'text' && child.children.length === 1 ? doc.value.nodes[child.children[0]] : null;
		return { node: child, text: child.type === 'text' ? child : inner?.type === 'text' ? inner : null };
	});
});
const layout = computed(() => active.value?.layout || detected.value[selected.value] || createFrameLayout());
const textTags = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'label', 'li', 'blockquote', 'strong', 'em', 'small', 'code', 'figcaption', 'td', 'th']);
const showText = computed(() => Boolean(textChild.value || textTags.has(activeType.value?.tag)));
const { fill: fillStyle, stroke: strokeStyle, shadow: shadowStyle, blur: blurStyle, text: textStyle, custom: customStyle, set: setStyle, setRaw: setStyleRaw } = useNodeStyle(active, writeStyle);
const styleTitles = { fill: 'Fill', stroke: 'Stroke', shadow: 'Shadow', blur: 'Background blur' };
// Google fonts set on any layer load while the designer is open; artboards copy them from the page head.
useGoogleFonts(() => (props.googleFonts ? workspace.value.files.flatMap((file) => Object.values(file.doc.nodes)).filter((node) => node.style?.['font-family']).map((node) => ({ fontFamily: node.style['font-family'], fontWeight: node.style['font-weight'] })) : []));
// Material editors draw as inspector sections here, not cards.
provide(cssEditorContextKey, { framed: computed(() => false), colorVariables: computed(() => ({})) });
const parentMode = computed(() => parent.value?.layout?.mode || detected.value[parent.value?.id]?.mode || 'flow');
const parentLayout = computed(() => (parent.value ? parent.value.layout || detected.value[parent.value.id] || createFrameLayout() : null));
const parentModes = {
	flow: { label: 'Flow', icon: 'mode-flow', tooltip: 'Parent is flow: this stacks in normal document flow' },
	flex: { label: 'Flex', icon: 'mode-flex', tooltip: 'Parent is flex (auto layout): this sits in a row or column' },
	grid: { label: 'Grid', icon: 'mode-grid', tooltip: 'Parent is grid: this sits in a cell' },
	absolute: { label: 'Absolute', icon: 'mode-absolute', tooltip: 'Parent is absolute: this is placed by X and Y' },
};
const sizingModes = [{ value: 'auto', label: 'Auto' }, { value: 'fixed', label: 'Fixed' }, { value: 'hug', label: 'Hug' }, { value: 'fill', label: 'Fill' }];
const layers = computed(() => (doc.value ? [layer(doc.value.rootId)] : []));
const mappedSource = computed(() => (activeFile.value ? exportMappedVue(activeFile.value, isStudioComponent) : { source: '', ranges: {} }));
const fileSource = computed(() => mappedSource.value.source);
const codeText = computed(() => codeDraft.value ?? fileSource.value);
const codeHighlight = computed(() => {
	const range = (codeDraft.value === null ? mappedSource.value.ranges : codeRanges.value || {})[selected.value] || null;
	const caret = range && codeDraft.value === null ? caretInSource() : null;
	return caret ? { ...range, caret } : range;
});
// In Page mode the artboard scrolls itself, so a selection made from the layers or the code is scrolled into view.
watch(selected, async (id) => {
	if (canvasMode.value !== 'page' || !id) return;
	await nextTick();
	activeViewport()?.element(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
watch(canvasMode, (mode) => {
	try { localStorage.setItem(canvasModeKey, mode); } catch { /* storage unavailable */ }
	if (mode === 'canvas') nextTick(refresh);
});
const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`);
const previews = computed(() => Object.fromEntries(workspace.value.files.map((file) => [file.id, previewData(file.doc, file)])));
const scriptKeys = computed(() => Object.keys(scriptData(activeFile.value?.script || '')));
const insertableComponents = computed(() => {
	const query = insertQuery.value.trim().toLowerCase();
	return studioEntries.filter((entry) => !query || `${entry.label} ${entry.componentName} ${entry.group}`.toLowerCase().includes(query)).slice(0, 80);
});
const geometry = computed(() => {
	if (active.value?.placements?.absolute) return active.value.placements.absolute;
	// Detection reruns after every render, so measured sizes follow edits.
	detected.value;
	return measureSelection();
});

/** Measures the selection in its parent frame's coordinates. */
function measureSelection() {
	const element = activeViewport()?.element(selected.value);
	const host = activeViewport()?.element(parent.value?.id);
	return element && host ? measureFrameChild(element, host) : {};
}

function fileById(id) { return workspace.value.files.find((file) => file.id === id) || null; }
function tagOf(node) { return types.get(node.type)?.tag || node.type.split(':').pop(); }
function isFrame(node) { return !!node && node.type.startsWith('html:') && isFrameNode({ tag: tagOf(node) }); }
/** Nodes that take inserted children: frames and components with a default slot. */
function canNest(node) { return !!node && (isFrame(node) || (node.type.startsWith('vue:') && types.get(node.type)?.container !== false)); }
function typeTree(type, overrides) { return treeFromType(types.get(type), overrides); }

/** 24px layer icons: loops and conditions first, then what the element is. */
const layerIcons = {
	repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
	condition: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 9a9 9 0 0 1-9 9',
	component: 'M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5ZM12 2l3.5 3.5L12 9 8.5 5.5 12 2Zm6.5 6.5L22 12l-3.5 3.5L15 12l3.5-3.5ZM12 15l3.5 3.5L12 22l-3.5-3.5L12 15Z',
	text: 'M4 7V5h16v2M9 19h6M12 5v14',
	link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
	image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
	button: 'M3 8h18v8H3zM8 12h8',
	list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
	form: 'M4 7h16v4H4zM4 15h10v4H4z',
	flow: 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5',
	row: 'M4 5h16v14H4zM9.3 5v14M14.7 5v14',
	column: 'M4 5h16v14H4zM4 9.7h16M4 14.3h16',
	grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
	absolute: 'M4 4h10v8H4zM10 12h10v8H10z',
	box: 'M4 4h16v16H4z',
};
const textLayerTags = new Set(['p', 'span', 'strong', 'em', 'b', 'i', 'small', 'label', 'blockquote', 'code', 'pre', 'mark', 'time', 'abbr', 'cite', 'q', 'sub', 'sup', 'dt', 'dd', 'figcaption', 'legend']);

/** Icon or short tag for a layer: v-for and v-if, h1–h6 as text, links, media, lists, components and frame layouts. */
function layerIcon(node, tag) {
	const directives = node.directives || [];
	if (directives.some((source) => source.startsWith('v-for'))) return { icon: layerIcons.repeat };
	if (directives.some((source) => /^v-(if|else-if|else|show)\b/.test(source))) return { icon: layerIcons.condition };
	if (node.type.startsWith('vue:')) return { icon: layerIcons.component };
	if (/^h[1-6]$/.test(tag)) return { iconText: tag };
	if (textLayerTags.has(tag)) return { icon: layerIcons.text };
	if (tag === 'a') return { icon: layerIcons.link };
	if (['img', 'picture', 'video', 'svg', 'canvas', 'iframe'].includes(tag)) return { icon: layerIcons.image };
	if (tag === 'button') return { icon: layerIcons.button };
	if (['ul', 'ol', 'li', 'dl'].includes(tag)) return { icon: layerIcons.list };
	if (['form', 'input', 'select', 'textarea', 'fieldset'].includes(tag)) return { icon: layerIcons.form };
	if (isFrame(node)) {
		const layout = node.layout || detected.value[node.id];
		if (layout?.mode === 'flex') return { icon: layout.direction?.startsWith('column') ? layerIcons.column : layerIcons.row };
		if (layout?.mode === 'grid' || layout?.mode === 'absolute') return { icon: layerIcons[layout.mode] };
		return { icon: layerIcons.flow };
	}
	return { icon: layerIcons.box };
}

/** The words in a heading, including inline elements, shortened for the layer tree. */
function headingText(node) {
	const words = (id) => {
		const child = doc.value.nodes[id];
		if (!child) return '';
		return child.type === 'text' ? textOf(child) : child.children.map(words).join(' ');
	};
	const text = node.children.map(words).join(' ').replace(/\s+/g, ' ').trim();
	return text.length > 40 ? `${text.slice(0, 39)}…` : text;
}

/** Builds layer tree items, hiding text so the tree mirrors what designers see. */
function layer(id) {
	const node = doc.value.nodes[id];
	const tag = tagOf(node);
	// Headings already show h1–h6 as their icon, so their label is their text.
	const heading = /^h[1-6]$/.test(tag) && !node.label ? headingText(node) : '';
	const label = node.label || heading || (node.type.startsWith('vue:') ? tag : `${tag}${typeof node.props.id === 'string' ? ` #${node.props.id}` : ''}`);
	const flags = (node.directives || []).filter((source) => /^v-(if|else|for)/.test(source)).map((source) => source.split('=')[0]);
	return {
		id,
		label: flags.length ? `${label} · ${flags.join(' ')}` : label,
		...layerIcon(node, tag),
		open: true,
		acceptsChildren: canNest(node),
		children: node.children.filter((child) => doc.value.nodes[child]?.type !== 'text').map(layer),
	};
}

/** Only DOM Studio components get an import line in newly created files. */
function isStudioComponent(tag) {
	const entry = catalog.lookupByName(tag);
	return !!entry && typeof entry.component === 'object' && entry.componentName === tag;
}

/** Returns the viewport of the active artboard, which supplies measurements. */
function activeViewport() { return artboardRefs.get(activeArtboard.value?.id) || null; }

/** Stores artboard viewport refs by id; Vue passes null on unmount. */
function setArtboardRef(id, instance) {
	if (instance) artboardRefs.set(id, instance);
	else artboardRefs.delete(id);
}

/* Operations and history ------------------------------------------------------- */

/** Tags a document operation with the active file. */
function onFile(operation) { return { file: activeFile.value.id, ...operation }; }

/**
 * Applies operations as one undo step. `merge` folds continuous input (typing,
 * dragging) into the same step.
 */
function run(operations, options = {}) {
	try {
		history.run(operations, options);
	} catch (error) {
		notice.value = error.message;
	}
	afterChange();
}
function undo() { history.undo(); afterChange(); }
function redo() { history.redo(); afterChange(); }

/** Keeps the selection and active artboard valid after any change. */
function afterChange() {
	if (!artboards.value.some((board) => board.id === activeArtboardId.value)) activeArtboardId.value = artboards.value[0]?.id;
	if (selected.value && !doc.value?.nodes[selected.value]) selected.value = '';
	refresh();
}

/** Sets a prop on a node; called by the generated inspector. */
/** A text node's value as the designer edits it; bindings read as `{{ expr }}`. */
function textOf(node) {
	const value = node.props.value;
	return isExpr(value) ? `{{ ${value.expr} }}` : String(value ?? '');
}

/** Edits one text run (on change), keeping the spaces that separate it from neighbouring elements. */
function setText(node, input) {
	if (isExpr(node.props.value)) {
		setProp(node.id, { key: 'value', value: { expr: input.replace(/^\s*\{\{\s*|\s*\}\}\s*$/g, '') } });
		return;
	}
	const original = String(node.props.value ?? '');
	const lead = /^\s/.test(original) ? ' ' : '';
	const trail = /\s$/.test(original) ? ' ' : '';
	setProp(node.id, { key: 'value', value: `${lead}${input.trim()}${trail}` });
}

function setProp(id, { key, value, merge }) {
	run(onFile({ op: 'setProp', id, key, value }), { merge: merge ? `prop:${id}:${key}` : '' });
}

/* Persistence and styles --------------------------------------------------------- */

/** Saves the canvas in this browser; storage failures leave the session working. */
function queueSave() {
	saver.queue(props.storageKey, workspace.value);
}

/** Loads a saved canvas, upgrading the first canvas format, and ignoring anything else. */
async function loadSaved() {
	for (const key of [props.storageKey, ...props.legacyStorageKeys]) {
		const restored = restoreWorkspace(await storage.load(key));
		if (restored) return restored;
	}
	return null;
}

/** Lists project files when a file adapter is given and its endpoint answers. */
async function loadProjectFiles() {
	if (!fileStorage) return;
	try {
		projectFiles.value = await fileStorage.list();
	} catch {
		projectFiles.value = null;
	}
}

/** Opens a project file as a new canvas file; its path is kept so Save writes it back. */
async function openProjectFile(path) {
	if (!path) return;
	try {
		const source = await fileStorage.load(path);
		if (source === null) { notice.value = `${path} no longer exists.`; return; }
		const { file, unsupported } = importFile(source, path.split('/').pop());
		file.path = path;
		addFile(file);
		notice.value = `${path} opened from the project.${unsupported ? ` ${unsupported} unsupported nodes were left out.` : ''} Save writes it back.`;
	} catch (error) {
		notice.value = error.message;
	}
}

/** Writes the active file's source to the project, at its own path or under its name. */
async function saveProjectFile() {
	const file = activeFile.value;
	if (!file) return;
	const path = file.path || file.name;
	try {
		await fileStorage.save(path, fileSource.value);
		if (file.path !== path) run({ op: 'setFile', id: file.id, key: 'path', value: path });
		notice.value = `Saved ${path} to the project.`;
		loadProjectFiles();
	} catch (error) {
		notice.value = error.message;
	}
}

/** Compiles utilities used by imported files so arbitrary Tailwind classes render in artboards. */
function queueCompile() {
	clearTimeout(compileTimer);
	compileTimer = setTimeout(compileCss, 400);
}
async function compileCss() {
	if (!props.compileCss) return;
	const content = tailwindContent(workspace.value.files);
	if (!content || content === compiledContent) return;
	compiledContent = content;
	try {
		const text = await props.compileCss(content);
		if (!disposed) { css.value = text; compilerNotice.value = ''; }
	} catch {
		if (!disposed) compilerNotice.value = 'On-demand Tailwind is off here, so classes outside DOM Studio’s stylesheet may not render.';
	}
}

/* Layout detection and geometry ---------------------------------------------------- */

/** Reads each frame's resolved layout in the active artboard after the DOM settles. */
async function refresh() {
	await nextTick();
	if (disposed || !doc.value) return;
	const view = activeViewport();
	const next = {};
	for (const node of Object.values(doc.value.nodes)) {
		const element = isFrame(node) ? view?.element(node.id) : null;
		if (element) next[node.id] = readFrameLayout(element);
	}
	detected.value = next;
}

/** Operations that record each child's box, so switching a frame to absolute keeps things where they are. */
function captureOperations(hostId) {
	const view = activeViewport();
	const element = view?.element(hostId);
	if (!element) return [];
	return doc.value.nodes[hostId].children.flatMap((childId) => {
		const child = doc.value.nodes[childId];
		const target = child.type === 'text' ? null : view.element(childId);
		return target ? [onFile({ op: 'setField', id: childId, key: 'placements', value: { ...(child.placements || {}), absolute: measureFrameChild(target, element) } })] : [];
	});
}

/** Operations that make a frame's detected absolute layout explicit before its children move. */
function adoptOperations(hostId) {
	const host = doc.value.nodes[hostId];
	if (!host || host.layout) return [];
	return [...captureOperations(hostId), onFile({ op: 'setField', id: hostId, key: 'layout', value: detected.value[hostId] || createFrameLayout({ mode: 'absolute' }) })];
}

/** Changes a frame's child layout, preserving geometry when entering absolute mode. */
async function setLayout(value) {
	const node = active.value;
	if (!isFrame(node)) return;
	const merge = `layout:${node.id}:${Date.now()}`;
	const oldMode = node.layout?.mode || detected.value[node.id]?.mode;
	if (value.mode === 'absolute' && oldMode !== 'absolute') {
		// Absolute children must be elements, so loose text is wrapped in spans (in reverse, to keep indexes valid).
		const wraps = [];
		[...node.children].reverse().forEach((childId) => {
			const child = doc.value.nodes[childId];
			if (child.type !== 'text') return;
			const index = node.children.indexOf(childId);
			wraps.push(onFile({ op: 'remove', id: childId }));
			if (typeof child.props.value === 'object' || String(child.props.value).trim()) {
				wraps.push(onFile({ op: 'insert', parent: node.id, index, fragment: fromTree({ type: 'html:span', props: {}, children: [{ type: 'text', props: { ...child.props } }] }) }));
			}
		});
		if (wraps.length) run(wraps, { merge });
		await nextTick();
		const element = activeViewport()?.element(node.id);
		const sizing = element && !node.absoluteHeight ? [onFile({ op: 'setField', id: node.id, key: 'absoluteHeight', value: element.offsetHeight })] : [];
		run([...sizing, ...captureOperations(node.id), onFile({ op: 'setField', id: node.id, key: 'layout', value })], { merge });
		return;
	}
	run(onFile({ op: 'setField', id: node.id, key: 'layout', value }), { merge: `layout:${node.id}` });
}

/** Applies stage drags and resizes; a source-absolute parent is adopted first. */
function patch({ id, style }) {
	const node = doc.value?.nodes[id];
	if (!node?.parent) return;
	const absolute = Object.fromEntries(['left', 'top', 'width', 'height'].map((key) => [key, parseFloat(style[key])]));
	run([...adoptOperations(node.parent), onFile({ op: 'setField', id, key: 'placements', value: { ...(node.placements || {}), absolute } })], { merge: `move:${id}` });
}

/** Numeric geometry edits for absolute children. */
function setGeometry(key, value) {
	if (value === '' || !Number.isFinite(Number(value)) || !active.value || !parent.value) return;
	const adopt = adoptOperations(parent.value.id);
	const current = active.value.placements?.absolute || geometry.value;
	const next = { ...current, [key]: ['width', 'height'].includes(key) ? Math.max(16, Number(value)) : Number(value) };
	run([...adopt, onFile({ op: 'setField', id: active.value.id, key: 'placements', value: { ...(active.value.placements || {}), absolute: next } })], { merge: `geometry:${active.value.id}:${key}` });
}

/** Aligns the selection inside its frame. */
function align(alignment) {
	const view = activeViewport();
	const host = parent.value;
	const element = view?.element(host?.id);
	const child = view?.element(selected.value);
	if (!element || !child) return;
	const rect = alignFrameChild(measureFrameChild(child, element), { width: element.clientWidth, height: element.clientHeight }, alignment, host.layout || detected.value[host.id]);
	run([...adoptOperations(host.id), onFile({ op: 'setField', id: active.value.id, key: 'placements', value: { ...(active.value.placements || {}), absolute: rect } })]);
}

/** Replaces the selection's inline style; an empty style is removed. */
function writeStyle(style, merge) {
	run(onFile({ op: 'setField', id: active.value.id, key: 'style', value: Object.keys(style).length ? style : undefined }), { merge });
}

/** Whether a CSS length is safe to write inline. */
function validLength(key, value) {
	return CSS.supports(key, value) && !/url|expression|[;{}]/i.test(value);
}

/** Sets a CSS length on the selection, rejecting values that are not valid CSS. Numbers are pixels. */
function setSize(key, value) {
	const clean = typeof value === 'number' ? `${value}px` : String(value).trim();
	if (clean && !validLength(key, clean)) return;
	const style = { ...(active.value.style || {}) };
	if (clean) style[key] = clean;
	else delete style[key];
	writeStyle(style, `size:${active.value.id}:${key}`);
}

/** Whether `width` or `height` runs along the parent's flex direction. */
function mainAxis(key) {
	return parentMode.value === 'flex' && (key === 'width') === !parentLayout.value.direction.startsWith('column');
}

/** Figma-style sizing of the selection along one axis: fixed, hug contents, fill the parent, or left to classes. */
function sizing(key) {
	const style = active.value?.style || {};
	const value = style[key] || '';
	if (mainAxis(key) && /^1(\s|$)/.test(style.flex || '')) return 'fill';
	if (parentMode.value === 'flex' && !mainAxis(key) && style['align-self'] === 'stretch') return 'fill';
	if (value === '100%') return 'fill';
	if (value === 'fit-content' || (!value && mainAxis(key) && style.flex === 'none')) return 'hug';
	if (/^-?[\d.]+px$/.test(value)) return 'fixed';
	return 'auto';
}

/** Clears the inline rules that size one axis, including flex grow and cross-axis stretch. */
function clearAxis(style, key) {
	delete style[key];
	if (mainAxis(key)) {
		delete style.flex;
		delete style[key === 'width' ? 'min-width' : 'min-height'];
	} else if (parentMode.value === 'flex') delete style['align-self'];
	return style;
}

/** Switches one axis between auto, fixed, hug and fill, keeping the current size when fixing it. */
function setSizing(key, mode) {
	const style = clearAxis({ ...(active.value.style || {}) }, key);
	const main = mainAxis(key);
	if (mode === 'fixed') {
		style[key] = `${Math.round(measureSelection()[key] || 0)}px`;
		if (main) style.flex = 'none';
	} else if (mode === 'hug') {
		if (main) style.flex = 'none';
		else style[key] = 'fit-content';
	} else if (mode === 'fill') {
		if (main) Object.assign(style, { flex: '1 1 0%', [key === 'width' ? 'min-width' : 'min-height']: '0px' });
		else if (parentMode.value === 'flex') style['align-self'] = 'stretch';
		else style[key] = '100%';
	}
	writeStyle(style, `sizing:${active.value.id}:${key}`);
}

/** Typing a width or height fixes that axis at the value. */
function setDimension(key, value) {
	const clean = typeof value === 'number' ? `${Math.max(0, value)}px` : String(value).trim();
	if (clean && !validLength(key, clean)) return;
	const style = clearAxis({ ...(active.value.style || {}) }, key);
	if (clean) {
		style[key] = clean;
		if (mainAxis(key)) style.flex = 'none';
	}
	writeStyle(style, `size:${active.value.id}:${key}`);
}

/** Inline CSS lengths shown as plain numbers when they are pixels. */
function lengthValue(value) {
	const text = String(value || '');
	return /^-?[\d.]+px$/.test(text) ? parseFloat(text) : text;
}

/* Structure ---------------------------------------------------------------------- */

/** Inserts a tree inside the selected container, or after the selected leaf. */
function insert(tree) {
	if (!doc.value) return;
	const target = canNest(active.value) ? active.value : parent.value || doc.value.nodes[doc.value.rootId];
	const adopt = !target.layout && detected.value[target.id]?.mode === 'absolute' ? adoptOperations(target.id) : [];
	const index = active.value && !canNest(active.value) && parent.value === target ? target.children.indexOf(active.value.id) + 1 : target.children.length;
	const fragment = fromTree(tree);
	run([...adopt, onFile({ op: 'insert', parent: target.id, index, fragment })]);
	selected.value = fragment.rootId;
}

/** Inserts any registered type with its starter props and content. */
function insertType(type, box = absoluteBox(240, 64)) {
	insert(treeFromType(type, box));
}

/** Inserts a DOM Studio component from the registry. */
function insertComponent(entry) {
	insertType(types.get(`vue:${entry.componentName}`) || componentType(entry));
}

/** Removes the selection; the file root stays so every artboard has something to render. */
function remove() {
	if (!parent.value) return;
	const host = parent.value.id;
	run(onFile({ op: 'remove', id: selected.value }));
	selected.value = host;
}

function selectParent() {
	if (parent.value) selected.value = parent.value.id;
}

/** Duplicates the selection next to itself with fresh ids. */
function duplicate() {
	if (!parent.value) return;
	const fragment = copySubtree(doc.value, selected.value, { freshIds: true });
	const copy = fragment.nodes[fragment.rootId];
	if (copy.placements?.absolute) copy.placements.absolute = { ...copy.placements.absolute, left: copy.placements.absolute.left + 16, top: copy.placements.absolute.top + 16 };
	run(onFile({ op: 'insert', parent: parent.value.id, index: parent.value.children.indexOf(selected.value) + 1, fragment }));
	selected.value = fragment.rootId;
}

/** Moves the selection earlier or later among its siblings. */
function reorder(direction) {
	const siblings = parent.value?.children;
	if (!siblings) return;
	const target = siblings.indexOf(selected.value) + direction;
	if (target < 0 || target >= siblings.length) return;
	run(onFile({ op: 'move', id: selected.value, parent: parent.value.id, index: target }));
}

/** Applies a drag in the layer tree to the document. */
function moveLayer(event) {
	const source = doc.value.nodes[String(event.sourceValue)];
	const target = doc.value.nodes[String(event.targetValue)];
	if (!source?.parent || !target || source === target) return;
	if (subtreeIds(doc.value, source.id).includes(target.id)) return;
	if (event.position === 'inside' && canNest(target)) {
		run(onFile({ op: 'move', id: source.id, parent: target.id, index: target.children.length }));
	} else if (target.parent) {
		const siblings = doc.value.nodes[target.parent].children.filter((id) => id !== source.id);
		run(onFile({ op: 'move', id: source.id, parent: target.parent, index: siblings.indexOf(target.id) + (event.position === 'after' ? 1 : 0) }));
	} else {
		run(onFile({ op: 'move', id: source.id, parent: target.id, index: target.children.length }));
	}
	selected.value = source.id;
}

/** Applies a drop from the stage: the node moves into a flow frame before a sibling, or to its end. */
function reorderFromStage({ id, parent: hostId, before }) {
	const source = doc.value?.nodes[id];
	const host = doc.value?.nodes[hostId];
	if (!source?.parent || !host || subtreeIds(doc.value, id).includes(hostId)) return;
	const siblings = host.children.filter((child) => child !== id);
	const index = before && siblings.includes(before) ? siblings.indexOf(before) : siblings.length;
	if (source.parent === hostId && host.children.indexOf(id) === index) return;
	run(onFile({ op: 'move', id, parent: hostId, index }));
	selected.value = id;
}

/** Replaces the file's preview data; the exported file never includes it. */
function setData(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return;
	// The editor echoes the value it was given; only real edits become undo steps.
	if (JSON.stringify(value) === JSON.stringify(previews.value[activeFile.value.id])) return;
	run(onFile({ op: 'setData', path: [], value }), { merge: 'data' });
}

/* Files and artboards ------------------------------------------------------------- */

/** Adds an artboard for the active file to the right of the existing ones. */
function addArtboard(preset) {
	const right = Math.max(0, ...artboards.value.map((board) => board.x + board.width + 80));
	const board = { id: workspaceId('board'), fileId: activeFile.value.id, name: preset.label, x: right, y: 0, width: preset.width, height: 760 };
	run({ op: 'addArtboard', board });
	activeArtboardId.value = board.id;
	nextTick(() => focusArtboard(board));
}

/** Removes an artboard; its file is removed too when no other artboard shows it. */
function removeArtboard(board) {
	if (artboards.value.length < 2) return;
	const orphan = !artboards.value.some((item) => item.id !== board.id && item.fileId === board.fileId);
	run([{ op: 'removeArtboard', id: board.id }, orphan ? { op: 'removeFile', id: board.fileId } : null]);
	activeArtboardId.value = artboards.value[0].id;
	selected.value = '';
}

/** Edits an artboard field; typing merges into one undo step. */
function setArtboard(board, key, value) {
	run({ op: 'setArtboard', id: board.id, key, value }, { merge: `board:${board.id}:${key}` });
}

/** Starts a blank Vue file with one desktop artboard. */
function newFile() {
	const { file } = importFile(`<section class="min-h-full space-y-4 bg-canvas p-8 text-canvas-fg">\n\t<h1 class="text-3xl font-semibold tracking-tight">Untitled page</h1>\n</section>`, `Page${workspace.value.files.length + 1}.vue`);
	addFile(file);
}

/** Adds a file and a desktop artboard for it below the current artboards. */
function addFile(file) {
	const bottom = Math.max(0, ...artboards.value.map((board) => board.y + (artboardRefs.get(board.id)?.$el?.offsetHeight || board.height) + 160));
	const board = { id: workspaceId('board'), fileId: file.id, name: file.name.replace(/\.vue$/, ''), x: 0, y: bottom, width: 1200, height: 760 };
	run([{ op: 'addFile', value: file }, { op: 'addArtboard', board }]);
	activeArtboardId.value = board.id;
	selected.value = file.doc.rootId;
	nextTick(() => focusArtboard(board));
}

/** Copies the generated SFC. */
async function copySource() {
	try { await navigator.clipboard.writeText(fileSource.value); notice.value = `${activeFile.value.name} copied.`; }
	catch { notice.value = 'Clipboard unavailable. Select the code to copy it.'; }
}

/* Code view ------------------------------------------------------------------------ */

/** Typing in the code view: the text is kept as typed and applied after a pause. */
function editCode(value) {
	codeDraft.value = value;
	clearTimeout(codeTimer);
	codeTimer = setTimeout(applyCode, 300);
}

/** Parses the edited source into the document; ids survive where the structure still matches. */
function applyCode() {
	clearTimeout(codeTimer);
	const file = activeFile.value;
	if (codeDraft.value === null || !file) return;
	let result;
	try {
		result = applySource(file, codeDraft.value, { isStudioComponent });
	} catch (error) {
		codeError.value = error.message;
		return;
	}
	codeError.value = '';
	codeWarning.value = result.unsupported ? `${result.unsupported} unsupported ${result.unsupported === 1 ? 'node was' : 'nodes were'} left out: scripts, iframes or inline event handlers.` : '';
	codeRanges.value = result.ranges;
	// The typed text becomes the source that later visual edits patch, even when only its formatting changed; undo restores the previous one.
	const sourceChanged = result.source.text !== file.source?.text;
	if (!result.changed && !sourceChanged) return;
	const operations = [{ op: 'setFile', id: file.id, key: 'source', value: result.source }];
	if (result.changed) operations.unshift({ op: 'setFile', id: file.id, key: 'doc', value: result.doc });
	if (result.script !== (file.script || '')) operations.push({ op: 'setFile', id: file.id, key: 'script', value: result.script });
	if (result.style !== (file.style || '')) operations.push({ op: 'setFile', id: file.id, key: 'style', value: result.style });
	run(operations, { merge: `code:${file.id}` });
}

/** Selects the element under the caret, so the layers, stage and inspector follow the code. */
function selectFromCode(line) {
	const ranges = codeDraft.value === null ? mappedSource.value.ranges : codeRanges.value;
	const id = ranges && nodeAtLine(ranges, line, (nodeId) => doc.value?.nodes[nodeId] && doc.value.nodes[nodeId].type !== 'text');
	if (id) selected.value = id;
}

/** Leaving the code view shows the exported source again, unless the text does not parse. */
function leaveCode() {
	applyCode();
	if (codeError.value) return;
	codeDraft.value = null;
	codeRanges.value = null;
	history.seal();
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
	run({ op: 'setWorkspace', value: props.createWorkspace() });
	activeArtboardId.value = artboards.value[0].id;
	selected.value = '';
	nextTick(fitAll);
}

/* Canvas navigation ----------------------------------------------------------------- */

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
	history.seal();
	gesture = { kind: 'artboard', board, pointer: event.pointerId, x: event.clientX, y: event.clientY, origin: { x: board.x, y: board.y } };
	viewport.value.setPointerCapture(event.pointerId);
}

function onCanvasPointermove(event) {
	if (!gesture || gesture.pointer !== event.pointerId) return;
	const dx = event.clientX - gesture.x;
	const dy = event.clientY - gesture.y;
	if (gesture.kind === 'pan') pan.value = { x: gesture.origin.x + dx, y: gesture.origin.y + dy };
	else {
		const id = gesture.board.id;
		run([
			{ op: 'setArtboard', id, key: 'x', value: Math.round(gesture.origin.x + dx / zoom.value) },
			{ op: 'setArtboard', id, key: 'y', value: Math.round(gesture.origin.y + dy / zoom.value) },
		], { merge: `drag:${id}` });
	}
}

function onCanvasPointerup(event) {
	if (!gesture || gesture.pointer !== event.pointerId) return;
	if (gesture.kind === 'artboard') history.seal();
	gesture = null;
	panning.value = false;
	if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId);
}

/* Editing text in place ------------------------------------------------------------ */

/** Double-click on the canvas: edit that text where it is, or say why it cannot be (see inlineText.js). */
function startTextEdit(board, { id, element, x, y }) {
	finishTextEdit();
	const file = fileById(board.fileId);
	if (!file) return;
	activeArtboardId.value = board.id;
	const target = inlineEditTarget(file.doc, id);
	if (target.error) { selected.value = id; notice.value = target.error; return; }
	let host = element;
	while (host && host.dataset?.designerId !== target.id) host = host.parentElement?.closest('[data-designer-id]');
	if (!host) return;
	selected.value = target.id;
	const session = beginInlineEdit({ element: host, doc: file.doc, id: target.id, point: { x, y }, onChange: readTextEdit, onEnd: finishTextEdit });
	editing.value = { board: board.id, file: file.id, id: target.id, session, view: `${board.id}:${viewMode.value}:${canvasMode.value}` };
	readTextEdit();
}

/** Copies the caret and the selected words' marks from the edit, for the code view and the Text panel. */
function readTextEdit() {
	const session = editing.value?.session;
	editState.value = session ? { caret: session.caret(), marks: session.marks() } : { caret: null, marks: null };
}

/** Ends in-place editing, writing the edited text to the document as one undo step. */
function finishTextEdit() {
	const current = editing.value;
	if (!current) return;
	editing.value = null;
	const file = fileById(current.file);
	const operations = file ? current.session.operations(file.doc) : [];
	current.session.stop();
	// The browser changed the element's DOM itself, so it is rendered afresh from the document.
	revisions.value = { ...revisions.value, [current.id]: (revisions.value[current.id] || 0) + 1 };
	editState.value = { caret: null, marks: null };
	if (operations.length) run(operations.map((operation) => ({ file: current.file, ...operation })));
}

/** A Text panel toggle while editing: bold, italic, underline or strike on the selected words. */
function toggleMark(mark) {
	editing.value?.session.toggle(mark);
	readTextEdit();
}

/** The edit caret as a line and column in the exported file, so the code view follows typing. */
function caretInSource() {
	const at = editState.value.caret;
	if (!at || editing.value?.file !== activeFile.value?.id) return null;
	const { source, offsets } = mappedSource.value;
	let offset;
	if (at.id && offsets?.[at.id]) offset = sourceCaret(source, offsets[at.id], at.value, at.offset);
	else if (at.element && offsets?.[at.element]) offset = offsets[at.element][0];
	if (offset === undefined) return null;
	const lineStart = source.lastIndexOf('\n', offset - 1);
	return { line: source.slice(0, offset).split('\n').length, column: offset - lineStart };
}

/** Selection from any artboard also makes that artboard active. */
function selectFromArtboard(board, id) {
	activeArtboardId.value = board.id;
	selected.value = id;
}

/* Keyboard -------------------------------------------------------------------------- */

/** True while the user is typing, so shortcuts never steal keystrokes. */
function isTyping(event) {
	const target = event.target;
	// Monaco types through an EditContext div (role="textbox"), which is neither a field nor contenteditable.
	return target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || Boolean(target?.closest?.('[role="textbox"], .monaco-editor'));
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
function onWindowBlur() { spaceHeld.value = false; }

watch(activeArtboardId, refresh);
// Selecting another layer, switching artboard, file or view, or opening the code ends an in-place edit.
watch(selected, (id) => { if (editing.value && id !== editing.value.id) finishTextEdit(); });
watch(() => `${activeArtboardId.value}:${viewMode.value}:${canvasMode.value}`, (view) => { if (editing.value && editing.value.view !== view) finishTextEdit(); });
// A draft belongs to one file; switching files or closing the panel shows the export again.
watch(() => [activeFile.value?.id, showCode.value], () => { clearTimeout(codeTimer); codeDraft.value = null; codeRanges.value = null; codeError.value = ''; codeWarning.value = ''; });
watch(viewMode, refresh);

onMounted(async () => {
	try { if (localStorage.getItem(canvasModeKey) === 'page') canvasMode.value = 'page'; } catch { /* storage unavailable */ }
	loadProjectFiles();
	const saved = await loadSaved();
	if (saved && !disposed) {
		workspace.value = saved;
		activeArtboardId.value = saved.artboards[0].id;
	}
	window.addEventListener('keydown', onKeydown);
	window.addEventListener('keyup', onKeyup);
	window.addEventListener('blur', onWindowBlur);
	viewport.value?.addEventListener('wheel', onWheel, { passive: false });
	compileCss();
	setTimeout(fitAll, 120);
});

onBeforeUnmount(() => {
	finishTextEdit();
	disposed = true;
	clearTimeout(compileTimer);
	saver.flush();
	window.removeEventListener('keydown', onKeydown);
	window.removeEventListener('keyup', onKeyup);
	window.removeEventListener('blur', onWindowBlur);
	viewport.value?.removeEventListener('wheel', onWheel);
});
</script>

<template>
	<div class="flex min-h-full flex-col bg-canvas text-canvas-fg lg:h-full lg:min-h-[640px] lg:overflow-hidden">
		<header class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2">
			<div class="flex min-w-0 items-center gap-3">
				<slot name="start" />
				<h1 class="text-sm font-semibold tracking-tight">{{ title }} <span v-if="badge" class="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">{{ badge }}</span></h1>
				<span v-if="activeFile" class="hidden truncate font-mono text-xs text-muted-fg sm:inline">{{ activeFile.name }}</span>
			</div>
			<div class="flex flex-wrap items-center gap-1.5">
				<DomButton size="sm" variant="ghost" @click="newFile">New file</DomButton>
				<select v-if="projectFiles?.length" class="h-7 max-w-40 rounded-md border-0 bg-secondary/60 pl-2 pr-6 text-xs text-canvas-fg outline-none hover:ring-1 hover:ring-border focus:ring-1 focus:ring-primary" aria-label="Open a project file" value="" @change="openProjectFile($event.target.value); $event.target.value = ''">
					<option value="">Project files…</option>
					<option v-for="item in projectFiles" :key="item.id" :value="item.id">{{ item.name }}</option>
				</select>
				<span class="mx-1 h-5 w-px bg-border" aria-hidden="true"></span>
				<DomButton size="sm" variant="ghost" :disabled="!historySize.undo" title="Undo (⌘Z)" @click="undo">Undo</DomButton>
				<DomButton size="sm" variant="ghost" :disabled="!historySize.redo" title="Redo (⇧⌘Z)" @click="redo">Redo</DomButton>
				<span class="mx-1 h-5 w-px bg-border" aria-hidden="true"></span>
				<div class="flex rounded-lg bg-secondary p-0.5" role="group" aria-label="Show bindings as">
					<button v-for="mode in [{ id: 'data', label: 'Data', title: 'Render bindings with preview data' }, { id: 'variables', label: 'Variables', title: 'Show each binding as a variable, every v-if branch and one item per list' }]" :key="mode.id" type="button" :aria-pressed="viewMode === mode.id" :title="mode.title" class="rounded-md px-2.5 py-1 text-xs font-medium transition" :class="viewMode === mode.id ? 'bg-canvas text-canvas-fg shadow-sm' : 'text-muted-fg hover:text-canvas-fg'" @click="viewMode = mode.id">{{ mode.label }}</button>
				</div>
			</div>
			<div class="ml-auto flex flex-wrap items-center gap-1.5">
				<div class="flex rounded-lg bg-secondary p-0.5" role="group" aria-label="Canvas mode">
					<button v-for="mode in [{ id: 'canvas', label: 'Canvas', tip: 'Canvas: artboards side by side to pan and zoom' }, { id: 'page', label: 'Page', tip: 'Page: the selected artboard fills the space as a real, scrolling browser window' }]" :key="mode.id" v-dom-tooltip="mode.tip" type="button" :aria-pressed="canvasMode === mode.id" class="rounded-md px-2.5 py-1 text-xs font-medium transition" :class="canvasMode === mode.id ? 'bg-canvas text-canvas-fg shadow-sm' : 'text-muted-fg hover:text-canvas-fg'" @click="canvasMode = mode.id">{{ mode.label }}</button>
				</div>
				<template v-if="canvasMode === 'canvas'">
					<label class="mr-2 hidden items-center gap-2 text-xs text-muted-fg md:flex"><input v-model="snapping" type="checkbox">Snap</label>
					<DomButton size="sm" variant="ghost" aria-label="Zoom out" title="Zoom out (⌘−)" @click="zoomBy(0.8)">−</DomButton>
					<button type="button" class="w-14 rounded-md py-1 text-center text-xs tabular-nums text-muted-fg hover:bg-secondary" title="Reset to 100% (⇧0)" @click="zoomBy(1 / zoom)">{{ zoomLabel }}</button>
					<DomButton size="sm" variant="ghost" aria-label="Zoom in" title="Zoom in (⌘+)" @click="zoomBy(1.25)">+</DomButton>
					<DomButton size="sm" variant="ghost" title="Zoom to fit (⇧1)" @click="fitAll">Fit</DomButton>
				</template>
				<span class="mx-1 h-5 w-px bg-border" aria-hidden="true"></span>
				<slot name="end" />
				<DomButton size="sm" :variant="showCode ? 'primary' : 'secondary'" @click="showCode = !showCode">{{ showCode ? 'Hide code' : 'Code' }}</DomButton>
			</div>
		</header>

		<p v-if="notice" role="status" class="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-secondary/40 px-4 py-2 text-sm">
			<span>{{ notice }}</span>
			<button type="button" class="text-xs text-muted-fg hover:text-canvas-fg" @click="notice = ''">Dismiss</button>
		</p>

		<div class="grid grid-cols-1 lg:min-h-0 lg:flex-1 lg:grid-cols-[16rem_minmax(0,1fr)_19rem]">
			<aside class="order-2 flex max-h-[28rem] min-h-0 flex-col border-t border-border lg:order-none lg:max-h-none lg:border-t-0 lg:border-r">
				<div class="flex shrink-0 gap-1 border-b border-border p-2" role="tablist" aria-label="Left panel">
					<button v-for="tab in ['layers', 'insert', 'data']" :key="tab" type="button" role="tab" :aria-selected="leftTab === tab" class="flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition" :class="leftTab === tab ? 'bg-secondary text-canvas-fg' : 'text-muted-fg hover:text-canvas-fg'" @click="leftTab = tab">{{ tab }}</button>
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
				<div v-else-if="leftTab === 'insert'" class="min-h-0 flex-1 space-y-4 overflow-auto p-3">
					<section>
						<h2 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">HTML</h2>
						<div class="grid grid-cols-2 gap-1.5">
							<button v-for="item in primitives" :key="item.id" type="button" class="rounded-lg border border-border p-2 text-left transition hover:border-primary" @click="insert(item.tree())">
								<span class="block text-sm font-medium">{{ item.label }}</span>
								<span class="block text-[11px] text-muted-fg">{{ item.description }}</span>
							</button>
						</div>
						<details class="mt-2 rounded-lg border border-border">
							<summary class="cursor-pointer px-2 py-1.5 text-xs font-medium text-muted-fg hover:text-canvas-fg">All HTML elements</summary>
							<div class="space-y-2 border-t border-border p-2">
								<div v-for="[group, entries] in htmlTypeGroups" :key="group">
									<p class="mb-1 text-[11px] font-medium text-muted-fg">{{ group }}</p>
									<div class="flex flex-wrap gap-1">
										<button v-for="entry in entries" :key="entry.type" type="button" class="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] transition hover:bg-primary/10 hover:text-primary" :title="`<${entry.tag}>`" @click="insertType(entry)">{{ entry.label }}</button>
									</div>
								</div>
							</div>
						</details>
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
				<div v-else class="min-h-0 flex-1 space-y-3 overflow-auto p-3">
					<div>
						<h2 class="px-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">Preview data · {{ activeFile?.name }}</h2>
						<p class="mt-1 px-1 text-xs leading-5 text-muted-fg">Bindings such as <code v-pre class="font-mono">{{ project.name }}</code> render with these values. Samples are generated from what the template reads<template v-if="scriptKeys.length">, and <span class="font-mono">{{ scriptKeys.join(', ') }}</span> come from the script</template>. Edits stay in the canvas and are never exported.</p>
					</div>
					<DomJsonInput v-if="activeFile" :model-value="previews[activeFile.id]" label="Data" :rows="18" @update:model-value="setData" />
					<DomButton size="sm" variant="secondary" :disabled="!Object.keys(doc?.data || {}).length" @click="run(onFile({ op: 'setData', path: [], value: {} }))">Reset to samples</DomButton>
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
					<div data-canvas-world :class="canvasMode === 'page' ? 'absolute inset-0' : 'absolute left-0 top-0 origin-top-left'" :style="canvasMode === 'page' ? {} : { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }">
						<div v-for="board in shownArtboards" :key="board.id" class="absolute" :class="canvasMode === 'page' && 'inset-0'" :style="canvasMode === 'page' ? {} : { left: `${board.x}px`, top: `${board.y}px` }">
							<div
								v-if="canvasMode === 'canvas'"
								class="absolute bottom-full left-0 flex cursor-move select-none items-center gap-2 whitespace-nowrap pb-2 text-muted-fg"
								:class="board.id === activeArtboard?.id && 'text-primary'"
								:style="{ fontSize: `${12 / zoom}px` }"
								@pointerdown="onArtboardTitlePointerdown($event, board)"
							>
								<span class="font-medium">{{ board.name }}</span>
								<span class="tabular-nums opacity-70">{{ board.width }} × {{ board.height }}</span>
							</div>
							<div :class="canvasMode === 'page' ? 'size-full' : ['shadow-lg ring-1', board.id === activeArtboard?.id ? 'ring-primary' : 'ring-border']">
								<ArtboardViewport
									:ref="(instance) => setArtboardRef(board.id, instance)"
									:width="board.width"
									:min-height="board.height"
									:css="css"
									:title="`${board.name} artboard`"
									:fill="canvasMode === 'page'"
									@resize="canvasMode === 'page' && (pageSize = $event)"
									@ready="board.id === activeArtboard?.id && refresh()"
									@wheel="onWheel"
									@keydown="onKeydown"
									@pointerdown="activeArtboardId = board.id"
								>
									<DomDesignerStage
										:model-value="board.fileId === activeFile?.id ? selected : ''"
										positioning
										frame-scoped
										reorder
										:editing="editing?.board === board.id ? editing.id : ''"
										:snapping="snapping"
										:spacing-snapping="snapping"
										class="bg-canvas text-canvas-fg"
										:style="{ minHeight: canvasMode === 'page' ? '100vh' : `${board.height}px` }"
										@update:model-value="selectFromArtboard(board, $event)"
										@style-change="patch"
										@reorder="reorderFromStage"
										@edit-text="startTextEdit(board, $event)"
									>
										<EditorRender
											v-if="fileById(board.fileId)"
											:doc="fileById(board.fileId).doc"
											:types="types"
											:data="previews[board.fileId]"
											:mode="viewMode"
											:detected="board.id === activeArtboard?.id ? detected : noDetectedLayouts"
											:revisions="revisions"
										/>
									</DomDesignerStage>
								</ArtboardViewport>
							</div>
							<div v-if="canvasMode === 'canvas'" class="pointer-events-none absolute inset-x-0 border-t border-dashed border-primary/60" :style="{ top: `${board.height}px`, borderTopWidth: `${1 / zoom}px` }" aria-hidden="true">
								<span class="absolute bottom-full right-0 whitespace-nowrap rounded-sm bg-canvas/90 px-1 text-primary" :style="{ fontSize: `${11 / zoom}px`, marginBottom: `${2 / zoom}px` }">Screen height {{ board.height }}</span>
							</div>
						</div>
					</div>
					<div v-if="spaceHeld || panning" class="absolute inset-0" aria-hidden="true"></div>
				</div>
				<p v-if="compilerNotice" class="pointer-events-none absolute bottom-3 left-3 max-w-md rounded-md bg-canvas/90 px-3 py-2 text-xs text-muted-fg shadow">{{ compilerNotice }}</p>
				<p v-if="canvasMode === 'canvas'" class="pointer-events-none absolute bottom-3 right-3 hidden rounded-md bg-canvas/90 px-3 py-2 text-[11px] text-muted-fg shadow md:block">Double-click text to edit · Scroll to pan · ⌘/Ctrl + scroll to zoom · Space + drag · ⇧1 fit</p>
				<p v-else-if="pageSize" class="pointer-events-none absolute bottom-3 right-3 hidden rounded-md bg-canvas/90 px-3 py-2 text-[11px] tabular-nums text-muted-fg shadow md:block">Viewport {{ pageSize.width }} × {{ pageSize.height }}</p>

				<aside v-if="showCode" class="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-canvas shadow-xl">
					<div class="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
						<p class="truncate font-mono text-xs">{{ activeFile?.name }}</p>
						<div class="flex gap-1.5">
							<DomButton v-if="projectFiles" size="sm" variant="secondary" :title="`Write ${activeFile?.path || activeFile?.name} to the project folder`" @click="saveProjectFile">Save to project</DomButton>
							<DomButton size="sm" variant="secondary" @click="copySource">Copy</DomButton>
							<DomButton size="sm" variant="secondary" @click="downloadSource">Download</DomButton>
							<DomButton size="sm" variant="ghost" @click="showCode = false">Close</DomButton>
						</div>
					</div>
					<p class="border-b border-border px-4 py-2 text-[11px] leading-4 text-muted-fg">Edit the code and the design follows. Click a line to select its element; select an element to find its code.</p>
					<component :is="codeEditor || CodeView" v-bind="codeEditor ? codeEditorProps : {}" class="flex-1" :model-value="codeText" :highlight="codeHighlight" :label="`${activeFile?.name} source`" @update:model-value="editCode" @cursor="selectFromCode" @blur="leaveCode" />
					<p v-if="codeError || codeWarning" role="status" class="border-t border-border bg-secondary px-4 py-2 text-xs" :class="codeError ? 'text-destructive' : 'text-muted-fg'">{{ codeError || codeWarning }}</p>
				</aside>
			</section>

			<aside class="order-3 min-h-0 border-t border-border text-xs lg:order-none lg:overflow-auto lg:border-t-0 lg:border-l">
				<template v-if="active && activeType">
					<header class="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
						<div class="min-w-0">
							<p class="truncate text-[11px] text-muted-fg">{{ activeType.adapter === 'vue' ? (activeType.placeholder ? 'Local Vue component' : `Vue component · ${activeType.label}`) : isFrame(active) ? 'Frame' : activeType.label }}</p>
							<h2 class="mt-0.5 truncate font-mono text-sm font-semibold">&lt;{{ activeType.tag }}&gt;</h2>
							<p class="mt-0.5 truncate text-[11px] text-muted-fg">{{ parent ? `Inside ${parent.label || tagOf(parent)} · ${parentMode}` : 'File root' }}</p>
						</div>
						<div v-if="parent" class="-mr-1.5 flex shrink-0 items-center" role="toolbar" aria-label="Layer actions">
							<button v-for="action in [{ icon: 'parent', label: 'Select parent', run: selectParent }, { icon: 'up', label: 'Move earlier', run: () => reorder(-1) }, { icon: 'down', label: 'Move later', run: () => reorder(1) }, { icon: 'duplicate', label: 'Duplicate (⌘D)', run: duplicate }, { icon: 'trash', label: 'Delete', run: remove }]" :key="action.icon" type="button" class="grid size-7 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-canvas-fg" :class="action.icon === 'trash' && 'hover:text-destructive'" :aria-label="action.label" v-dom-tooltip="action.label" @click="action.run()"><InspectorIcon :name="action.icon" /></button>
						</div>
					</header>

					<section v-if="inlineContent.length" class="space-y-2 border-b border-border px-4 py-3">
						<h3 class="text-[11px] font-semibold">Content</h3>
						<div v-for="item in inlineContent" :key="item.node.id" class="space-y-1">
							<button v-if="item.node.type !== 'text'" v-dom-tooltip="'Select this element'" type="button" class="font-mono text-[11px] text-muted-fg hover:text-primary" @click="selected = item.node.id">&lt;{{ tagOf(item.node) }}&gt;</button>
							<textarea v-if="item.text" :value="textOf(item.text).trim()" rows="2" spellcheck="true" class="block w-full resize-y rounded-md bg-secondary/60 px-2 py-1.5 text-xs leading-5 text-canvas-fg outline-none ring-inset hover:ring-1 hover:ring-border focus:bg-canvas focus:ring-1 focus:ring-primary" :class="[isExpr(item.text.props.value) && 'font-mono', item.node.type !== 'text' && 'ml-3 w-[calc(100%-0.75rem)]']" :aria-label="item.node.type === 'text' ? 'Text' : `Text in ${tagOf(item.node)}`" @change="setText(item.text, $event.target.value)" @keydown.enter.exact.prevent="$event.target.blur()"></textarea>
						</div>
					</section>

					<section v-if="parent && parentMode === 'absolute'" class="space-y-2 border-b border-border px-4 py-3">
						<div class="flex items-center justify-between gap-2">
							<h3 class="flex items-center gap-1.5 text-[11px] font-semibold">Position<span v-dom-tooltip="parentModes.absolute.tooltip" class="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-normal text-muted-fg"><InspectorIcon name="mode-absolute" class="!size-3" />Absolute</span></h3>
							<AlignTools target="frame" class="-mr-1.5" @align="align" />
						</div>
						<div class="grid grid-cols-2 gap-1.5">
							<ScrubField v-for="item in [{ key: 'left', prefix: 'X' }, { key: 'top', prefix: 'Y' }, { key: 'width', prefix: 'W' }, { key: 'height', prefix: 'H' }]" :key="item.key" :prefix="item.prefix" :label="{ left: 'X position', top: 'Y position', width: 'Width', height: 'Height' }[item.key]" :min="['width', 'height'].includes(item.key) ? 16 : null" :model-value="Math.round(geometry[item.key] ?? 0)" @update:model-value="setGeometry(item.key, $event)" />
						</div>
					</section>
					<section v-else-if="parent" class="space-y-2 border-b border-border px-4 py-3">
						<h3 class="flex items-center gap-1.5 text-[11px] font-semibold">Size<span v-if="parentModes[parentMode]" v-dom-tooltip="parentModes[parentMode].tooltip" class="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-normal text-muted-fg"><InspectorIcon :name="parentModes[parentMode].icon" class="!size-3" />{{ parentModes[parentMode].label }}</span></h3>
						<div v-for="key in ['width', 'height']" :key="key" class="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-1.5">
							<ScrubField :prefix="key === 'width' ? 'W' : 'H'" :label="key === 'width' ? 'Width' : 'Height'" css :min="0" :model-value="lengthValue(active.style?.[key])" :placeholder="geometry[key] ? String(Math.round(geometry[key])) : 'Auto'" @update:model-value="setDimension(key, $event)" />
							<select class="h-7 w-full min-w-0 rounded-md border-0 bg-secondary/60 px-2 text-xs text-canvas-fg outline-none ring-inset hover:ring-1 hover:ring-border focus:ring-1 focus:ring-primary" :value="sizing(key)" :aria-label="`${key === 'width' ? 'Width' : 'Height'} sizing`" v-dom-tooltip="{ auto: 'Auto: classes and content decide', fixed: 'Fixed: an exact size', hug: 'Hug: shrink to the content', fill: 'Fill: take the space the parent gives' }[sizing(key)]" @change="setSizing(key, $event.target.value)">
								<option v-for="mode in sizingModes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
							</select>
						</div>
						<div class="grid grid-cols-2 gap-1.5 pt-1">
							<ScrubField v-for="key in ['margin-top', 'margin-bottom']" :key="key" :prefix="key === 'margin-top' ? '↑' : '↓'" :label="key === 'margin-top' ? 'Top margin' : 'Bottom margin'" css :model-value="lengthValue(active.style?.[key])" placeholder="Margin" @update:model-value="setSize(key, $event)" />
						</div>
					</section>

					<section v-if="isFrame(active)" class="space-y-2 border-b border-border px-4 py-3">
						<DomFrameLayoutEditor :key="active.id" title="Layout" :model-value="layout" @update:model-value="setLayout" />
						<p v-if="!active.layout" class="text-[11px] leading-4 text-muted-fg">Read from the HTML at {{ activeArtboard?.width }}px. Changing a control adds an explicit override.</p>
					</section>

					<section v-if="active.directives?.length" class="space-y-1.5 border-b border-border px-4 py-3">
						<h3 class="text-[11px] font-semibold">Template logic</h3>
						<ul class="flex flex-wrap gap-1"><li v-for="source in active.directives" :key="source" class="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">{{ source }}</li></ul>
						<p class="text-[11px] leading-4 text-muted-fg">Kept on export. Data view runs lists and conditions on preview data; Variables view shows every branch and one item of each list.</p>
					</section>
					<div class="border-b border-border px-4">
						<DomTypographyEditor v-if="showText && textStyle" title="Text" :google-fonts="googleFonts" :model-value="textStyle" :marks="editing?.id === selected ? editState.marks || {} : null" @update:model-value="setStyle('text', $event)" @mark="toggleMark" />
						<template v-for="kind in ['fill', 'stroke', 'shadow', 'blur']" :key="kind">
							<StyleControlSection v-if="customStyle[kind]" :model-value="true" :title="styleTitles[kind]" meta="Custom CSS">
								<template #actions><ControlIconButton icon="remove" :label="`Remove ${styleTitles[kind].toLowerCase()}`" @click="setStyleRaw(kind, '')" /></template>
								<input class="h-7 w-full min-w-0 rounded-md bg-secondary/60 px-2 font-mono text-[11px] text-canvas-fg outline-none focus:bg-canvas focus:ring-1 focus:ring-primary" :value="customStyle[kind]" :aria-label="`${styleTitles[kind]} CSS`" spellcheck="false" @change="setStyleRaw(kind, $event.target.value)">
								<p class="mt-1.5 text-[11px] leading-4 text-muted-fg">Edited as CSS, since the {{ styleTitles[kind].toLowerCase() }} controls cannot show this value.</p>
							</StyleControlSection>
							<DomBackgroundEditor v-else-if="kind === 'fill' && fillStyle" title="Fill" :model-value="fillStyle" @update:model-value="setStyle('fill', $event)" />
							<DomBorderEditor v-else-if="kind === 'stroke' && strokeStyle" title="Stroke" :model-value="strokeStyle" @update:model-value="setStyle('stroke', $event)" />
							<DomShadowEditor v-else-if="kind === 'shadow' && shadowStyle" title="Shadow" :model-value="shadowStyle" @update:model-value="setStyle('shadow', $event)" />
							<DomBackdropEditor v-else-if="kind === 'blur' && blurStyle" title="Background blur" :model-value="blurStyle" @update:model-value="setStyle('blur', $event)" />
						</template>
					</div>
					<div class="space-y-5 px-4 py-3">
						<NodeInspector v-if="textChild" :key="`text-${textChild.id}`" :node="textChild" :type="types.get('text')" :data="previews[activeFile.id]" @set-prop="setProp(textChild.id, $event)" />
						<NodeInspector :key="active.id" :node="active" :type="activeType" :data="previews[activeFile.id]" @set-prop="setProp(active.id, $event)" />
					</div>
				</template>

				<div v-else-if="activeArtboard" class="space-y-5 p-4">
					<div>
						<p class="text-xs text-muted-fg">Artboard</p>
						<h2 class="mt-0.5 font-semibold">{{ activeArtboard.name }}</h2>
						<p class="mt-1 text-xs text-muted-fg">Select a layer on the canvas or in the layer list.</p>
					</div>
					<DomTextInput :model-value="activeArtboard.name" label="Name" @update:model-value="setArtboard(activeArtboard, 'name', $event)" />
					<DomNumberInput :model-value="activeArtboard.width" label="Width" :min="240" :max="2560" @update:model-value="Number.isFinite(Number($event)) && setArtboard(activeArtboard, 'width', Math.min(2560, Math.max(240, Number($event))))" />
					<DomNumberInput :model-value="activeArtboard.height" label="Screen height" description="The device's visible height: what 100vh means on this artboard, shown as the dashed line." :min="320" :max="2160" @update:model-value="Number.isFinite(Number($event)) && setArtboard(activeArtboard, 'height', Math.min(2160, Math.max(320, Number($event))))" />
					<DomNativeSelect label="Preset" :model-value="String(activeArtboard.width)" :options="artboardPresets.map((preset) => ({ label: `${preset.label} · ${preset.width}`, value: String(preset.width) }))" @update:model-value="setArtboard(activeArtboard, 'width', Number($event))" />
					<DomTextInput v-if="activeFile" :model-value="activeFile.name" label="File name" @update:model-value="run({ op: 'setFile', id: activeFile.id, key: 'name', value: $event }, { merge: `file:${activeFile.id}:name` })" />
					<section class="space-y-2 border-t border-border pt-4">
						<h3 class="text-sm font-semibold">Add a breakpoint</h3>
						<p class="text-xs leading-5 text-muted-fg">A new artboard for {{ activeFile?.name }}. Edits show in every artboard of the same file.</p>
						<div class="flex flex-wrap gap-1.5"><DomButton v-for="preset in artboardPresets" :key="preset.width" size="sm" variant="secondary" @click="addArtboard(preset)">{{ preset.label }}</DomButton></div>
					</section>
					<div class="flex flex-wrap gap-1.5 border-t border-border pt-4">
						<DomButton size="sm" variant="secondary" :disabled="artboards.length < 2" @click="removeArtboard(activeArtboard)">Remove artboard</DomButton>
						<DomButton size="sm" variant="ghost" @click="resetDemo">Reset canvas</DomButton>
					</div>
				</div>
			</aside>
		</div>
	</div>
</template>
