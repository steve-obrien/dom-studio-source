<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { DomButton, DomDesignerStage, DomDesignerLayers, DomFrameLayoutEditor, DomNumberInput, DomTextInput, DomTextareaInput } from '../../lib/vue';
import FrameNode from './FrameNode.vue';
import FrameViewport from './FrameViewport.vue';
import { alignFrameChild, createFrameLayout, measureFrameChild, readFrameLayout, spaceFrameChildren } from '../frame/frameLayout.js';
import { createFrameDemo, createFrameNode, exportFrameHtml, flattenFrames, frameTailwindContent, importFrameHtml, isFrameNode, tailwindFrameExample } from './frameDocument.js';

const root = ref(createFrameDemo());
const selected = ref(root.value.children[0].id);
const viewport = ref(null);
const width = ref(820);
const detected = ref({});
const css = ref('');
const showImport = ref(false);
const showSource = ref(false);
const htmlDraft = ref(tailwindFrameExample);
const notice = ref('');
const importing = ref(false);
const snapping = ref(true);
const spacing = ref(true);
const arrangeGap = ref(16);
const past = ref([]);
const future = ref([]);
let lastSnapshot = JSON.stringify({ root: root.value, css: css.value });
let historyTimer;
let disposed = false;
let request;
const entries = computed(() => flattenFrames(root.value));
const activeEntry = computed(() => entries.value.find(({ node }) => node.id === selected.value));
const active = computed(() => activeEntry.value?.node);
const parent = computed(() => activeEntry.value?.parent);
const layout = computed(() => active.value?.layout || detected.value[selected.value] || createFrameLayout());
const parentMode = computed(() => parent.value?.layout?.mode || detected.value[parent.value?.id]?.mode);
const source = computed(() => exportFrameHtml(root.value));
const layers = computed(() => [layer(root.value)]);
const textNode = computed(() => active.value?.children?.length === 1 && active.value.children[0].tag === '#text' ? active.value.children[0] : null);
const geometry = computed(() => {
	if (active.value?.placements?.absolute) return active.value.placements.absolute;
	const element = viewport.value?.element(selected.value);
	const host = viewport.value?.element(parent.value?.id);
	return element && host ? measureFrameChild(element, host) : {};
});

/** Creates nested layer records while keeping whitespace-only source nodes out of the tree UI. */
function layer(node) {
	return { id: node.id, label: node.label || `${node.tag}${node.attrs?.id ? ` #${node.attrs.id}` : ''}`, open: true, children: node.children.filter((child) => child.tag !== '#text').map(layer) };
}
/** Measures source layout after the browser has applied imported and responsive styles. */
async function refresh() {
	await nextTick();
	if (disposed) return;
	const next = {};
	for (const { node } of entries.value) {
		const element = viewport.value?.element(node.id);
		if (isFrameNode(node) && element) next[node.id] = readFrameLayout(element);
	}
	detected.value = next;
}
/** Records one undo point after a burst of input or a drag, retaining complete per-mode geometry. */
function commitHistory() {
	clearTimeout(historyTimer);
	const snapshot = JSON.stringify({ root: root.value, css: css.value });
	if (snapshot === lastSnapshot) return;
	past.value = [...past.value.slice(-49), lastSnapshot];
	future.value = [];
	lastSnapshot = snapshot;
}
/** Debounces continuous edits while keeping geometry and import actions recoverable. */
function queueHistory() { clearTimeout(historyTimer); historyTimer = setTimeout(commitHistory, 300); }
/** Restores an existing document snapshot without assigning new layer identities. */
function restore(snapshot) {
	const saved = JSON.parse(snapshot);
	root.value = saved.root;
	css.value = saved.css;
	lastSnapshot = snapshot;
	if (!entries.value.some(({ node }) => node.id === selected.value)) selected.value = root.value.id;
	refresh();
}
/** Reverts the latest completed edit, first committing pending input. */
function undo() { commitHistory(); if (past.value.length) { future.value.push(lastSnapshot); restore(past.value.pop()); } }
/** Reapplies the last reverted edit. */
function redo() { if (future.value.length) { past.value.push(lastSnapshot); restore(future.value.pop()); } }
/** Captures each immediate child relative to its frame without changing descendant layouts. */
function captureChildren(node) {
	const element = viewport.value?.element(node.id);
	if (!element) return;
	for (const child of node.children) {
		const target = viewport.value.element(child.id);
		if (!target) continue;
		child.placements.absolute = measureFrameChild(target, element);
		child.sourceAbsolute ??= target.ownerDocument.defaultView.getComputedStyle(target).position === 'absolute' && !node.layout;
	}
}
/** Switches only child layout; returning to absolute restores that frame's previous geometry. */
async function setLayout(value) {
	const node = active.value;
	if (!node || !isFrameNode(node)) return;
	commitHistory();
	const oldMode = node.layout?.mode || detected.value[node.id]?.mode;
	if (!node.layout && oldMode === 'absolute') captureChildren(node);
	if (value.mode === 'absolute' && oldMode !== 'absolute') {
		// Literal text becomes a real selectable item only when it needs an absolute box.
		node.children = node.children.filter((child) => child.tag !== '#text' || child.text.trim()).map((child) => child.tag === '#text' ? createFrameNode({ tag: 'span', children: [child] }) : child);
		await nextTick();
		const element = viewport.value?.element(node.id);
		if (element) node.absoluteHeight ??= element.offsetHeight;
		const saved = new Map(node.children.filter((child) => child.placements.absolute).map((child) => [child.id, child.placements.absolute]));
		captureChildren(node);
		for (const child of node.children) if (saved.has(child.id)) child.placements.absolute = saved.get(child.id);
	}
	node.layout = value;
	commitHistory();
	refresh();
}
/** Adopts a source absolute frame before writing stage geometry into the shared document. */
function patch({ id, style }) {
	const entry = entries.value.find(({ node }) => node.id === id);
	if (!entry?.parent) return;
	if (!entry.parent.layout) {
		captureChildren(entry.parent);
		entry.parent.layout = detected.value[entry.parent.id] || createFrameLayout({ mode: 'absolute' });
	}
	entry.node.placements.absolute = Object.fromEntries(['left', 'top', 'width', 'height'].map((key) => [key, parseFloat(style[key])]));
}
/** Edits an absolute child's geometry with the same model used by pointer positioning. */
function setGeometry(key, value) {
	if (value === '' || !Number.isFinite(Number(value))) return;
	const node = active.value;
	const host = parent.value;
	if (!node || !host) return;
	if (!host.layout) { captureChildren(host); host.layout = detected.value[host.id]; }
	if (!node.placements.absolute) captureChildren(host);
	node.placements.absolute[key] = ['width', 'height'].includes(key) ? Math.max(16, Number(value)) : Number(value);
}
/** Aligns the selected absolute item to its immediate frame rather than to the outer canvas. */
function align(alignment) {
	const host = parent.value;
	const element = viewport.value?.element(host?.id);
	const child = viewport.value?.element(selected.value);
	if (!element || !child) return;
	commitHistory();
	if (!host.layout) { captureChildren(host); host.layout = detected.value[host.id]; }
	active.value.placements.absolute = alignFrameChild(measureFrameChild(child, element), { width: element.clientWidth, height: element.clientHeight }, alignment, host.layout.padding);
	commitHistory();
}
/** Applies a chosen gap to immediate children of the selected absolute frame. */
function spaceChildren(axis) {
	const node = active.value;
	commitHistory();
	captureChildren(node);
	node.layout ||= detected.value[node.id];
	const children = node.children.filter((child) => child.placements.absolute);
	const result = spaceFrameChildren(children.map((child) => child.placements.absolute), axis, arrangeGap.value);
	children.forEach((child, index) => { child.placements.absolute = result[index]; });
	commitHistory();
}
/** Inserts a new frame inside the selection, or beside a selected content element. */
function addFrame() {
	const host = isFrameNode(active.value) ? active.value : parent.value || root.value;
	commitHistory();
	adoptAbsolute(host);
	const node = createFrameNode({ label: 'New frame', layout: createFrameLayout({ mode: 'flex', gap: 12, padding: 16 }), attrs: { class: 'min-h-32 rounded-xl border border-border bg-secondary' }, placements: { absolute: { left: 24, top: 24, width: 260, height: 160 } } });
	host.children.push(node);
	selected.value = node.id;
	commitHistory();
	refresh();
}
/** Adds a text element to the selected frame so empty nested layouts can be composed directly. */
function addText() {
	const host = isFrameNode(active.value) ? active.value : parent.value || root.value;
	commitHistory();
	adoptAbsolute(host);
	const node = createFrameNode({ tag: 'p', attrs: { class: 'rounded-lg bg-primary p-3 text-primary-fg' }, placements: { absolute: { left: 16, top: 16, width: 160, height: 48 } }, children: [createFrameNode({ tag: '#text', text: 'New text' })] });
	host.children.push(node);
	selected.value = node.id;
	commitHistory();
}
/** Adopts imported absolute child placement before insertion changes layout detection. */
function adoptAbsolute(node) {
	if (!node.layout && detected.value[node.id]?.mode === 'absolute') {
		captureChildren(node);
		node.layout = detected.value[node.id];
	}
}
/** Edits a supported CSS size or flow margin, preserving all unrelated source attributes. */
function setSize(key, value) {
	const clean = String(value).trim();
	if (!clean) { delete active.value.style[key]; return; }
	if (!CSS.supports(key, clean) || /url|expression|[;{}]/i.test(clean)) return;
	if (key === 'height') delete active.value.absoluteHeight;
	active.value.style[key] = `${clean} !important`;
}
/** Reorders flow, flex and grid items in document order, preserving their own nested layouts. */
function reorder(direction) {
	const siblings = parent.value?.children;
	if (!siblings) return;
	const index = siblings.indexOf(active.value);
	const target = index + direction;
	if (target < 0 || target >= siblings.length) return;
	commitHistory();
	[siblings[index], siblings[target]] = [siblings[target], siblings[index]];
	commitHistory();
}
/** Deletes a selected subtree; the root canvas remains available and undo restores the subtree. */
function remove() {
	if (!parent.value) return;
	commitHistory();
	const host = parent.value;
	host.children = host.children.filter((child) => child.id !== selected.value);
	selected.value = host.id;
	commitHistory();
}
/** Compiles imported utility classes before replacing the document; failed imports preserve edits. */
async function importHtml() {
	if (importing.value) return;
	importing.value = true;
	notice.value = '';
	request = new AbortController();
	try {
		const result = importFrameHtml(htmlDraft.value, document);
		const response = await fetch('/api/experiments/template-editor/tailwind.css', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: frameTailwindContent(result.root) }), signal: request.signal });
		if (!response.ok) throw new Error('Tailwind compilation is unavailable. Your current design is still here.');
		const compiled = await response.text();
		if (disposed) return;
		commitHistory();
		css.value = compiled;
		root.value = result.root;
		selected.value = result.root.id;
		showImport.value = false;
		await refresh();
		commitHistory();
		notice.value = `HTML imported. ${result.removed ? `${result.removed} unsupported elements or attributes removed. ` : ''}Select a container to edit its layout.`;
	} catch (error) { if (!disposed && error.name !== 'AbortError') notice.value = error.message; }
	finally { importing.value = false; }
}
/** Restores the nested example as an undoable action. */
function resetDemo() { commitHistory(); root.value = createFrameDemo(); selected.value = root.value.children[0].id; commitHistory(); refresh(); }
/** Copies clean HTML using the same projection as the rendered canvas. */
async function copyHtml() {
	try { await navigator.clipboard.writeText(source.value); notice.value = 'HTML copied. Use it with the same Tailwind and theme stylesheet.'; }
	catch { notice.value = 'Clipboard unavailable. Select the HTML in the source panel to copy it.'; }
}
/** Releases pending history and import work when the demo unmounts. */
function cleanup() { disposed = true; clearTimeout(historyTimer); request?.abort(); }
watch(root, queueHistory, { deep: true, flush: 'sync' });
watch(width, refresh);
onBeforeUnmount(cleanup);
</script>

<template>
	<main class="min-h-screen bg-canvas text-canvas-fg">
		<header class="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
			<div><RouterLink to="/designer" class="text-xs text-muted-fg hover:text-primary">← UI designer</RouterLink><h1 class="mt-1 text-xl font-semibold tracking-tight">Frame designer <span class="ml-1 text-xs font-normal text-muted-fg">Beta</span></h1></div>
			<div class="flex flex-wrap gap-2"><DomButton size="sm" @click="resetDemo">Nested demo</DomButton><DomButton size="sm" @click="showImport = !showImport">Import HTML</DomButton><DomButton size="sm" @click="showSource = !showSource">{{ showSource ? 'Hide HTML' : 'View HTML' }}</DomButton><DomButton size="sm" :disabled="!past.length" @click="undo">Undo</DomButton><DomButton size="sm" :disabled="!future.length" @click="redo">Redo</DomButton></div>
		</header>
		<p class="border-b border-border bg-secondary/30 px-5 py-3 text-sm text-muted-fg">Frames arrange their own children. Nest absolute, flex, grid and normal flow in any order. Edits stay in this tab.</p>
		<p v-if="notice" role="status" class="border-b border-border px-5 py-3 text-sm">{{ notice }}</p>
		<section v-if="showImport" class="space-y-3 border-b border-border p-5">
			<DomTextareaInput v-model="htmlDraft" label="Tailwind HTML" :rows="9" description="Paste a native HTML fragment. Tailwind classes and safe inline styles are preserved; scripts, Vue bindings, embeds and stylesheet tags are not imported." />
			<div class="flex flex-wrap gap-2"><DomButton :disabled="importing" @click="importHtml">{{ importing ? 'Importing…' : 'Load into designer' }}</DomButton><DomButton @click="htmlDraft = tailwindFrameExample">Load sample HTML</DomButton></div>
		</section>
		<div class="grid min-w-0 grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)_280px]">
			<aside class="min-w-0 border-b border-border p-4 lg:border-r lg:border-b-0">
				<div class="mb-4 flex gap-2"><DomButton size="sm" @click="addFrame">+ Frame</DomButton><DomButton size="sm" @click="addText">+ Text</DomButton></div>
				<div class="max-h-56 overflow-auto lg:max-h-[720px]"><DomDesignerLayers v-model="selected" :items="layers" /></div>
			</aside>
			<section class="min-w-0">
				<div class="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3">
					<div class="flex gap-1"><DomButton v-for="size in [390, 820, 1200]" :key="size" size="sm" :aria-pressed="width === size" @click="width = size">{{ size }}px</DomButton></div>
					<label class="flex items-center gap-2 text-xs"><input v-model="snapping" type="checkbox">Alignment snaps</label><label class="flex items-center gap-2 text-xs"><input v-model="spacing" type="checkbox">Spacing snaps</label>
				</div>
				<FrameViewport ref="viewport" :width="width" :css="css" @ready="refresh">
					<DomDesignerStage v-model="selected" positioning frame-scoped :snapping="snapping" :spacing-snapping="spacing" class="min-h-[620px] bg-canvas text-canvas-fg" @style-change="patch"><FrameNode :node="root" :detected="detected" /></DomDesignerStage>
				</FrameViewport>
				<div v-if="showSource" class="space-y-3 border-t border-border p-4"><div class="flex items-center justify-between"><p class="text-sm font-medium">HTML · uses your Tailwind/theme stylesheet</p><DomButton size="sm" @click="copyHtml">Copy HTML</DomButton></div><textarea aria-label="Exported HTML" readonly :value="source" class="h-64 w-full rounded border border-border bg-secondary p-3 font-mono text-xs" /></div>
			</section>
			<aside class="min-w-0 space-y-5 border-t border-border p-4 lg:max-h-[800px] lg:overflow-auto lg:border-t-0 lg:border-l">
				<template v-if="active">
					<div><p class="text-xs text-muted-fg">Selected {{ isFrameNode(active) ? 'frame' : 'element' }}</p><h2 class="mt-1 font-semibold">{{ active.label || active.tag }}</h2><p class="mt-1 text-xs text-muted-fg">{{ parent ? `Inside ${parent.label || parent.tag} · ${parentMode || 'flow'}` : 'Root canvas' }}</p></div>
					<template v-if="isFrameNode(active)"><p v-if="!active.layout" class="text-xs leading-5 text-muted-fg">Layout read from HTML at {{ width }}px. Changing a control creates an explicit override; original classes stay available.</p><DomFrameLayoutEditor :model-value="layout" @update:model-value="setLayout" /></template>
					<template v-if="parentMode === 'absolute'">
						<section class="space-y-3 border-t border-border pt-4"><h3 class="text-sm font-semibold">Position in parent</h3><div class="grid grid-cols-2 gap-3"><DomNumberInput v-for="key in ['left', 'top', 'width', 'height']" :key="key" :label="key" :model-value="geometry[key] ?? ''" @update:model-value="setGeometry(key, $event)" /></div><div class="grid grid-cols-3 gap-1"><DomButton v-for="edge in ['left', 'center', 'right', 'top', 'middle', 'bottom']" :key="edge" size="sm" :aria-label="`Align ${edge} in parent`" @click="align(edge)">{{ edge }}</DomButton></div></section>
					</template>
					<section v-else class="space-y-3 border-t border-border pt-4"><h3 class="text-sm font-semibold">Size & flow spacing</h3><div class="grid grid-cols-2 gap-3"><DomTextInput v-for="key in ['width', 'height', 'margin-top', 'margin-bottom']" :key="key" :label="key" :model-value="(active.style[key] || '').replace(' !important', '')" placeholder="From HTML" @update:model-value="setSize(key, $event)" /></div><p class="text-xs text-muted-fg">CSS lengths such as 240px, 100% or auto.</p></section>
					<section v-if="isFrameNode(active) && layout.mode === 'absolute'" class="space-y-3 border-t border-border pt-4"><h3 class="text-sm font-semibold">Space immediate children</h3><DomNumberInput v-model="arrangeGap" label="Spacing distance" :min="0" /><div class="flex gap-2"><DomButton size="sm" @click="spaceChildren('x')">Horizontal</DomButton><DomButton size="sm" @click="spaceChildren('y')">Vertical</DomButton></div></section>
					<DomTextareaInput v-if="textNode" v-model="textNode.text" label="Text" :rows="3" />
					<DomTextareaInput :model-value="active.attrs.class || ''" label="Original classes" :rows="3" readonly description="Preserved from the source. Layout controls add explicit CSS overrides." />
					<div v-if="parent" class="flex flex-wrap gap-2 border-t border-border pt-4"><DomButton size="sm" @click="reorder(-1)">Earlier</DomButton><DomButton size="sm" @click="reorder(1)">Later</DomButton><DomButton size="sm" @click="remove">Delete</DomButton><DomButton size="sm" @click="selected = parent.id">Select parent</DomButton></div>
				</template>
			</aside>
		</div>
	</main>
</template>
