<script setup>
import { ref } from 'vue';
import { DomStepper } from '../../../lib/vue';

const activeStep = ref('legal');
const steps = [
	{ key: 'brief', label: 'Campaign brief', description: 'Goals and audience approved', status: 'complete' },
	{ key: 'creative', label: 'Creative review', description: 'Two revisions accepted', status: 'complete' },
	{ key: 'legal', label: 'Legal approval', description: 'Claims require final review' },
	{ key: 'localisation', label: 'Localisation', description: 'Add regional variants', optional: true },
	{ key: 'publish', label: 'Publish', description: 'Schedule across channels' },
];
</script>

<template>
	<div class="w-full max-w-xl rounded-xl border border-border skin-card p-5">
		<DomStepper v-model="activeStep" :items="steps" orientation="vertical" />
	</div>
</template>
