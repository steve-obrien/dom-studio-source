<script setup>
import CssColorInput from '../color-swatch/DomColorSwatch.vue';
import {
	DomNativeSelect,
	DomRangeInput,
} from '../../lib/vue';
import ControlIconButton from '../_shared/ControlIconButton.vue';
import StyleControlSection from '../_shared/StyleControlSection.vue';
import { borderStyleOptions } from './borderModel.js';

const props = defineProps({
	border: {
		type: Object,
		required: true,
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	title: {
		type: String,
		default: 'Border',
	},
	maxWidth: { type: Number, default: 6 },
	variables: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
	<StyleControlSection
		:model-value="modelValue"
		:title="title"
		:meta="border.enabled && border.style !== 'none' ? `${border.width}px ${border.style}` : 'none'"
		:muted="!border.enabled"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<ControlIconButton
				:icon="border.enabled ? 'eye' : 'eye-off'"
				:label="border.enabled ? 'Hide border' : 'Show border'"
				@click="border.enabled = !border.enabled"
			/>
		</template>

		<div class="p-3">
			<div class="grid gap-3 sm:grid-cols-2">
				<DomRangeInput v-model="border.width" label="Width" :min="0" :max="maxWidth" suffix="px" />
				<DomNativeSelect v-model="border.style" label="Style" :options="borderStyleOptions" placeholder="" />
				<CssColorInput v-model="border.color" label="Colour" />
			</div>
			<div
				v-if="variables.color || variables.width || variables.style"
				class="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px] text-muted-fg"
			>
				<span v-if="variables.color" class="rounded border border-border bg-secondary px-1.5 py-0.5">{{
					variables.color
				}}</span>
				<span v-if="variables.width" class="rounded border border-border bg-secondary px-1.5 py-0.5">{{
					variables.width
				}}</span>
				<span v-if="variables.style" class="rounded border border-border bg-secondary px-1.5 py-0.5">{{
					variables.style
				}}</span>
			</div>
		</div>
	</StyleControlSection>
</template>
