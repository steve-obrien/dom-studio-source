<script setup>
import { ref } from 'vue';
import { DomToggle } from '@getdom/studio/vue';

const preferences = ref([
	{ id: 'sound', label: 'Sound effects', enabled: false },
	{ id: 'desktop', label: 'Desktop alerts', enabled: true },
]);
</script>

<template>
	<div class="grid w-full max-w-md gap-5">
		<div v-for="preference in preferences" :key="preference.id" class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
			<p class="text-sm font-medium text-canvas-fg">{{ preference.label }}</p>
			<div class="flex shrink-0 items-center gap-3">
				<span
					aria-hidden="true"
					class="min-w-6 text-center text-sm underline-offset-4"
					:class="!preference.enabled ? 'font-bold text-canvas-fg underline decoration-2' : 'text-muted-fg'"
				>Off</span>
				<DomToggle v-model="preference.enabled" :label="preference.label" chrome="none" />
				<span
					aria-hidden="true"
					class="min-w-6 text-center text-sm underline-offset-4"
					:class="preference.enabled ? 'font-bold text-canvas-fg underline decoration-2' : 'text-muted-fg'"
				>On</span>
			</div>
		</div>
	</div>
</template>
