<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { DomSplitterPanel, DomButton, DomTextInput, DomTextareaInput, DomNumberInput, DomNativeSelect, DomRangeInput, DomDesignerLayers, DomDesignerStage, DomColorSwatch, DomShadowEditor, DomBorderEditor, DomBackgroundEditor, DomBackdropEditor } from '../../lib/vue';
import { applyPosterGeometry, createPoster, createPosterLayer, exportPosterHtml, fontOptions, posterHtmlLines, posterLayerStyle, safePosterImage } from './posterModel.js';

const poster = ref(createPoster());
const selected = ref('headline');
const workspace = ref(null);
const upload = ref(null);
const zoomChoice = ref('fit');
const snapping = ref(true);
const spacingSnapping = ref(false);
const leftPanelWidth = ref(220);
const rightPanelWidth = ref(300);
const artwork = ref(null);
const fitScale = ref(0.3);
const mobilePanel = ref('poster');
const showCode = ref(false);
const notice = ref('');
const imageErrors = ref({});
const imageUrlDraft = ref('');
const past = ref([]);
const future = ref([]);
let lastSnapshot = JSON.stringify(poster.value);
let historyTimer;
let observer;
let restoring = false;
let nextId = 1;
let disposed = false;
const active = computed(() => poster.value.layers.find((layer) => layer.id === selected.value));
const scale = computed(() => zoomChoice.value === 'fit' ? fitScale.value : Number(zoomChoice.value));
const layers = computed(() => poster.value.layers.toReversed().map((layer) => ({ id: layer.id, label: `${layer.name}${layer.locked ? ' · locked' : ''}${layer.hidden ? ' · hidden' : ''}` })));
const source = computed(() => posterHtmlLines(poster.value));
const activeIndex = computed(() => poster.value.layers.findIndex((layer) => layer.id === selected.value));
const geometryFields = [{ key: 'x', label: 'X' }, { key: 'y', label: 'Y' }, { key: 'width', label: 'Width', min: 16 }, { key: 'height', label: 'Height', min: 16 }];
const presets = [{ label: 'Story · 1080 × 1920', value: '1080x1920' }, { label: 'Portrait · 1080 × 1350', value: '1080x1350' }, { label: 'Square · 1080 × 1080', value: '1080x1080' }];

/** Commits one undo point after a burst of typing or pointer movement. */
function commitHistory() {
	clearTimeout(historyTimer);
	const next = JSON.stringify(poster.value);
	if (next === lastSnapshot) return;
	past.value = [...past.value.slice(-49), lastSnapshot];
	lastSnapshot = next;
	future.value = [];
}
/** Groups continuous property edits into an undoable operation. */
function queueHistory() {
	if (restoring) return;
	clearTimeout(historyTimer);
	historyTimer = setTimeout(commitHistory, 350);
}
/** Restores a trusted in-memory history entry without recording another edit. */
function restore(snapshot) {
	restoring = true;
	poster.value = JSON.parse(snapshot);
	lastSnapshot = snapshot;
	restoring = false;
	if (!poster.value.layers.some((layer) => layer.id === selected.value)) selected.value = 'frame';
}
/** Reverts the latest edit, including changes waiting for the history debounce. */
function undo() {
	commitHistory();
	if (!past.value.length) return;
	future.value.push(lastSnapshot);
	restore(past.value.pop());
}
/** Reapplies the latest reverted edit. */
function redo() {
	if (!future.value.length) return;
	past.value.push(lastSnapshot);
	restore(future.value.pop());
}
/** Starts an independent undoable action rather than merging it with previous typing. */
function act(callback) {
	commitHistory();
	callback();
	commitHistory();
}
/** Adds a new editable text, image or shape layer above existing artwork. */
function addLayer(type) {
	act(() => {
		const layer = createPosterLayer(type, `layer-${nextId++}`, { width: Math.min(920, poster.value.width - 80), y: Math.round(poster.value.height / 3) });
		poster.value.layers.push(layer);
		selected.value = layer.id;
	});
}
/** Duplicates the current layer with a unique identity and an offset position. */
function duplicate() {
	if (!active.value) return;
	act(() => {
		const layer = JSON.parse(JSON.stringify(active.value));
		Object.assign(layer, { id: `layer-${nextId++}`, name: `${layer.name} copy`, locked: false, x: layer.x + 30, y: layer.y + 30 });
		poster.value.layers.splice(activeIndex.value + 1, 0, layer);
		selected.value = layer.id;
	});
}
/** Deletes only an unlocked selected layer; undo can recover it. */
function remove() {
	if (!active.value || active.value.locked) return;
	act(() => { poster.value.layers.splice(activeIndex.value, 1); selected.value = 'frame'; });
}
/** Changes the selected layer's stacking order while preserving stable selection. */
function reorder(direction) {
	if (!active.value || active.value.locked) return;
	const target = activeIndex.value + direction;
	if (target < 0 || target >= poster.value.layers.length) return;
	act(() => {
		const [layer] = poster.value.layers.splice(activeIndex.value, 1);
		poster.value.layers.splice(target, 0, layer);
	});
}
/** Applies the shared stage's CSS geometry to the poster model. */
function patch(event) {
	applyPosterGeometry(poster.value.layers.find((layer) => layer.id === event.id), event.style);
}
/** Updates a finite numeric inspector value without allowing invalid dimensions. */
function number(key, value, min = -10000, max = 10000) {
	if (!active.value || active.value.locked || value === '' || !Number.isFinite(Number(value))) return;
	active.value[key] = Math.min(max, Math.max(min, Number(value)));
}
/** Resizes the frame and proportionally scales layer geometry to retain the composition. */
function setPreset(value) {
	const [width, height] = value.split('x').map(Number);
	if (!presets.some((preset) => preset.value === value)) return;
	act(() => {
		const sx = width / poster.value.width;
		const sy = height / poster.value.height;
		for (const layer of poster.value.layers) {
			layer.x = Math.round(layer.x * sx); layer.y = Math.round(layer.y * sy);
			layer.width = Math.round(layer.width * sx); layer.height = Math.round(layer.height * sy);
			layer.fontSize = Math.round(layer.fontSize * Math.min(sx, sy));
		}
		poster.value.width = width; poster.value.height = height;
	});
	nextTick(fit);
}
/** Fits the full-resolution HTML into the available workspace without changing its model. */
function fit() {
	if (!workspace.value) return;
	fitScale.value = Math.max(0.05, Math.min(1, (workspace.value.clientWidth - 72) / poster.value.width, (workspace.value.clientHeight - 80) / poster.value.height));
}
/** Commits a supported image URL and clears any previous loading error. */
function setImage(value) {
	if (!active.value || active.value.locked) return;
	const url = safePosterImage(value);
	if (!url) { notice.value = 'Use an http or https image URL, or upload a PNG, JPEG, WebP or GIF.'; return; }
	active.value.value = url;
	delete imageErrors.value[active.value.id];
}
/** Reads a user-selected raster image locally; no upload leaves the browser. */
function uploadImage(event) {
	const file = event.target.files?.[0];
	const targetId = active.value?.type === 'image' && !active.value.locked ? active.value.id : null;
	if (!file) return;
	if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 8 * 1024 * 1024) {
		notice.value = 'Choose a PNG, JPEG, WebP or GIF under 8 MB.'; event.target.value = ''; return;
	}
	const reader = new FileReader();
	reader.onload = () => {
		if (disposed) return;
		act(() => {
			let target = poster.value.layers.find((layer) => layer.id === targetId && !layer.locked);
			if (!target) { target = createPosterLayer('image', `layer-${nextId++}`); poster.value.layers.push(target); }
			target.value = String(reader.result); target.name = file.name; selected.value = target.id;
		});
		notice.value = 'Image added locally. Export HTML to keep your work.';
	};
	reader.onerror = () => { if (!disposed) notice.value = 'That image could not be read. Try another file.'; };
	reader.readAsDataURL(file);
	event.target.value = '';
}
/** Downloads a standalone HTML poster containing local images and the current CSS. */
function download() {
	const url = URL.createObjectURL(new Blob([exportPosterHtml(poster.value)], { type: 'text/html' }));
	const link = document.createElement('a');
	link.href = url; link.download = 'dom-studio-poster.html'; link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	notice.value = 'HTML exported. Linked photos still need an internet connection.';
}
/** Copies the exact export document, reporting clipboard failures without losing edits. */
async function copy() {
	try { await navigator.clipboard.writeText(exportPosterHtml(poster.value)); notice.value = 'HTML copied.'; }
	catch { notice.value = 'Clipboard unavailable. Use Export HTML instead.'; }
}
/** Zooms around the pointer; ordinary wheel events retain native workspace scrolling. */
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
/** Installs workspace measurement after hydration. */
function mount() {
	observer = new ResizeObserver(fit);
	observer.observe(workspace.value);
	workspace.value.addEventListener('wheel', wheelZoom, { passive: false });
	fit();
}
/** Releases measurement and history work when leaving the example. */
function cleanup() {
	disposed = true;
	workspace.value?.removeEventListener('wheel', wheelZoom);
	observer?.disconnect();
	clearTimeout(historyTimer);
}
/** Keeps the URL draft aligned with the selected image without editing the poster while typing. */
function syncImageDraft() {
	imageUrlDraft.value = active.value?.type === 'image' && !active.value.value.startsWith('data:') ? active.value.value : '';
}
watch(() => [selected.value, active.value?.value], syncImageDraft, { immediate: true });
watch(poster, queueHistory, { deep: true, flush: 'sync' });
onMounted(mount);
onBeforeUnmount(cleanup);
</script>

<template>
	<main class="flex h-dvh min-h-0 flex-col bg-canvas text-canvas-fg">
		<header class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
			<div class="flex flex-wrap items-center gap-3"><RouterLink to="/designer" class="text-sm text-muted-fg hover:text-canvas-fg">← UI designer</RouterLink><RouterLink to="/designer/assembly#poster" class="text-sm text-primary underline underline-offset-4">Assembly guide</RouterLink><span class="h-4 border-l border-border"></span><h1 class="text-sm font-semibold">Poster studio</h1><span class="rounded bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">Beta</span></div>
			<div class="flex items-center gap-2"><DomButton size="sm" variant="ghost" :disabled="!past.length && JSON.stringify(poster) === lastSnapshot" @click="undo">Undo</DomButton><DomButton size="sm" variant="ghost" :disabled="!future.length" @click="redo">Redo</DomButton><DomButton size="sm" variant="ghost" :aria-pressed="showCode" @click="showCode = !showCode">HTML</DomButton><DomButton size="sm" @click="download">Export HTML</DomButton></div>
		</header>
		<nav class="flex shrink-0 border-b border-border p-1 md:hidden" aria-label="Editor panels"><button v-for="panel in ['layers', 'poster', 'inspect']" :key="panel" type="button" class="flex-1 rounded px-3 py-2 text-sm capitalize" :class="mobilePanel === panel ? 'bg-secondary font-semibold' : 'text-muted-fg'" :aria-pressed="mobilePanel === panel" @click="mobilePanel = panel">{{ panel }}</button></nav>
		<DomSplitterPanel v-model:start-size="leftPanelWidth" v-model:end-size="rightPanelWidth" :min-start="180" :min-main="280" :min-end="240" class="poster-panels min-h-0 flex-1" :data-panel="mobilePanel">
			<template #start>
			<aside class="h-full min-h-0 overflow-auto border-r border-border" :class="mobilePanel === 'layers' ? 'block' : 'hidden md:block'" aria-label="Poster layers">
				<div class="border-b border-border p-4"><p class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-fg">Document</p><DomTextInput v-model="poster.title" label="Title" /><div class="mt-3"><DomNativeSelect :model-value="`${poster.width}x${poster.height}`" :options="presets" label="Format" @update:model-value="setPreset" /></div></div>
				<div class="p-4"><h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">Add a layer</h2><div class="grid grid-cols-3 gap-1"><DomButton size="sm" variant="secondary" @click="addLayer('text')">Text</DomButton><DomButton size="sm" variant="secondary" @click="addLayer('image')">Image</DomButton><DomButton size="sm" variant="secondary" @click="addLayer('shape')">Shape</DomButton></div></div>
				<div class="px-2"><div class="flex items-center justify-between px-2 pb-2"><h2 class="text-xs font-semibold">Layers</h2><span class="text-[10px] text-muted-fg">Front to back</span></div><DomDesignerLayers v-model="selected" :items="layers" label="Poster layers" /></div>
				<div class="m-4 space-y-3 border-t border-border pt-4"><button type="button" class="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm" :class="selected === 'frame' && 'bg-secondary'" @click="selected = 'frame'"><span>Poster background</span><span class="size-4 rounded border border-border" :style="{ background: poster.background }"></span></button><p class="text-xs leading-5 text-muted-fg">Real HTML at {{ poster.width }} × {{ poster.height }}. Select a layer here or on the poster.</p><p class="text-xs leading-5 text-muted-fg">Edits stay in this tab. Export HTML before leaving.</p></div>
			</aside>
			</template>
			<template #default>
			<section class="flex h-full min-h-0 min-w-0 flex-col" :class="mobilePanel === 'poster' ? 'flex' : 'hidden md:flex'" aria-label="Poster workspace">
				<div class="flex h-10 shrink-0 items-center justify-between border-b border-border px-4 text-[11px] text-muted-fg"><span class="truncate">{{ poster.title }}</span><span class="shrink-0">{{ poster.width }} × {{ poster.height }}</span></div>
				<div ref="workspace" class="poster-workspace min-h-0 flex-1 overflow-auto p-9">
					<div ref="artwork" class="relative mx-auto shadow-xl" :style="{ width: `${poster.width * scale}px`, height: `${poster.height * scale}px` }">
						<DomDesignerStage v-model="selected" :snapping="snapping" :spacing-snapping="spacingSnapping" :positioning="Boolean(active && !active.locked && !active.hidden)" class="absolute left-0 top-0 origin-top-left [--primary:var(--chart-1)]" :style="{ width: `${poster.width}px`, height: `${poster.height}px`, transform: `scale(${scale})` }" @style-change="patch">
							<article aria-label="Poster artwork" :style="{ position: 'relative', width: `${poster.width}px`, height: `${poster.height}px`, overflow: 'hidden', background: poster.background }">
								<template v-for="(layer, index) in poster.layers" :key="layer.id">
									<img v-if="layer.type === 'image'" :src="safePosterImage(layer.value)" :alt="layer.name" :data-designer-id="layer.hidden ? undefined : layer.id" :style="posterLayerStyle(layer, index)" draggable="false" @error="imageErrors[layer.id] = true" @load="delete imageErrors[layer.id]" />
									<component :is="layer.type === 'text' ? 'p' : 'div'" v-else :data-designer-id="layer.hidden ? undefined : layer.id" :style="posterLayerStyle(layer, index)">{{ layer.type === 'text' ? layer.value : '' }}</component>
								</template>
							</article>
						</DomDesignerStage>
					</div>
				</div>
				<div class="flex shrink-0 items-center justify-between gap-3 flex-wrap border-t border-border bg-canvas px-4 py-2"><span class="truncate text-xs text-muted-fg">{{ active?.name || 'Poster' }}{{ active?.locked ? ' · locked' : '' }}</span><label class="flex shrink-0 items-center gap-1 text-xs" title="Snap to stage and visible layers. Hold Control while moving or resizing to bypass."><input v-model="snapping" type="checkbox" class="accent-primary" />Snap</label><label class="flex shrink-0 items-center gap-1 text-xs" title="Repeat horizontal and vertical gaps while dragging. Independent of alignment snapping; hold Control to bypass."><input v-model="spacingSnapping" type="checkbox" class="accent-primary" />Spacing</label><label class="flex items-center gap-2 text-xs"><span>Zoom</span><select v-model="zoomChoice" aria-label="Stage zoom" class="rounded border border-border bg-canvas px-2 py-1"><option value="fit">Fit · {{ Math.round(fitScale * 100) }}%</option><option v-if="zoomChoice !== 'fit' && !['0.25', '0.5', '0.75', '1'].includes(zoomChoice)" :value="zoomChoice">{{ Math.round(scale * 100) }}%</option><option value="0.25">25%</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option></select></label></div>
				<div v-if="showCode" class="max-h-52 shrink-0 overflow-auto border-t border-border bg-canvas p-3"><div class="mb-2 flex items-center justify-between"><h2 class="text-xs font-semibold">Linked HTML</h2><DomButton size="sm" variant="ghost" @click="copy">Copy HTML</DomButton></div><button v-for="(line, index) in source" :key="index" class="block max-w-full truncate text-left font-mono text-[11px] leading-6" :class="selected === line.id && 'bg-primary/10 text-primary'" :title="line.text" @click="selected = line.id">{{ line.text }}</button></div>
			</section>
			</template>
			<template #end>
			<aside class="h-full min-h-0 overflow-auto border-l border-border" :class="mobilePanel === 'inspect' ? 'block' : 'hidden md:block'" aria-label="Poster properties">
				<div class="flex items-center justify-between border-b border-border px-4 py-3"><h2 class="text-sm font-semibold">{{ active?.name || 'Poster background' }}</h2><span class="text-[10px] uppercase tracking-wider text-muted-fg">{{ active?.type || 'Frame' }}</span></div>
				<template v-if="active">
					<div class="flex flex-wrap gap-1 border-b border-border p-3"><DomButton size="sm" variant="ghost" @click="act(() => active.locked = !active.locked)">{{ active.locked ? 'Unlock' : 'Lock' }}</DomButton><DomButton size="sm" variant="ghost" :disabled="active.locked" @click="act(() => active.hidden = !active.hidden)">{{ active.hidden ? 'Show' : 'Hide' }}</DomButton><DomButton size="sm" variant="ghost" @click="duplicate">Duplicate</DomButton><DomButton size="sm" variant="ghost" :disabled="active.locked" @click="remove">Delete</DomButton></div>
					<p v-if="active.locked" class="bg-secondary px-4 py-3 text-xs leading-5 text-muted-fg">This layer is locked. Unlock it to change its properties or position.</p>
					<fieldset :disabled="active.locked" class="min-w-0 space-y-5 p-4 disabled:opacity-50">
						<DomTextInput v-model="active.name" label="Layer name" />
						<div><h3 class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-fg">Position &amp; size</h3><div class="grid grid-cols-2 gap-3"><DomNumberInput v-for="field in geometryFields" :key="field.key" :label="field.label" :model-value="active[field.key]" :min="field.min" @update:model-value="number(field.key, $event, field.min)" /></div><div class="mt-3 flex gap-2"><DomButton size="sm" variant="secondary" :disabled="activeIndex === 0 || active.locked" @click="reorder(-1)">Send back</DomButton><DomButton size="sm" variant="secondary" :disabled="activeIndex === poster.layers.length - 1 || active.locked" @click="reorder(1)">Bring forward</DomButton></div></div>
						<template v-if="active.type === 'text'">
							<DomTextareaInput v-model="active.value" label="Text" :rows="3" />
							<DomNativeSelect v-model="active.fontFamily" label="Font" :options="fontOptions" />
							<div class="grid grid-cols-2 gap-3"><DomNumberInput label="Font size" :model-value="active.fontSize" :min="8" @update:model-value="number('fontSize', $event, 8, 500)" /><DomNativeSelect v-model="active.fontWeight" label="Weight" :options="[{ label: 'Regular', value: '400' }, { label: 'Bold', value: '700' }, { label: 'Black', value: '900' }]" /><DomNumberInput label="Line height" :model-value="active.lineHeight" :step="0.05" :min="0.5" @update:model-value="number('lineHeight', $event, 0.5, 3)" /><DomNumberInput label="Letter spacing" :model-value="active.letterSpacing" :step="0.5" @update:model-value="number('letterSpacing', $event, -20, 100)" /></div>
							<DomColorSwatch v-model="active.color" label="Text colour" />
							<div class="grid grid-cols-2 gap-3"><DomNativeSelect v-model="active.textAlign" label="Align" :options="['left', 'center', 'right']" /><DomNativeSelect v-model="active.textTransform" label="Case" :options="['none', 'uppercase', 'lowercase', 'capitalize']" /></div>
						</template>
						<template v-if="active.type === 'image'">
							<DomTextInput v-model="imageUrlDraft" label="Image URL" placeholder="https://…" />
							<DomButton size="sm" variant="secondary" :disabled="active.locked || !imageUrlDraft" @click="setImage(imageUrlDraft)">Apply image URL</DomButton>
							<DomButton size="sm" variant="secondary" :disabled="active.locked" @click="upload.click()">Replace with local image</DomButton>
							<p v-if="imageErrors[active.id]" role="status" class="text-xs text-destructive">The photo could not load. Try another URL or a local image.</p>
							<DomNativeSelect v-model="active.objectFit" label="Image fit" :options="['cover', 'contain', 'fill']" />
							<DomRangeInput v-model="active.objectY" label="Vertical crop" :min="0" :max="100" suffix="%" />
							<DomRangeInput v-model="active.brightness" label="Brightness" :min="0" :max="200" suffix="%" />
							<DomRangeInput v-model="active.saturation" label="Saturation" :min="0" :max="200" suffix="%" />
							<DomRangeInput v-model="active.blur" label="Blur" :min="0" :max="40" suffix="px" />
							<DomRangeInput v-model="active.sepia" label="Sepia" :min="0" :max="100" suffix="%" />
						</template>
						<DomColorSwatch v-if="active.type !== 'image'" v-model="active.fill" label="Fill" />
						<div class="grid grid-cols-2 gap-3"><DomNumberInput :model-value="active.opacity" label="Opacity %" :min="0" :max="100" @update:model-value="number('opacity', $event, 0, 100)" /><DomNumberInput :model-value="active.radius" label="Radius" :min="0" @update:model-value="number('radius', $event, 0, 1000)" /></div>
						<DomBackgroundEditor v-if="active.type !== 'image'" v-model="active.background" />
						<DomBackdropEditor v-if="active.type !== 'image'" v-model="active.backdrop" />
						<DomBorderEditor v-model="active.border" />
						<DomShadowEditor v-model="active.shadows" />
					</fieldset>
				</template>
				<div v-else class="space-y-4 p-4"><DomColorSwatch v-model="poster.background" label="Background colour" /><p class="text-xs leading-5 text-muted-fg">Cmd/Ctrl + mouse wheel zooms the stage. Choose a layer to edit its content. Drag its outline to move it, or drag a corner or edge handle to resize. Arrow keys move by 1px; Shift moves by 10px; Alt resizes.</p></div>
			</aside>
			</template>
		</DomSplitterPanel>
		<footer class="flex min-h-8 shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-fg"><span role="status">{{ notice || 'HTML elements · no canvas · export to keep your work' }}</span><a class="shrink-0 underline underline-offset-2" href="https://unsplash.com/photos/H3yr77Q_mwg" target="_blank" rel="noopener noreferrer">Photo: Zhi Xuan Hew / Unsplash</a></footer>
		<input ref="upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" aria-label="Upload poster image" @change="uploadImage" />
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
