<script setup>
import { computed, useSlots } from 'vue';
import { useRoute } from 'vue-router';
import CodePanel from './CodePanel.vue';
import { getComponentUsage } from './componentUsage';
import IframePreview from './IframePreview.vue';

// Pair a live demo with its source code — guaranteed in sync because both come
// from the same SFC file:
//
//   import Demo from './examples/Basic.vue';
//   import Src  from './examples/Basic.vue?raw';
//
//   <Example :source="Src"><Demo /></Example>
//
// Editing the example file updates both panels at once. The user can copy a
// snippet that matches exactly what they see rendered.
const props = defineProps({
	source: { type: String, default: '' },
	lang: { type: String, default: 'vue' },
	title: { type: String, default: '' },
	description: { type: String, default: '' },
	filename: { type: String, default: '' },
	sourcePath: { type: String, default: '' },
	sourceHref: { type: String, default: '' },
	defaultOpen: { type: Boolean, default: false },
	codeFirst: { type: Boolean, default: false },
	previewLines: { type: Number, default: 5 },
	propertiesTitle: { type: String, default: 'Properties' },
	presentation: {
		type: String,
		default: 'default',
		validator: (value) => ['default', 'iframe', 'mobile'].includes(value),
	},
	deviceTitle: { type: String, default: '' },
	device: { type: String, default: 'DOM Studio Phone' },
	frameChrome: {
		type: String,
		default: '',
		validator: (value) => ['', 'none', 'mobile'].includes(value),
	},
	frameTitle: { type: String, default: '' },
	frameMinWidth: { type: Number, default: 320 },
	frameMaxWidth: { type: Number, default: 0 },
	frameDefaultWidth: { type: Number, default: 0 },
	frameHeight: { type: Number, default: 720 },
	frameSrc: { type: String, default: '' },
	frameFlushEdges: { type: Boolean, default: false },
	sourceVariants: { type: Object, default: null },
	installationMethod: {
		type: String,
		default: '',
		validator: (value) => ['', 'npm', 'source'].includes(value),
	},
	installNote: { type: String, default: '' },
});
const emit = defineEmits(['update:installationMethod']);

const route = useRoute();
const slots = useSlots();
const hasProperties = computed(() => Boolean(slots.properties));
const isIframePresentation = computed(() => props.presentation === 'iframe');
const isMobilePresentation = computed(() => props.presentation === 'mobile');
const isFramePresentation = computed(() => isIframePresentation.value || isMobilePresentation.value);
const componentUsage = computed(() => route.path.startsWith('/blocks') ? getComponentUsage(props.source) : []);
const resolvedSourcePath = computed(() => props.sourcePath || sourcePathFromRoute());
const resolvedFrameChrome = computed(() => props.frameChrome || (isMobilePresentation.value ? 'mobile' : 'none'));
const resolvedFrameDefaultWidth = computed(() => {
	if (!isMobilePresentation.value || props.frameDefaultWidth) return props.frameDefaultWidth;
	return 390;
});
const previewClasses = computed(() => {
	if (isFramePresentation.value) {
		return 'min-h-[200px] min-w-0 overflow-hidden';
	}
	return 'flex min-h-[200px] min-w-0 max-w-full items-center justify-center overflow-auto p-4 sm:p-10';
});

/**
 * Resolves an example file beside the current documentation route.
 *
 * @returns {string} Repository-relative source path, or an empty string.
 */
function sourcePathFromRoute() {
	if (!props.filename || props.filename.includes('/')) return '';

	const routePath = route.path
		.replace(/\/preview\/.*$/, '')
		.replace(/^\/+|\/+$/g, '');
	if (!routePath) return '';

	return `src/pages/${routePath}/examples/${props.filename}`;
}
</script>

<template>
	<figure class="my-6 min-w-0 overflow-hidden rounded-2xl border border-border bg-canvas">
		<figcaption v-if="title || description" class="border-b border-border bg-secondary/40 px-5 py-3">
			<p v-if="title" class="text-sm font-semibold tracking-tight text-canvas-fg">{{ title }}</p>
			<p v-if="description" class="mt-0.5 text-sm text-muted-fg">{{ description }}</p>
		</figcaption>

		<CodePanel
			v-if="codeFirst"
			:source="source"
			:lang="lang"
			:filename="filename"
			:source-path="resolvedSourcePath"
			:source-href="sourceHref"
			:default-open="defaultOpen"
			:preview-lines="previewLines"
			:source-variants="sourceVariants"
			:installation-method="installationMethod"
			:install-note="installNote"
			@update:installation-method="emit('update:installationMethod', $event)"
		/>

		<div
			:class="hasProperties
				? 'grid min-h-[200px] grid-cols-1 items-stretch bg-canvas md:grid-cols-[minmax(0,1fr)_18rem]'
				: 'block'"
		>
			<div :class="previewClasses">
				<IframePreview
					v-if="isFramePresentation"
					:title="frameTitle || deviceTitle || title || filename"
					:src="frameSrc"
					:min-width="frameMinWidth"
					:max-width="frameMaxWidth"
					:default-width="resolvedFrameDefaultWidth"
					:height="frameHeight"
					:flush-edges="frameFlushEdges"
					:chrome="resolvedFrameChrome"
					:device="device"
				>
					<slot />
				</IframePreview>
				<slot v-else />
			</div>

			<aside
				v-if="hasProperties"
				class="min-h-0 border-t border-border skin-card text-canvas-fg md:border-l md:border-t-0"
			>
				<div class="sticky top-0 z-10 border-b border-border skin-card px-4 py-3">
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ props.propertiesTitle }}</p>
				</div>
				<div class="max-h-72 space-y-4 overflow-y-auto p-4 md:max-h-[32rem]">
					<slot name="properties" />
				</div>
			</aside>
		</div>

		<div v-if="componentUsage.length" class="border-t border-border bg-secondary/20 px-5 py-3">
			<div class="flex flex-wrap items-center gap-2">
				<p class="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-fg">Built with</p>
				<RouterLink
					v-for="component in componentUsage"
					:key="component.id"
					:to="component.route"
					:aria-label="`${component.exportName} documentation in ${component.sectionLabel}`"
					class="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-canvas-fg transition hover:border-primary/50 hover:text-primary"
				>
					<span>{{ component.exportName }}</span>
					<span class="text-[10px] font-normal text-muted-fg">{{ component.sectionLabel }}</span>
				</RouterLink>
			</div>
		</div>

		<CodePanel
			v-if="!codeFirst"
			:source="source"
			:lang="lang"
			:filename="filename"
			:source-path="resolvedSourcePath"
			:source-href="sourceHref"
			:default-open="defaultOpen"
			:preview-lines="previewLines"
			:source-variants="sourceVariants"
			:installation-method="installationMethod"
			:install-note="installNote"
			@update:installation-method="emit('update:installationMethod', $event)"
		/>
	</figure>
</template>
