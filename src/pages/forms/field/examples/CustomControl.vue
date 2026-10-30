<script setup>
import { ref } from 'vue';
import { DomButton, DomField } from '@getdom/studio/vue';

const cadence = ref('weekly');
const options = [
	{ label: 'Daily', value: 'daily' },
	{ label: 'Weekly', value: 'weekly' },
	{ label: 'Monthly', value: 'monthly' },
];
</script>

<template>
	<div class="w-full max-w-md">
		<DomField
			label="Digest cadence"
			description="DomField can wrap custom controls when you need field chrome without writing a new input component."
			required
		>
			<div class="flex flex-wrap gap-2">
				<DomButton
					v-for="option in options"
					:key="option.value"
					type="button"
					size="sm"
					:variant="cadence === option.value ? 'primary' : 'secondary'"
					:aria-pressed="cadence === option.value"
					@click="cadence = option.value"
				>
					{{ option.label }}
				</DomButton>
			</div>
		</DomField>
	</div>
</template>
