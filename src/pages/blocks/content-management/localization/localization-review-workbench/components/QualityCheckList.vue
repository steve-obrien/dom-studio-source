<script setup>
defineProps({
	checks: {
		type: Array,
		default: () => [],
	},
});

defineEmits(['resolve']);

function toneClass(check) {
	if (check.resolved) return 'border-success/25 bg-success/10 text-success';
	if (check.severity === 'High') return 'border-destructive/25 bg-destructive/10 text-destructive';
	if (check.severity === 'Medium') return 'border-warning/30 bg-warning/15 text-warning-fg';
	return 'border-border bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="space-y-2">
		<div
			v-for="check in checks"
			:key="check.id"
			class="rounded-lg border p-3"
			:class="toneClass(check)"
		>
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-sm font-semibold text-canvas-fg">{{ check.title }}</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
				</div>
				<span class="shrink-0 rounded-full bg-canvas/70 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-border">
					{{ check.resolved ? 'Resolved' : check.severity }}
				</span>
			</div>
			<button
				v-if="!check.resolved"
				type="button"
				class="mt-3 inline-flex h-8 items-center rounded-full border border-border bg-canvas px-3 text-xs font-semibold text-canvas-fg transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				@click="$emit('resolve', check.id)"
			>
				Mark resolved
			</button>
		</div>
		<div v-if="!checks.length" class="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-fg">
			No QA checks for this segment.
		</div>
	</div>
</template>
