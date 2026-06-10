<script setup>
import { computed, useSlots } from 'vue';
import CodePanel from './CodePanel.vue';
import IframePreview from './IframePreview.vue';
import MobilePreview from './MobilePreview.vue';

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
	frameTitle: { type: String, default: '' },
	frameMinWidth: { type: Number, default: 320 },
	frameMaxWidth: { type: Number, default: 1440 },
	frameDefaultWidth: { type: Number, default: 0 },
	frameHeight: { type: Number, default: 720 },
	frameSrc: { type: String, default: '' },
});

const slots = useSlots();
const hasProperties = computed(() => Boolean(slots.properties));
const isIframePresentation = computed(() => props.presentation === 'iframe');
const isMobilePresentation = computed(() => props.presentation === 'mobile');
const previewClasses = computed(() => {
	if (isMobilePresentation.value) {
		return hasProperties.value
			? 'flex min-h-[200px] items-center justify-center overflow-hidden bg-secondary/30 p-4 sm:p-8'
			: 'flex min-h-[200px] items-center justify-center overflow-hidden bg-secondary/30 p-4 sm:p-8';
	}
	if (isIframePresentation.value) {
		return 'min-h-[200px] overflow-hidden';
	}
	return 'flex min-h-[200px] items-center justify-center overflow-auto p-10';
});
</script>

<template>
	<figure class="my-6 min-w-0 overflow-hidden rounded-2xl border border-border bg-background">
		<figcaption v-if="title || description" class="border-b border-border bg-secondary/40 px-5 py-3">
			<p v-if="title" class="text-sm font-semibold tracking-tight text-fg">{{ title }}</p>
			<p v-if="description" class="mt-0.5 text-sm text-muted-fg">{{ description }}</p>
		</figcaption>

		<CodePanel
			v-if="codeFirst"
			:source="source"
			:lang="lang"
			:filename="filename"
			:default-open="defaultOpen"
			:preview-lines="previewLines"
		/>

		<div
			:class="hasProperties
				? 'grid min-h-[200px] grid-cols-1 items-stretch bg-background md:grid-cols-[minmax(0,1fr)_18rem]'
				: 'block'"
		>
			<div :class="previewClasses">
				<MobilePreview
					v-if="isMobilePresentation"
					:title="deviceTitle || title"
					:device="device"
				>
					<slot />
				</MobilePreview>
				<IframePreview
					v-else-if="isIframePresentation"
					:title="frameTitle || title || filename"
					:src="frameSrc"
					:min-width="frameMinWidth"
					:max-width="frameMaxWidth"
					:default-width="frameDefaultWidth"
					:height="frameHeight"
				>
					<slot />
				</IframePreview>
				<slot v-else />
			</div>

			<aside
				v-if="hasProperties"
				class="min-h-0 border-t border-border skin-raised text-fg md:border-l md:border-t-0"
			>
				<div class="sticky top-0 z-10 border-b border-border skin-raised px-4 py-3">
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ props.propertiesTitle }}</p>
				</div>
				<div class="max-h-72 space-y-4 overflow-y-auto p-4 md:max-h-[32rem]">
					<slot name="properties" />
				</div>
			</aside>
		</div>

		<CodePanel
			v-if="!codeFirst"
			:source="source"
			:lang="lang"
			:filename="filename"
			:default-open="defaultOpen"
			:preview-lines="previewLines"
		/>
	</figure>
</template>
