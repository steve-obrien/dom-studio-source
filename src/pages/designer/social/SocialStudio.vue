<script setup>
import { computed, ref, shallowRef, watch } from 'vue';
import { DomButton, DomDialog, DomNativeSelect } from '../../lib/vue';
import DomDesigner from '../core/DesignerWorkspace.vue';
import { cloneValue } from '../core/editorDocument.js';
import { WORKSPACE_VERSION, exportFile, importFile, workspaceId } from '../canvas/canvasWorkspace.js';
import PosterThumbnail from '../poster/PosterThumbnail.vue';
import { pinXOptions, pinYOptions, resizePoster, socialFormats } from '../poster/posterResize.js';
import InspectorSelect from '../_shared/InspectorSelect.vue';
import { loadTemplates, templateIndustries, templateKinds } from '../poster/socialTemplates.js';
import PostThumbnail from './PostThumbnail.vue';
import { exportPostHtml, formatOperations, postFontLinks, postMarkup, postSize, posterToFile, resizedDocument } from './socialDocument.js';

/**
 * Social post studio: DomDesigner with a post as its file.
 *
 * Everything on the canvas and in the code is the designer's own (two-way
 * code, selection sync, text edited in place, bold and other marks). This
 * adds the post's formats (each layer follows its pins), the template
 * gallery, saved templates and HTML export.
 */
const props = defineProps({
	/** Creates the starting poster (see posterModel.js). */
	create: { type: Function, required: true },
	templates: { type: Array, default: () => [] },
	/** Storage adapter for templates saved from the studio. */
	templateStorage: { type: Object, default: null },
	credit: { type: Object, default: null },
	title: { type: String, default: 'Social post studio' },
	fileName: { type: String, default: 'dom-studio-social-post.html' },
	/** Workspace storage, passed to DomDesigner; this browser by default. */
	storage: { type: Object, default: null },
	storageKey: { type: String, default: 'dom-studio-social-v1' },
	codeEditor: { type: [Object, Function], default: null },
	codeEditorProps: { type: Object, default: () => ({}) },
	codeOpen: { type: Boolean, default: false },
	embedded: { type: Boolean, default: false },
});

const designer = ref(null);
const showFormats = ref(true);
const showTemplates = ref(false);
const templateIndustry = ref('all');
const templateKind = ref('all');
const savedTemplates = ref([]);

function createWorkspace() {
	const file = posterToFile(props.create());
	const { width, height } = postSize(file.doc);
	return { version: WORKSPACE_VERSION, files: [file], artboards: [{ id: workspaceId('board'), fileId: file.id, name: 'Post', x: 0, y: 0, width, height }] };
}

const file = computed(() => designer.value?.activeFile || null);
const size = computed(() => (file.value ? postSize(file.value.doc) : { width: 1080, height: 1350 }));
const formatOptions = computed(() => {
	const current = `${size.value.width}x${size.value.height}`;
	const presets = socialFormats.map((format) => ({ label: `${format.label} · ${format.width} × ${format.height}`, value: `${format.width}x${format.height}` }));
	return presets.some((preset) => preset.value === current) ? presets : [{ label: `Custom · ${size.value.width} × ${size.value.height}`, value: current }, ...presets];
});

/* Formats ------------------------------------------------------------------------ */

/**
 * Formats derive from the design as last edited, never from the previous
 * format, so switching back and forth never drifts (see posterResize.js).
 */
let formatBase = null;
function baseDoc() {
	const current = file.value?.doc;
	return formatBase && formatBase.fileId === file.value?.id && formatBase.produced === JSON.stringify(current) ? formatBase.doc : cloneValue(current);
}
function setFormat(value) {
	const target = file.value;
	if (!target) return;
	const [width, height] = value.split('x').map(Number);
	if (width === size.value.width && height === size.value.height) return;
	const base = baseDoc();
	const boards = designer.value.workspace.artboards.filter((board) => board.fileId === target.id);
	designer.value.run([...formatOperations(base, target.id, { width, height }), ...boards.flatMap((board) => [{ op: 'setArtboard', id: board.id, key: 'width', value: width }, { op: 'setArtboard', id: board.id, key: 'height', value: height }])]);
	formatBase = { fileId: target.id, doc: base, produced: JSON.stringify(target.doc) };
	designer.value.fit();
}

/** Every format, resized from the design with each layer's pins; redrawn at most once a frame, so previews follow a drag. */
const previews = shallowRef([]);
let previewFrame = 0;
watch(() => [showFormats.value, file.value?.doc], () => {
	if (previewFrame || typeof requestAnimationFrame !== 'function') return;
	previewFrame = requestAnimationFrame(() => {
		previewFrame = 0;
		const target = file.value;
		if (!target || !showFormats.value) return;
		const base = { ...target, doc: baseDoc() };
		const fonts = postFontLinks(base.doc);
		previews.value = socialFormats.map((format) => {
			const markup = postMarkup({ ...base, doc: resizedDocument(base, format) });
			return { ...format, value: `${format.width}x${format.height}`, current: format.width === size.value.width && format.height === size.value.height, markup, fonts };
		});
	});
}, { immediate: true, deep: true });

/* Export ------------------------------------------------------------------------- */

function downloadText(text, name, type) {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const link = document.createElement('a');
	link.href = url; link.download = name; link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function download(format = null) {
	if (!file.value) return;
	const target = format ? { ...file.value, doc: resizedDocument({ ...file.value, doc: baseDoc() }, format) } : file.value;
	downloadText(exportPostHtml(target), format ? props.fileName.replace(/\.html$/, `-${format.width}x${format.height}.html`) : props.fileName, 'text/html');
	designer.value.notify('HTML exported. Linked photos still need an internet connection.');
}

/* Templates ---------------------------------------------------------------------- */

/** Saved templates: designs saved from the studio as HTML, and older ones saved as poster JSON. */
async function listSaved() {
	const adapter = props.templateStorage;
	if (!adapter) return [];
	const items = await adapter.list();
	const values = await Promise.all(items.map((item) => adapter.load(item.id)));
	return values.flatMap((value, index) => {
		if (!value) return [];
		const id = items[index].id;
		if (typeof value.source === 'string') return [{ id, title: String(value.title || id), industry: value.industry || 'other', kind: value.kind || 'announcement', source: value.source, saved: true }];
		return loadTemplates([{ ...value, id }]).map((template) => ({ ...template, saved: true }));
	});
}
watch(showTemplates, async (open) => {
	if (!open) return;
	try { savedTemplates.value = await listSaved(); }
	catch (error) { designer.value.notify(`Saved templates could not load: ${error.message}`); }
});

const galleryTemplates = computed(() => [...savedTemplates.value, ...props.templates]);
const industryOptions = computed(() => [{ label: `All industries (${galleryTemplates.value.length})`, value: 'all' }, ...templateIndustries.filter((item) => galleryTemplates.value.some((template) => template.industry === item.value)).map((item) => ({ label: `${item.label} (${galleryTemplates.value.filter((template) => template.industry === item.value).length})`, value: item.value }))]);
const kindOptions = computed(() => [{ label: 'All post types', value: 'all' }, ...templateKinds.filter((item) => galleryTemplates.value.some((template) => template.kind === item.value && (templateIndustry.value === 'all' || template.industry === templateIndustry.value))).map((item) => ({ label: item.label, value: item.value }))]);
watch(templateIndustry, () => { if (!kindOptions.value.some((item) => item.value === templateKind.value)) templateKind.value = 'all'; });

/** A template as a document at the current format. */
function templateDoc(template) {
	if (template.poster) return posterToFile(resizePoster(template.poster, size.value)).doc;
	const { file: imported } = importFile(template.source, 'Template.vue');
	const from = postSize(imported.doc);
	return from.width === size.value.width && from.height === size.value.height ? imported.doc : resizedDocument(imported, size.value);
}
const visibleTemplates = computed(() => (showTemplates.value ? galleryTemplates.value : [])
	.filter((template) => (templateIndustry.value === 'all' || template.industry === templateIndustry.value) && (templateKind.value === 'all' || template.kind === templateKind.value))
	.map((template) => {
		const label = [template.saved && 'Yours', templateIndustries.find((item) => item.value === template.industry)?.label].filter(Boolean).join(' · ');
		if (template.poster) return { ...template, label, preview: resizePoster(template.poster, size.value) };
		const doc = templateDoc(template);
		return { ...template, label, markup: postMarkup({ doc }), fonts: postFontLinks(doc) };
	}));

/** Replaces the design with a template at the current format; undo brings it back. */
function applyTemplate(template) {
	const target = file.value;
	if (!target) return;
	const doc = templateDoc(template);
	designer.value.run([{ op: 'setFile', id: target.id, key: 'doc', value: doc }]);
	formatBase = null;
	const first = doc.nodes[doc.rootId].children.find((id) => doc.nodes[id]?.type === 'html:p');
	if (first) designer.value.select(first);
	showTemplates.value = false;
	designer.value.notify(`${template.title} applied. Undo to go back to your design.`);
}

/** Saves the design as a new template; existing templates are never overwritten. */
async function saveAsTemplate() {
	const adapter = props.templateStorage;
	const target = file.value;
	if (!adapter || !target) return;
	try {
		const title = target.doc.nodes[target.doc.rootId]?.props?.['aria-label'] || 'Post';
		const stem = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'post';
		const taken = new Set([...props.templates.map((template) => template.id), ...(await adapter.list()).map((item) => item.id)]);
		let id = stem;
		for (let copy = 2; taken.has(id); copy += 1) id = `${stem}-${copy}`;
		await adapter.save(id, { id, title, industry: templateIndustry.value === 'all' ? 'other' : templateIndustry.value, kind: templateKind.value === 'all' ? 'announcement' : templateKind.value, ...size.value, source: exportFile(target) });
		savedTemplates.value = await listSaved();
		designer.value.notify(`Saved as a new template (${id}).`);
	} catch (error) {
		designer.value.notify(`The template could not be saved: ${error.message}`);
	}
}
</script>

<template>
	<div class="flex min-h-0 flex-col bg-canvas text-canvas-fg" :class="embedded ? 'h-full' : 'h-dvh'">
		<DomDesigner
			ref="designer"
			class="min-h-0 flex-1"
			:title="title"
			badge="Beta"
			:create-workspace="createWorkspace"
			:storage="storage"
			:storage-key="storageKey"
			:code-editor="codeEditor"
			:code-editor-props="codeEditorProps"
			:code-open="codeOpen"
			code-layout="below"
			:embedded="embedded"
			:rulers="!embedded"
		>
			<template #start><slot name="start" /></template>
			<template #inspector="{ node, parent, setProp }">
				<section v-if="parent && !parent.parent" class="space-y-2 border-b border-border px-4 py-3">
					<h3 class="text-[11px] font-semibold">Resize pins</h3>
					<div class="grid grid-cols-2 gap-1.5">
						<InspectorSelect label="Horizontal pin" :options="pinXOptions" :model-value="node.props['data-pin-x'] || 'auto'" @update:model-value="setProp('data-pin-x', $event === 'auto' ? undefined : $event)" />
						<InspectorSelect label="Vertical pin" :options="pinYOptions" :model-value="node.props['data-pin-y'] || 'auto'" @update:model-value="setProp('data-pin-y', $event === 'auto' ? undefined : $event)" />
					</div>
					<p class="text-[11px] leading-4 text-muted-fg">How this layer moves when the post changes format. Auto reads it from where the layer sits.</p>
				</section>
			</template>
			<template #end>
				<select class="h-7 max-w-52 rounded-md border-0 bg-secondary/60 pl-2 pr-6 text-xs text-canvas-fg outline-none hover:ring-1 hover:ring-border focus:ring-1 focus:ring-primary" aria-label="Post format" :value="`${size.width}x${size.height}`" @change="setFormat($event.target.value)">
					<option v-for="option in formatOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
				</select>
				<DomButton size="sm" variant="ghost" :aria-pressed="showFormats" @click="showFormats = !showFormats; designer.fit()">Formats</DomButton>
				<DomButton v-if="templates.length || templateStorage" size="sm" variant="ghost" @click="showTemplates = true">Templates</DomButton>
				<DomButton size="sm" variant="secondary" @click="download()">Export HTML</DomButton>
			</template>
		</DomDesigner>
		<div v-if="showFormats" class="min-h-[164px] shrink-0 border-t border-border bg-canvas p-3">
			<div class="mb-2 flex items-center justify-between gap-3"><h2 class="text-xs font-semibold">Every format <span class="font-normal text-muted-fg">· live previews that follow each layer's pins (data-pin-x, data-pin-y)</span></h2><a v-if="credit" class="shrink-0 text-[10px] text-muted-fg underline underline-offset-2" :href="credit.href" target="_blank" rel="noopener noreferrer">{{ credit.label }}</a></div>
			<div class="flex gap-4 overflow-x-auto pb-1">
				<div v-for="preview in previews" :key="preview.value" class="flex shrink-0 flex-col items-start gap-1.5">
					<button type="button" class="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="preview.current ? 'ring-2 ring-primary' : 'hover:bg-secondary'" :aria-label="`Edit as ${preview.label}`" :aria-pressed="preview.current" @click="setFormat(preview.value)"><PostThumbnail :markup="preview.markup" :width="preview.width" :height="preview.height" :fonts="preview.fonts" :size="96" /></button>
					<div class="flex w-full items-center justify-between gap-2 px-1"><span class="truncate text-[11px]" :class="preview.current ? 'font-semibold' : 'text-muted-fg'">{{ preview.label }}</span><button type="button" class="shrink-0 text-[11px] text-primary underline underline-offset-2" :aria-label="`Export ${preview.label} as HTML`" @click="download(preview)">HTML</button></div>
				</div>
			</div>
		</div>
		<DomDialog v-model="showTemplates" title="Templates" :description="`Every template opens at ${size.width} × ${size.height} and stays editable. Your current design is replaced; undo brings it back. Saving always adds a new template.`" width="min(1100px, 95vw)">
			<div class="flex flex-wrap items-end gap-3 pb-4"><div class="w-60 max-w-full"><DomNativeSelect v-model="templateIndustry" :options="industryOptions" label="Industry" /></div><div class="w-48 max-w-full"><DomNativeSelect v-model="templateKind" :options="kindOptions" label="Post type" /></div><div class="ml-auto flex flex-wrap gap-2"><DomButton v-if="templateStorage" size="sm" variant="secondary" title="Save this design as a new template, tagged with the selected industry and post type. Existing templates are never overwritten." @click="saveAsTemplate">Save as new template</DomButton></div></div>
			<ul class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4" aria-label="Templates">
				<li v-for="template in visibleTemplates" :key="template.id"><button type="button" class="flex w-full flex-col items-center gap-2 rounded-lg p-2 text-left hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" @click="applyTemplate(template)"><PosterThumbnail v-if="template.preview" :poster="template.preview" :height="Math.min(220, Math.round(170 * size.height / size.width))" /><PostThumbnail v-else :markup="template.markup" :fonts="template.fonts" :width="size.width" :height="size.height" :size="Math.min(220, Math.round(170 * size.height / size.width))" /><span class="w-full"><span class="block truncate text-sm font-medium">{{ template.title }}</span><span class="block truncate text-xs text-muted-fg">{{ template.label }}</span></span></button></li>
			</ul>
		</DomDialog>
	</div>
</template>
