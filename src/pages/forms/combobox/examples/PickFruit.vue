<script setup>
import { DomCombobox } from '@getdom/studio/vue';
import { ref } from 'vue';
const value = ref('');
const options = [
	{ value: '1', label: 'Apple' },
	{ value: '2', label: 'Banana' },
	{ value: '3', label: 'Cherry' },
];
</script>

<template>
	<div class="flex w-full max-w-sm flex-col gap-2">
		<DomCombobox v-model="value" :options="options" placeholder="Pick a fruit" class="w-full" />
		<p class="text-xs text-muted-fg">Selected value: <code class="text-canvas-fg">{{ value || '—' }}</code></p>
	</div>
</template>
