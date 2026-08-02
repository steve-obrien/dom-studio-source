<script setup>
import { computed } from 'vue';
import { DomButton, DomProgress, DomStatusPill } from '@getdom/studio/vue';

const props = defineProps({
	steps: {
		type: Array,
		required: true,
	},
	activeStepId: {
		type: String,
		required: true,
	},
	busy: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['select', 'duplicate']);

const readyCount = computed(getReadyCount);
const progress = computed(getProgress);

/**
 * Counts server-reviewed steps.
 *
 * @returns {number} Ready step count.
 */
function getReadyCount() {
	return props.steps.filter((step) => step.status === 'ready').length;
}

/**
 * Calculates the ready-step percentage.
 *
 * @returns {number} Completion percentage.
 */
function getProgress() {
	return Math.round((readyCount.value / Math.max(1, props.steps.length)) * 100);
}

/**
 * Resolves a semantic status tone for one step.
 *
 * @param {string} status Step status.
 * @returns {string} DOM Studio status tone.
 */
function statusTone(status) {
	return status === 'ready' ? 'success' : status === 'review_required' ? 'warning' : 'neutral';
}

/**
 * Converts a step status into human-readable copy.
 *
 * @param {string} status Step status.
 * @returns {string} Status label.
 */
function statusLabel(status) {
	return status === 'ready' ? 'Ready' : status === 'review_required' ? 'Review' : 'Draft';
}
</script>

<template>
	<div class="flex min-h-0 flex-1 flex-col">
		<div class="border-b border-border px-4 py-4">
			<div class="flex items-center justify-between gap-3">
				<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Tour sequence</p><p class="mt-1 text-sm font-semibold">{{ readyCount }} of {{ steps.length }} ready</p></div>
				<span class="text-xs text-muted-fg">{{ progress }}%</span>
			</div>
			<DomProgress class="mt-3" :value="progress" label="Step readiness" :show-label="false" size="sm" />
		</div>

		<nav class="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Tour steps">
			<div v-for="(step, index) in steps" :key="step.id" class="group mb-1">
				<button
					type="button"
					class="w-full rounded-lg px-3 py-3 text-left transition hover:bg-secondary"
					:class="step.id === activeStepId ? 'bg-secondary ring-1 ring-border' : ''"
					@click="$emit('select', step.id)"
				>
					<span class="flex items-start gap-3">
						<span class="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-canvas text-xs font-semibold">{{ index + 1 }}</span>
						<span class="min-w-0 flex-1">
							<span class="flex items-center justify-between gap-2"><span class="truncate text-sm font-semibold">{{ step.title }}</span><DomStatusPill :tone="statusTone(step.status)" size="sm">{{ statusLabel(step.status) }}</DomStatusPill></span>
							<span class="mt-1 block truncate text-xs text-muted-fg">{{ step.targetLabel }}</span>
						</span>
					</span>
				</button>
				<div v-if="step.id === activeStepId" class="px-3 pb-2 pl-13">
					<DomButton size="sm" variant="ghost" :disabled="busy" @click="$emit('duplicate', step.id)">Duplicate step</DomButton>
				</div>
			</div>
		</nav>
	</div>
</template>
