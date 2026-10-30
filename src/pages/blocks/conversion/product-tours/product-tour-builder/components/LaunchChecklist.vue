<script setup>
import { computed } from 'vue';
import { DomProgress, DomStatusPill } from '@getdom/studio/vue';

const props = defineProps({
	checks: {
		type: Array,
		required: true,
	},
});

const passedCount = computed(getPassedCount);
const progress = computed(getProgress);

/**
 * Counts successful server-owned checks.
 *
 * @returns {number} Passed check count.
 */
function getPassedCount() {
	return props.checks.filter((check) => check.status === 'passed').length;
}

/**
 * Calculates launch-check completion.
 *
 * @returns {number} Percentage of passing checks.
 */
function getProgress() {
	return Math.round((passedCount.value / Math.max(1, props.checks.length)) * 100);
}
</script>

<template>
	<section>
		<div class="flex items-start justify-between gap-3">
			<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Launch checks</p><h3 class="mt-1 text-sm font-semibold">{{ passedCount }} of {{ checks.length }} passed</h3></div>
			<DomStatusPill :tone="passedCount === checks.length ? 'success' : 'warning'" size="sm">{{ passedCount === checks.length ? 'Ready' : 'Review' }}</DomStatusPill>
		</div>
		<DomProgress class="mt-3" :value="progress" label="Launch readiness" :show-label="false" size="sm" />
		<div class="mt-4 divide-y divide-border border-y border-border">
			<div v-for="check in checks" :key="check.id" class="flex items-start gap-3 py-3">
				<span class="mt-1 size-2 shrink-0 rounded-full" :class="check.status === 'passed' ? 'bg-success' : 'bg-warning'"></span>
				<div class="min-w-0"><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div>
			</div>
		</div>
	</section>
</template>
