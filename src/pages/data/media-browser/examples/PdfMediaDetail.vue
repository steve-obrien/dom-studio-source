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
		default: 'inline',
	},
});
const emit = defineEmits(['close']);

const pdfUrl = computed(getPdfUrl);
const title = computed(getTitle);

/**
 * Resolves the PDF URL for the preview iframe.
 *
 * @returns {string} PDF URL.
 */
function getPdfUrl() {
	return props.file?.publicUrl || props.item?.publicUrl || '';
}

/**
 * Resolves the PDF title.
 *
 * @returns {string} PDF display title.
 */
function getTitle() {
	return String(props.item?.name || props.file?.name || 'PDF preview');
}

/**
 * Requests the parent detail surface to close.
 */
function closeDetail() {
	emit('close');
}
</script>

<template>
	<div class="space-y-3">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="text-xs font-semibold uppercase text-muted-fg">PDF detail</p>
				<h3 class="mt-1 truncate text-lg font-semibold text-canvas-fg">{{ title }}</h3>
			</div>
			<DomButton size="sm" variant="secondary" @click="closeDetail">
				Back to folder
			</DomButton>
		</div>
		<div class="overflow-hidden rounded-lg border border-border bg-canvas">
			<iframe
				v-if="pdfUrl"
				:src="pdfUrl"
				:title="title"
				class="h-[34rem] w-full bg-canvas"
			></iframe>
			<div v-else class="grid h-[34rem] place-items-center text-sm text-muted-fg">
				No PDF URL is available for this record.
			</div>
		</div>
	</div>
</template>
