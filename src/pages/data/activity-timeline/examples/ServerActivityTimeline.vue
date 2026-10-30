<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { DomActivityTimeline, DomButton, DomSelect } from '../../../lib/vue';
import { useActivityTimelineDemoStore } from './useActivityTimelineDemoStore.js';

const store = useActivityTimelineDemoStore();
const { rows, type, loading, loadingMore, hasNextPage, total, error, lastRequestUrl } = storeToRefs(store);
const typeOptions = [
	{ label: 'All activity', value: '' },
	{ label: 'Deployments', value: 'deployment' },
	{ label: 'Approvals', value: 'approval' },
	{ label: 'Comments', value: 'comment' },
	{ label: 'Automations', value: 'automation' },
];

onMounted(store.refresh);
</script>

<template>
	<div class="w-full rounded-xl border border-border skin-card">
		<div class="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="min-w-0">
				<h3 class="text-sm font-semibold text-canvas-fg">Release activity</h3>
				<p class="mt-1 text-xs text-muted-fg">{{ total }} server record{{ total === 1 ? '' : 's' }}</p>
			</div>
			<div class="flex flex-wrap items-end gap-2">
				<DomSelect :model-value="type" label="Activity type" :options="typeOptions" width="min-w-44" @update:model-value="store.setType" />
				<DomButton size="sm" variant="secondary" :loading="loading" @click="store.refresh">Refresh</DomButton>
			</div>
		</div>

		<div class="p-4 sm:p-5">
			<p v-if="lastRequestUrl" class="mb-4 break-all rounded-md bg-secondary px-3 py-2 font-mono text-[11px] text-muted-fg">GET {{ lastRequestUrl }}</p>
			<p v-if="error" class="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{{ error }}</p>

			<DomActivityTimeline
				:rows="rows"
				:loading="loading"
				title-key="action"
				description-key="detail"
				timestamp-key="createdAt"
				meta-key="actor"
				status-key="status"
				tone-key="tone"
				layout="split"
			/>

			<div v-if="hasNextPage" class="mt-2 flex justify-center border-t border-border pt-4">
				<DomButton variant="secondary" size="sm" :loading="loadingMore" @click="store.loadMore">Load older activity</DomButton>
			</div>
		</div>
	</div>
</template>
