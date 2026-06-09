<script setup>
import { ref } from 'vue';
import { DomCheckbox, DomNativeSelect, DomNumberInput, DomTextInput } from '../../../lib/vue';

const label = ref('Inbox');
const tone = ref('success');
const limit = ref(10);
const pinned = ref(true);

const toneOptions = [
	{ label: 'Default', value: 'default' },
	{ label: 'Success', value: 'success' },
	{ label: 'Danger', value: 'danger' },
];
</script>

<template>
	<div class="w-full max-w-md space-y-4">
		<DomTextInput v-model="label" label="Label" />
		<DomNativeSelect v-model="tone" label="Tone" :options="toneOptions" />
		<DomNumberInput v-model="limit" label="Result limit" :min="1" :max="50" />
		<DomCheckbox v-model="pinned" label="Pinned" description="This checkbox is not inside DomForm." />

		<pre class="overflow-auto rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-fg">{{ { label, tone, limit, pinned } }}</pre>
	</div>
</template>
