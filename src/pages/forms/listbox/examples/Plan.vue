<script setup>
import { ref } from 'vue';
import { DomListbox } from '@getdom/studio/vue';

const value = ref('team');
const options = [
	{ value: 'solo', label: 'Solo', description: 'For small personal projects.' },
	{ value: 'team', label: 'Team', description: 'Shared workspace and billing.' },
	{ value: 'enterprise', label: 'Enterprise', description: 'SSO, audit logs, and support.' },
];
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomListbox v-model="value" :options="options">
			<template #option="{ option }">
				<span class="block font-medium">{{ option.label }}</span>
				<span class="block text-xs opacity-75">{{ option.description }}</span>
			</template>
		</DomListbox>
		<p class="text-xs text-muted-fg">Selected value: <code class="text-fg">{{ value }}</code></p>
	</div>
</template>
