<script setup>
import InspectorIcon from './InspectorIcon.vue';

/** A row of icon buttons where one option is pressed, as in Figma's layout controls. */
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
			:title="option.label"
			@click="emit('update:modelValue', option.value)"
		>
			<InspectorIcon :name="option.icon" />
		</button>
	</div>
</template>
