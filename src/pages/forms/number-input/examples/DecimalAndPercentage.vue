<script setup>
import { computed, ref } from 'vue';
import { DomNumberInput } from '@getdom/studio/vue';

const completion = ref(75);
const hours = ref(1.5);
const completionErrors = computed(() => (
	completion.value === '' || completion.value < 0 || completion.value > 100
		? ['Enter a percentage from 0 to 100.']
		: []
));
</script>

<template>
	<div class="grid w-full max-w-xl gap-4 sm:grid-cols-2">
		<DomNumberInput
			v-model="completion"
			label="Completion percentage"
			description="Whole numbers from 0 to 100."
			:min="0"
			:max="100"
			:errors="completionErrors"
		/>
		<DomNumberInput
			v-model="hours"
			label="Estimated hours"
			description="Adjust in quarter-hour steps."
			:min="0"
			:step="0.25"
		/>
	</div>
</template>
