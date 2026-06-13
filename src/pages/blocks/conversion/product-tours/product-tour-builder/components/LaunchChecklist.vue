<script setup>
import { computed } from 'vue';
import { DomStatusPill } from '@getdom/studio/vue';

const props = defineProps({
	checks: {
		type: Array,
		required: true,
	},
});

const passedCount = computed(() => props.checks.filter((check) => check.status === 'Passed').length);

function toneFor(status) {
	if (status === 'Passed') return 'success';
	if (status === 'Warning') return 'warning';
	return 'danger';
}
</script>

<template>
	<section class="rounded-lg border border-border skin-card p-4">
		<div class="flex items-start justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Launch readiness</p>
				<h2 class="mt-1 text-sm font-semibold text-canvas-fg">{{ passedCount }} of {{ checks.length }} checks passed</h2>
			</div>
			<DomStatusPill :tone="passedCount === checks.length ? 'success' : 'warning'" size="sm">
				{{ passedCount === checks.length ? 'Ready' : 'Review' }}
			</DomStatusPill>
		</div>
		<div class="mt-4 grid gap-2">
			<div
				v-for="check in checks"
				:key="check.id"
				class="rounded-lg border border-border bg-canvas p-3"
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-sm font-semibold text-canvas-fg">{{ check.label }}</p>
						<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
					</div>
					<DomStatusPill :tone="toneFor(check.status)" size="sm">{{ check.status }}</DomStatusPill>
				</div>
			</div>
		</div>
	</section>
</template>
