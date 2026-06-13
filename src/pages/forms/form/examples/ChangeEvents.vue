<script setup>
import { ref } from 'vue';
import { DomEmailInput, DomForm, DomTextInput } from '../../../lib/vue';

const person = ref({
	name: '',
	email: '',
});
const log = ref([]);

function onChange(event) {
	log.value.unshift({
		field: event.name,
		value: event.value,
		at: new Date().toLocaleTimeString(),
	});
	log.value = log.value.slice(0, 5);
}
</script>

<template>
	<div class="w-full max-w-md">
		<DomForm v-model="person" class="space-y-4" @change="onChange">
			<DomTextInput name="name" label="Name" />
			<DomEmailInput name="email" label="Email" />
		</DomForm>

		<div class="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Change log</p>
			<ul class="mt-2 space-y-1 text-xs text-muted-fg">
				<li v-for="entry in log" :key="`${entry.field}-${entry.at}-${entry.value}`">
					<span class="text-canvas-fg">{{ entry.field }}</span>: {{ entry.value || 'empty' }} at {{ entry.at }}
				</li>
				<li v-if="!log.length">Change a field to see events.</li>
			</ul>
		</div>
	</div>
</template>
