<script setup>
import { ref } from 'vue';
import { DomRadioGroup } from '@getdom/studio/vue';

const plan = ref('team');
const options = [
	{ value: 'solo', label: 'Solo' },
	{ value: 'team', label: 'Team' },
	{ value: 'enterprise', label: 'Enterprise' },
];
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomRadioGroup v-model="plan" :options="options" label="Plan" />
		<p class="text-xs text-muted-foreground">Selected value: <code class="text-foreground">{{ plan }}</code></p>
	</div>
</template>
