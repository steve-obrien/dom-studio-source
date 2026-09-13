<script setup>
import { computed, onMounted, reactive, ref, useSlots } from 'vue';
import CodePanel from './CodePanel.vue';
import InspectorField from '../inspector/InspectorField.vue';
import { inferSchema } from '../inspector/useInspector.js';
import MobilePreview from './MobilePreview.vue';
import DomAppShell from '../../mobile/shell/DomAppShell.vue';

// Two modes, one component:
//
// 1. Auto (the simple case) — give it only an `:inspect` component:
//
//    <Playground :inspect="DomDrawer" />
//
//    The wrapper seeds a reactive `data` object from defineProps defaults,
//    binds it to the live component, and synthesises source from the
//    canonical `__doc.tag` + the current data. Slots passed to <Playground>
//    are forwarded to the rendered component.
//
// 2. SFC (for cases that need trigger slots, event wiring, etc.) — supply
//    a `:component` SFC that exposes its own `data` via defineExpose:
//
//    <Playground :inspect="DomDrawer" :component="PlaygroundDrawer"
//                :source="PlaygroundDrawerSrc" />
//
//    The SFC is rendered as-is; its source string is shown verbatim. The
//    wrapper still drives the inspector against the same `data` object.
const props = defineProps({
	inspect: { required: true },
	component: { type: null, default: null },
	source: { type: String, default: '' },
	title: { type: String, default: 'Playground' },
	description: { type: String, default: '' },
	filename: { type: String, default: 'Playground.vue' },
	/** Merged over defineProps defaults — for required props (tabs, items, options, …). */
	initial: { type: Object, default: () => ({}) },
	presentation: {
		type: String,
		default: 'default',
		validator: (value) => ['default', 'mobile'].includes(value),
	},
});

const slots = useSlots();
const useSfc = computed(() => !!props.component);

// ---------------------------------------------------------------------------
// Auto-mode data — seeded from the inspected component's defineProps defaults.
/** Clones editable arrays and records without changing function-valued props. */
function clonePreviewValue(value) {
	if (Array.isArray(value)) return value.map(clonePreviewValue);
	if (value && Object.getPrototypeOf(value) === Object.prototype) {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clonePreviewValue(item)]));
	}
	return value;
}

/** Creates per-instance editor state so form normalization cannot mutate shared docs metadata. */
function seed() {
	const out = {};
	const defs = props.inspect.props || {};
	for (const [key, def] of Object.entries(defs)) {
		if (key === 'class' || key === 'modelModifiers' || key.startsWith('_')) continue;
		const d = def && typeof def === 'object' ? def.default : undefined;
		out[key] = typeof d === 'function' ? d() : d;
	}
	return clonePreviewValue(Object.assign(out, props.initial));
}
const autoData = reactive(seed());

// ---------------------------------------------------------------------------
// SFC-mode data — picked up from `defineExpose({ data })` after mount.
const playgroundRef = ref(null);
const sfcData = ref(null);
onMounted(() => {
	if (useSfc.value) sfcData.value = playgroundRef.value?.data || null;
});

// Whichever mode we're in, `data` is the live reactive props object.
const data = computed(() => (useSfc.value ? sfcData.value : autoData));

const schema = computed(() => {
	if (!data.value) return [];
	return inferSchema({ component: props.inspect, props: data.value, children: [] })
		.filter((f) => f.key !== 'class');
});
const groupOrder = ['Control props', 'Field props'];
const schemaGroups = computed(() => {
	const groups = new Map();
	for (const field of schema.value) {
		const name = field.group || 'Control props';
		if (!groups.has(name)) groups.set(name, []);
		groups.get(name).push(field);
	}
	return [...groups.entries()]
		.map(([name, fields]) => ({ name, fields }))
		.sort((a, b) => {
			const ai = groupOrder.indexOf(a.name);
			const bi = groupOrder.indexOf(b.name);
			if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
			if (ai === -1) return 1;
			if (bi === -1) return -1;
			return ai - bi;
		});
});

/** Synchronizes the component's model with its live prop editor. */
function onUpdateModelValue(v) {
	if (data.value && 'modelValue' in data.value) data.value.modelValue = v;
}

// ---------------------------------------------------------------------------
// Source generation (auto mode only — SFC mode shows the raw ?raw string).
//
// Safe because the tag name comes from `inspect.__doc.tag` (canonical, set by
// the component author) and the data inside `reactive(...)` is JSON.stringify
// of the live state. There is no guesswork.
const componentTag = computed(() => {
	const tag = props.inspect.__doc?.tag;
	if (tag) return tag.replace(/^</, '').replace(/>$/, '');
	return props.inspect.name || props.inspect.__name || 'Component';
});

const autoSource = computed(() => {
	if (!data.value) return '';
	const tag = componentTag.value;
	const hasModel = 'modelValue' in data.value;
	const literal = JSON.stringify(data.value, null, '\t')
		.split('\n')
		.map((l, i) => (i === 0 ? l : '\t' + l))
		.join('\n');
	const handler = hasModel ? '\n\t\t@update:modelValue="data.modelValue = $event"' : '';
	return `<script setup>
import { reactive } from 'vue';
import { ${tag} } from '@getdom/studio/vue';

const data = reactive(${literal});
</${'script'}>

<template>
\t<${tag}
\t\tv-bind="data"${handler}
\t/>
</template>`;
});

// ---------------------------------------------------------------------------
// Tabs

const tab = ref('source');
const tabs = [
	{ key: 'source', label: 'Source' },
	{ key: 'data', label: 'Data' },
];

const dataJson = computed(() => (data.value ? JSON.stringify(data.value, null, '\t') : ''));
const codeSource = computed(() => {
	if (tab.value === 'data') return dataJson.value;
	return useSfc.value ? props.source : autoSource.value;
});
const codeLang = computed(() => (tab.value === 'data' ? 'json' : 'vue'));
const codeFilename = computed(() => {
	if (tab.value === 'data') return 'data';
	return useSfc.value ? props.filename : 'Playground.vue';
});

const isMobilePresentation = computed(() => props.presentation === 'mobile');
const mobileSlot = computed(() => props.inspect?.__doc?.playground?.mobileSlot || 'content');
const previewClasses = computed(() => {
	if (isMobilePresentation.value) {
		return 'flex min-h-80 min-w-0 items-center justify-center overflow-hidden p-0 sm:p-6';
	}
	return 'flex max-h-[38rem] min-h-80 min-w-0 items-start justify-center overflow-auto p-10';
});
</script>

<template>
	<figure class="my-6 min-w-0 overflow-hidden rounded-2xl border border-border bg-canvas">
		<figcaption v-if="title || description" class="border-b border-border bg-secondary/40 px-5 py-3">
			<p v-if="title" class="text-sm font-semibold tracking-tight text-canvas-fg">{{ title }}</p>
			<p v-if="description" class="mt-0.5 text-sm text-muted-fg">{{ description }}</p>
		</figcaption>

		<div class="grid w-full min-w-0 grid-cols-1 items-stretch overflow-hidden bg-gradient-to-br from-secondary/40 via-canvas to-secondary/30 lg:grid-cols-[minmax(0,1fr)_18rem]">
			<div :class="previewClasses">
				<MobilePreview v-if="isMobilePresentation" :title="title">
					<!-- SFC mode: render the playground SFC; it owns the data + slots. -->
					<component v-if="useSfc" :is="component" ref="playgroundRef" />
					<component v-else-if="mobileSlot === 'safe-area'" :is="inspect" v-bind="autoData" class="h-full">
						<div class="flex h-full flex-col justify-between border border-dashed border-primary bg-primary/5 p-4 text-sm">
							<p class="font-semibold">Content inside the safe area</p>
							<p class="leading-6 text-muted-fg">On desktop the phone simulates a cutout and home indicator. On a real device, padding comes from its safe-area insets.</p>
							<p class="font-medium">Bottom content stays reachable</p>
						</div>
					</component>
					<component
						v-else-if="mobileSlot === 'stack'"
						:is="inspect"
						v-bind="autoData"
					/>
					<component
						v-else-if="mobileSlot === 'shell'"
						:is="inspect"
						v-bind="autoData"
						@update:modelValue="onUpdateModelValue"
					>
						<template #top>
							<div class="border-b border-border skin-card px-4 py-3">
								<p class="text-sm font-semibold text-canvas-fg">Preview</p>
								<p class="text-xs text-muted-fg">Mobile component</p>
							</div>
						</template>
						<div class="space-y-3 p-4">
							<div class="rounded-[1.5rem] bg-primary p-5 text-primary-fg">
								<p class="text-xs font-medium uppercase tracking-[0.16em] opacity-80">Sample</p>
								<p class="mt-2 text-xl font-semibold">Scrollable app content</p>
							</div>
							<div v-for="index in 6" :key="index" class="rounded-[1.5rem] border border-border skin-card p-4">
								<p class="text-sm font-medium text-canvas-fg">Content section {{ index }}</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">The shell keeps top and bottom chrome pinned while this area scrolls.</p>
							</div>
						</div>
						<template #bottom>
							<div class="border-t border-border skin-card px-4 py-3 text-center text-xs font-medium text-muted-fg">Bottom chrome</div>
						</template>
					</component>
					<DomAppShell v-else height="100%">
						<template v-if="mobileSlot === 'top'" #top>
							<component
								:is="inspect"
								v-bind="autoData"
								@update:modelValue="onUpdateModelValue"
							/>
						</template>
						<div class="space-y-3 p-4">
							<component
								v-if="mobileSlot === 'content'"
								:is="inspect"
								v-bind="autoData"
								@update:modelValue="onUpdateModelValue"
							>
								<template v-for="(_, name) in slots" :key="name" #[name]="slotProps">
									<slot :name="name" v-bind="slotProps || {}" />
								</template>
							</component>
							<div v-else class="rounded-[1.5rem] bg-primary p-5 text-primary-fg">
								<p class="text-xs font-medium uppercase tracking-[0.16em] opacity-80">Preview</p>
								<p class="mt-2 text-xl font-semibold">Mobile content area</p>
							</div>
						</div>
						<template v-if="mobileSlot === 'overlay'" #overlay>
							<component
								:is="inspect"
								v-bind="autoData"
								@update:modelValue="onUpdateModelValue"
							/>
						</template>
						<template v-if="mobileSlot === 'bottom'" #bottom>
							<component
								:is="inspect"
								v-bind="autoData"
								@update:modelValue="onUpdateModelValue"
							/>
						</template>
					</DomAppShell>
				</MobilePreview>

				<template v-else>
					<!-- SFC mode: render the playground SFC; it owns the data + slots. -->
					<component v-if="useSfc" :is="component" ref="playgroundRef" />
					<!-- Auto mode: render the inspected component, forwarding every parent slot. -->
					<component
						v-else
						:is="inspect"
						v-bind="autoData"
						@update:modelValue="onUpdateModelValue"
					>
						<template v-for="(_, name) in slots" :key="name" #[name]="slotProps">
							<slot :name="name" v-bind="slotProps || {}" />
						</template>
					</component>
				</template>
			</div>

			<aside class="min-h-0 border-t border-border bg-canvas/70 text-left backdrop-blur lg:border-l lg:border-t-0">
				<div class="sticky top-0 z-10 border-b border-border bg-canvas/90 px-4 py-3 backdrop-blur">
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-fg">Properties</p>
				</div>
				<div class="max-h-72 space-y-4 overflow-y-auto p-4 lg:max-h-[34rem]">
					<template v-if="data">
						<section
							v-for="group in schemaGroups"
							:key="group.name"
							class="space-y-3"
						>
							<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ group.name }}</p>
							<InspectorField
								v-for="f in group.fields"
								:key="f.key"
								:field="f"
								:model-value="data[f.key]"
								@update:model-value="(v) => data[f.key] = v"
							/>
						</section>
					</template>
				</div>
			</aside>
		</div>

		<div class="flex items-center gap-1 border-t border-border bg-secondary/40 px-3 py-1.5">
			<button
				v-for="t in tabs"
				:key="t.key"
				type="button"
				class="rounded-md px-2.5 py-1 text-xs font-medium transition"
				:class="tab === t.key
					? 'bg-canvas text-canvas-fg shadow-sm ring-1 ring-border'
					: 'text-muted-fg hover:bg-canvas hover:text-canvas-fg'"
				@click="tab = t.key"
			>{{ t.label }}</button>
		</div>

		<CodePanel
			:source="codeSource"
			:lang="codeLang"
			:filename="codeFilename"
			:default-open="false"
			:preview-lines="5"
		/>
	</figure>
</template>
