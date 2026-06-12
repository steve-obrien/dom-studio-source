<script setup>
import {
	DomColorInput,
	DomRangeInput,
} from '../../../lib/vue';
import ControlIconButton from './ControlIconButton.vue';
import StyleControlSection from './StyleControlSection.vue';

const props = defineProps({
	typography: {
		type: Object,
		required: true,
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
	<StyleControlSection
		:model-value="modelValue"
		title="Typography"
		:muted="!typography.enabled"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<ControlIconButton
				:icon="typography.enabled ? 'eye' : 'eye-off'"
				:label="typography.enabled ? 'Hide typography' : 'Show typography'"
				@click="typography.enabled = !typography.enabled"
			/>
		</template>

		<div class="p-3">
			<div class="grid gap-3 sm:grid-cols-2">
				<DomColorInput v-model="typography.textColor" label="Text colour" />
				<DomRangeInput v-model="typography.fontSize" label="Font size" :min="11" :max="26" suffix="px" />
				<DomRangeInput v-model="typography.fontWeight" label="Font weight" :min="300" :max="900" :step="50" />
			</div>
		</div>
	</StyleControlSection>
</template>
