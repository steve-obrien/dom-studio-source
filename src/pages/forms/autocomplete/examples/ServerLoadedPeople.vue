<script setup>
import { ref } from 'vue';
import { DomAutocomplete } from '@getdom/studio/vue';
import { searchPeople } from '../../_shared/serverLookup.js';

const value = ref('');
const options = ref([]);
const loading = ref(false);
let requestId = 0;

async function queryPeople(query) {
	const currentRequest = ++requestId;
	if (!query.trim()) {
		options.value = [];
		loading.value = false;
		return;
	}

	loading.value = true;
	const results = await searchPeople(query);
	if (currentRequest !== requestId) return;
	options.value = results.map((person) => ({
		...person,
		value: person.label,
		description: person.email,
	}));
	loading.value = false;
}
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomAutocomplete
			v-model="value"
			:options="options"
			:loading="loading"
			label="Search people"
			description="Suggestions are fetched by the parent in response to @query."
			placeholder="Type a name"
			class="w-full"
			@query="queryPeople"
		>
			<template #item="{ item }">
				<span class="block min-w-0">
					<span class="block truncate font-medium">{{ item.label }}</span>
					<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
				</span>
			</template>
		</DomAutocomplete>
		<p class="rounded-2xl border border-border bg-secondary/40 p-3 text-xs text-muted-fg">
			Text value: <code class="font-mono text-canvas-fg">{{ value || 'Empty' }}</code>
		</p>
	</div>
</template>
