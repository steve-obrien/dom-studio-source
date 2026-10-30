<script setup>
import { DomRangeInput } from '../../../lib/vue';
import ControlIconButton from './ControlIconButton.vue';
import StyleControlSection from './StyleControlSection.vue';

const props = defineProps({
	layout: {
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
		title="Layout"
		:muted="!layout.enabled"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<ControlIconButton
				:icon="layout.enabled ? 'eye' : 'eye-off'"
				:label="layout.enabled ? 'Hide layout' : 'Show layout'"
				@click="layout.enabled = !layout.enabled"
			/>
		</template>

		<div>
			<div class="grid gap-3 sm:grid-cols-2">
				<DomRangeInput v-model="layout.paddingX" label="Padding X" :min="8" :max="56" suffix="px" />
				<DomRangeInput v-model="layout.paddingY" label="Padding Y" :min="6" :max="28" suffix="px" />
				<DomRangeInput v-model="layout.radius" label="Radius" :min="0" :max="999" suffix="px" />
			</div>
		</div>
	</StyleControlSection>
</template>
