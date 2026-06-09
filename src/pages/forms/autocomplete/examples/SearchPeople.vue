<script setup>
import { DomAutocomplete } from '@getdom/studio/vue';
import { ref } from 'vue';

const text = ref('');
const selected = ref(null);
const people = [
	{ value: '1', label: 'Ada Lovelace', email: 'ada@example.com' },
	{ value: '2', label: 'Grace Hopper', email: 'grace@example.com' },
	{ value: '3', label: 'Katherine Johnson', email: 'katherine@example.com' },
];

function onSelect(event) {
	selected.value = event.item;
}
</script>

<template>
	<div class="flex w-full max-w-sm flex-col gap-2">
		<DomAutocomplete
			v-model="text"
			:options="people"
			placeholder="Search people"
			class="w-full"
			@select="onSelect"
		/>
		<p class="text-xs text-muted-fg">Typed text: <code class="text-fg">{{ text || '—' }}</code></p>
		<p class="text-xs text-muted-fg">Selected item: <code class="text-fg">{{ selected?.email || '—' }}</code></p>
	</div>
</template>
