<script setup>
import { ref } from 'vue';
import { DomToggle } from '@getdom/studio/vue';

const preferences = ref([
	{ id: 'autosave', label: 'Auto-save', enabled: true },
	{ id: 'email-alerts', label: 'Email alerts', enabled: false },
]);
</script>

<template>
	<div class="grid w-full max-w-md gap-5">
		<div v-for="preference in preferences" :key="preference.id" class="flex items-center justify-between gap-4">
			<DomToggle v-model="preference.enabled" :label="preference.label" />
			<span
				aria-hidden="true"
				class="inline-flex min-w-18 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
				:class="preference.enabled ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-secondary text-canvas-fg'"
			>
				<svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path :d="preference.enabled ? 'm3 8 3 3 7-7' : 'M4 8h8'" />
				</svg>
				{{ preference.enabled ? 'On' : 'Off' }}
			</span>
		</div>
	</div>
</template>
