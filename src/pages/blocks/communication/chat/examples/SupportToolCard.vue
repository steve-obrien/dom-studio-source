<script setup>
import { computed } from 'vue';
import { DomButton, DomStatusPill } from '@getdom/studio/vue';

const props = defineProps({
	tool: {
		type: Object,
		required: true,
	},
});

const emit = defineEmits(['action']);

const failed = computed(() => props.tool.status === 'error');
const resultEntries = computed(() => Object.entries(props.tool.result || {}));
const statusTone = computed(() => failed.value ? 'danger' : props.tool.status === 'running' ? 'info' : 'success');

/**
 * Requests a retry for a failed support tool call.
 *
 * @returns {void}
 */
function retryTool() {
	emit('action', 'retry');
}
</script>

<template>
	<div class="space-y-3 p-3">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold text-canvas-fg">{{ tool.label || tool.name }}</p>
				<p class="mt-0.5 text-xs text-muted-fg">{{ tool.name }}</p>
			</div>
			<DomStatusPill :tone="statusTone" size="sm">{{ failed ? 'Failed' : tool.status === 'running' ? 'Running' : 'Verified' }}</DomStatusPill>
		</div>

		<dl v-if="resultEntries.length" class="grid gap-x-4 gap-y-2 border-l-2 border-border pl-3 text-xs sm:grid-cols-2">
			<div v-for="([key, value]) in resultEntries" :key="key" class="min-w-0">
				<dt class="truncate text-muted-fg">{{ key }}</dt>
				<dd class="mt-0.5 break-words font-medium text-canvas-fg">{{ value }}</dd>
			</div>
		</dl>

		<DomButton v-if="failed" size="sm" variant="danger" @click="retryTool">Retry lookup</DomButton>
	</div>
</template>
