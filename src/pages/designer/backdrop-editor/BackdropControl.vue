<script setup>
import { computed } from 'vue';
import ScrubField from '../_shared/ScrubField.vue';
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

/** Turns the effect on, starting from a visible blur. */
function add() {
	props.backdrop.enabled = true;
	if (!(props.backdrop.blur > 0)) props.backdrop.blur = 8;
	emit('update:modelValue', true);
}
</script>

<template>
	<StyleControlSection
		:model-value="modelValue && backdrop.enabled"
		:title="title"
		:meta="backdrop.enabled ? backdropCss : ''"
		@update:model-value="backdrop.enabled ? emit('update:modelValue', $event) : add()"
	>
		<template #actions>
			<ControlIconButton v-if="backdrop.enabled" icon="remove" :label="`Remove ${title.toLowerCase()}`" @click="backdrop.enabled = false" />
			<ControlIconButton v-else icon="plus" :label="`Add ${title.toLowerCase()}`" @click="add" />
		</template>

		<div class="space-y-1.5">
			<div class="grid grid-cols-2 gap-1.5">
				<ScrubField v-model="backdrop.blur" icon="blur" label="Background blur" suffix="px" :min="0" :max="100" />
				<ScrubField v-model="backdrop.saturate" icon="saturate" label="Saturation" :min="0" :max="3" :step="0.05" />
			</div>
			<p v-if="variables.backdrop" class="truncate font-mono text-[11px] text-muted-fg">{{ variables.backdrop }}</p>
		</div>
	</StyleControlSection>
</template>
