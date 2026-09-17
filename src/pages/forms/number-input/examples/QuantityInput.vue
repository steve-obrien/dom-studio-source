<script setup>
import { ref } from 'vue';
import { DomNumberInput } from '@getdom/studio/vue';

const quantity = ref(1);
</script>

<template>
	<div class="w-full max-w-sm">
		<DomNumberInput
			v-model="quantity"
			label="Quantity"
			description="Choose between 1 and 12 items."
			:min="1"
			:max="12"
		/>
		<p class="mt-3 text-sm text-muted-fg">Selected quantity: {{ quantity || 0 }}</p>
	</div>
</template>
