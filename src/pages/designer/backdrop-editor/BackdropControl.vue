<script setup>
import { computed } from 'vue';
import {
	DomRangeInput,
} from '../../lib/vue';
import ControlIconButton from '../_shared/ControlIconButton.vue';
import StyleControlSection from '../_shared/StyleControlSection.vue';
import { backdropToCss } from './backdropModel.js';

const props = defineProps({
	backdrop: {
		type: Object,
		required: true,
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	title: {
		type: String,
		default: 'Backdrop effects',
	},
	variables: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(['update:modelValue']);
const backdropCss = computed(() => backdropToCss(props.backdrop));
</script>

<template>
	<StyleControlSection
		:model-value="modelValue"
		:title="title"
		:meta="backdropCss"
		:muted="!backdrop.enabled"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<ControlIconButton
				:icon="backdrop.enabled ? 'eye' : 'eye-off'"
				:label="backdrop.enabled ? 'Hide backdrop effects' : 'Show backdrop effects'"
				@click="backdrop.enabled = !backdrop.enabled"
			/>
		</template>

		<div class="p-3">
			<div class="grid gap-3 sm:grid-cols-2">
				<DomRangeInput v-model="backdrop.blur" label="Blur" :min="0" :max="40" suffix="px" />
				<DomRangeInput v-model="backdrop.saturate" label="Saturate" :min="0.5" :max="1.8" :step="0.01" />
			</div>
			<p v-if="variables.backdrop" class="mt-3 truncate font-mono text-[11px] text-muted-fg">{{ variables.backdrop }}</p>
		</div>
	</StyleControlSection>
</template>
