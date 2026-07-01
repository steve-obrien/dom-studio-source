<script setup>
import { computed } from 'vue';
import DomButton from '../../../components/button/DomButton.vue';

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	file: {
		type: Object,
		default: null,
	},
	mode: {
		type: String,
		default: 'dialog',
	},
});
const emit = defineEmits(['close']);

const imageUrl = computed(getImageUrl);
const imageAlt = computed(getImageAlt);
const dimensions = computed(getDimensions);

/**
 * Resolves the best image URL from the file or media row.
 *
 * @returns {string} Image URL.
 */
function getImageUrl() {
	return props.file?.publicUrl || props.file?.thumbnailUrl || props.item?.publicUrl || props.item?.thumbnailUrl || '';
}

/**
 * Resolves image alt text for the preview.
 *
 * @returns {string} Image alt text.
 */
function getImageAlt() {
	return String(props.file?.meta?.alt || props.item?.name || props.file?.name || 'Media preview');
}

/**
 * Formats known image dimensions.
 *
 * @returns {string} Dimension label.
 */
function getDimensions() {
	const width = Number(props.file?.meta?.width);
	const height = Number(props.file?.meta?.height);
	if (!Number.isFinite(width) || !Number.isFinite(height)) return '';
	return `${width} x ${height}`;
}

/**
 * Requests the parent detail surface to close.
 */
function closeDetail() {
	emit('close');
}
</script>

<template>
	<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
		<div class="min-h-[20rem] overflow-hidden rounded-lg bg-secondary/45">
			<img
				v-if="imageUrl"
				:src="imageUrl"
				:alt="imageAlt"
				class="h-full max-h-[70vh] min-h-[20rem] w-full object-contain"
			/>
		</div>
		<aside class="space-y-4 text-sm">
			<div>
				<p class="text-xs font-semibold uppercase text-muted-fg">Image detail</p>
				<h3 class="mt-1 break-words text-lg font-semibold text-canvas-fg">{{ item.name || file?.name }}</h3>
			</div>
			<dl class="space-y-3">
				<div v-if="file?.mimeType">
					<dt class="text-xs font-medium uppercase text-muted-fg">Type</dt>
					<dd class="mt-1 text-canvas-fg">{{ file.mimeType }}</dd>
				</div>
				<div v-if="dimensions">
					<dt class="text-xs font-medium uppercase text-muted-fg">Dimensions</dt>
					<dd class="mt-1 text-canvas-fg">{{ dimensions }}</dd>
				</div>
				<div v-if="file?.publicUrl">
					<dt class="text-xs font-medium uppercase text-muted-fg">Public URL</dt>
					<dd class="mt-1 break-all text-primary">{{ file.publicUrl }}</dd>
				</div>
				<div v-if="file?.meta?.alt">
					<dt class="text-xs font-medium uppercase text-muted-fg">Alt text</dt>
					<dd class="mt-1 text-canvas-fg">{{ file.meta.alt }}</dd>
				</div>
			</dl>
			<DomButton v-if="mode === 'dialog'" size="sm" variant="secondary" @click="closeDetail">
				Close preview
			</DomButton>
		</aside>
	</div>
</template>
