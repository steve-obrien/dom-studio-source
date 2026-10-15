<script setup>
import CssColorInput from '../color-swatch/DomColorSwatch.vue';
import ControlIconButton from '../_shared/ControlIconButton.vue';
import InspectorSelect from '../_shared/InspectorSelect.vue';
import ScrubField from '../_shared/ScrubField.vue';
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

/** Turns the border on, keeping its last settings; a `none` style becomes solid. */
function add() {
	props.border.enabled = true;
	if (props.border.style === 'none') props.border.style = 'solid';
	if (!(props.border.width > 0)) props.border.width = 1;
	emit('update:modelValue', true);
}
</script>

<template>
	<StyleControlSection
		:model-value="modelValue && border.enabled"
		:title="title"
		:meta="border.enabled && border.style !== 'none' ? `${border.width}px ${border.style}` : ''"
		@update:model-value="border.enabled ? emit('update:modelValue', $event) : add()"
	>
		<template #actions>
			<ControlIconButton v-if="border.enabled" icon="remove" :label="`Remove ${title.toLowerCase()}`" @click="border.enabled = false" />
			<ControlIconButton v-else icon="plus" :label="`Add ${title.toLowerCase()}`" @click="add" />
		</template>

		<div class="space-y-1.5">
			<CssColorInput v-model="border.color" hide-label :label="`${title} colour`" />
			<div class="grid grid-cols-2 gap-1.5">
				<ScrubField v-model="border.width" icon="stroke-weight" :label="`${title} weight`" :min="0" :max="maxWidth" />
				<InspectorSelect v-model="border.style" :options="borderStyleOptions" label="Style" />
			</div>
			<div
				v-if="variables.color || variables.width || variables.style"
				class="flex flex-wrap gap-1.5 font-mono text-[11px] text-muted-fg"
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
