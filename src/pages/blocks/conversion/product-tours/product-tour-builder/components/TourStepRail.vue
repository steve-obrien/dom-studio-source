<script setup>
import { computed } from 'vue';
import { DomBadge, DomStatusPill } from '@getdom/studio/vue';

const props = defineProps({
	steps: {
		type: Array,
		required: true,
	},
	activeStepId: {
		type: String,
		required: true,
	},
});

defineEmits(['select']);

const completedCount = computed(() => props.steps.filter((step) => step.status === 'Ready').length);

function statusTone(status) {
	if (status === 'Ready') return 'success';
	if (status === 'Needs QA') return 'warning';
	return 'neutral';
}
</script>

<template>
	<section class="rounded-lg border border-border skin-card">
		<div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Tour sequence</p>
				<h2 class="mt-1 text-sm font-semibold text-canvas-fg">{{ completedCount }} of {{ steps.length }} steps ready</h2>
			</div>
			<DomBadge tone="primary" variant="soft">{{ steps.length }} moments</DomBadge>
		</div>
		<div class="flex gap-2 overflow-x-auto p-3">
			<button
				v-for="(step, index) in steps"
				:key="step.id"
				type="button"
				class="min-w-[13.5rem] rounded-lg border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
				:class="step.id === activeStepId ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-canvas hover:border-primary/30 hover:bg-secondary/60'"
				@click="$emit('select', step.id)"
			>
				<span class="flex items-start justify-between gap-3">
					<span class="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-fg">
						{{ index + 1 }}
					</span>
					<DomStatusPill :tone="statusTone(step.status)" size="sm">{{ step.status }}</DomStatusPill>
				</span>
				<span class="mt-3 block truncate text-sm font-semibold text-canvas-fg">{{ step.title }}</span>
				<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ step.targetLabel }}</span>
			</button>
		</div>
	</section>
</template>
