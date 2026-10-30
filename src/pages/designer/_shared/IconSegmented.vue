<script setup>
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';
import InspectorIcon from './InspectorIcon.vue';

/** A row of icon buttons where one option is pressed, as in Figma's layout controls. Each shows `tooltip` (or `label`) on hover; an option with `text` shows that text instead of an icon. */
defineProps({
	modelValue: { type: String, default: '' },
	options: { type: Array, required: true },
	label: { type: String, required: true },
});
const emit = defineEmits(['update:modelValue']);
</script>

<template>
	<div class="inline-flex h-7 shrink-0 items-center rounded-md bg-secondary/60 p-0.5" role="group" :aria-label="label">
		<button
			v-for="option in options"
			:key="option.value"
			type="button"
			class="grid h-6 w-7 place-items-center rounded text-muted-fg transition hover:text-canvas-fg"
			:class="modelValue === option.value && 'bg-canvas text-canvas-fg shadow-sm ring-1 ring-border'"
			:aria-pressed="modelValue === option.value"
			:aria-label="option.label"
			v-dom-tooltip="option.tooltip || option.label"
			@click="emit('update:modelValue', option.value)"
		>
			<span v-if="option.text" class="text-[11px] font-medium leading-none">{{ option.text }}</span>
			<InspectorIcon v-else :name="option.icon" />
		</button>
	</div>
</template>
