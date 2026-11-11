<script setup>
import { ref } from 'vue';
import { DomNumberInput } from '@getdom/studio/vue';

const width = ref(320);
const opacity = ref(75);
const lastCommittedWidth = ref(320);
</script>

<template>
	<div class="grid w-full max-w-xl gap-5 sm:grid-cols-2">
		<div>
			<DomNumberInput
				v-model="width"
				label="Panel width"
				description="Drag the left handle, or focus and scroll. Hold Shift for larger steps."
				:min="160"
				:max="800"
				scrubbable
				@scrub-end="lastCommittedWidth = $event"
			/>
			<p class="mt-3 text-xs text-muted-fg">Preview: {{ width }} px · Last released: {{ lastCommittedWidth }} px</p>
		</div>
		<DomNumberInput
			v-model="opacity"
			label="Opacity"
			description="Adjust in half-percent steps, bounded from 0 to 100."
			:min="0"
			:max="100"
			:step="0.5"
			scrubbable
		/>
	</div>
</template>
