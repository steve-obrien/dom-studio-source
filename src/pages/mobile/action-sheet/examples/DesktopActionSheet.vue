<script setup>
import { computed, ref } from 'vue';
import { DomActionSheet, DomButton } from '@getdom/studio/vue';

const open = ref(false);
const longList = ref(false);
const result = ref('No action selected.');
const actions = computed(() => longList.value
	? Array.from({ length: 18 }, (_, index) => ({ label: `Move to project ${index + 1}`, value: `project-${index + 1}` }))
	: [
		{ label: 'Copy document link', value: 'copy', description: 'Copy a link to the quarterly report' },
		{ label: 'Duplicate document', value: 'duplicate' },
		{ label: 'Download PDF', value: 'download', disabled: true, description: 'Available when the report is published' },
		{ label: 'Archive document', value: 'archive', variant: 'danger' },
	]);

/** Opens either the standard actions or the deliberately long scrolling list. */
function showActions(long = false) {
	longList.value = long;
	open.value = true;
}

/** Reports the demo selection; persistence and device APIs belong to the app. */
function selectAction(action) {
	result.value = `Selected: ${action.label}. This preview does not change a document.`;
}
</script>

<template>
	<section class="mx-auto w-full max-w-4xl space-y-6 p-5 sm:p-8">
		<header class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
			<div>
				<p class="text-xs font-medium text-muted-fg">Workspace / Reports</p>
				<h2 class="mt-1 text-xl font-semibold tracking-tight">Quarterly product review</h2>
			</div>
			<DomButton variant="secondary" @click="showActions()">Document actions</DomButton>
		</header>
		<div class="space-y-4 rounded-xl border border-border bg-secondary/20 p-5">
			<p class="text-sm font-semibold">Ready for the team review</p>
			<p class="max-w-xl text-sm leading-6 text-muted-fg">Keep document commands together in a sheet that works with a mouse, keyboard, or touch. The same component fits a desktop workspace and a mobile screen.</p>
			<DomButton variant="secondary" @click="showActions(true)">Try a long action list</DomButton>
		</div>
		<p role="status" class="text-sm text-muted-fg">{{ result }}</p>
		<DomActionSheet v-model="open" :title="longList ? 'Move document' : 'Document actions'" description="Quarterly product review" :actions="actions" @select="selectAction" />
	</section>
</template>
