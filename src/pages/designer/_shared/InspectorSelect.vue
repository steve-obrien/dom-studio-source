<script setup>
import { computed } from 'vue';
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';
import InspectorIcon from './InspectorIcon.vue';

/** A compact native select that matches ScrubField, for inspector rows. Options are values or `{ label, value }`; an `icon` shows before the value, with the label as its tooltip. */
const props = defineProps({
	modelValue: { type: [String, Number], default: '' },
	options: { type: Array, required: true },
	label: { type: String, required: true },
	placeholder: { type: String, default: '' },
	icon: { type: String, default: '' },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);
const items = computed(() => {
	const list = props.options.map((option) => (typeof option === 'object' ? option : { label: String(option), value: option }));
	const current = props.modelValue;
	// A value the options do not list (a custom font, say) still shows.
	if (current !== '' && current !== null && current !== undefined && !list.some((option) => String(option.value) === String(current))) list.unshift({ label: String(current), value: current });
	return list;
});
</script>

<template>
	<span v-if="icon" class="relative block min-w-0">
		<span class="pointer-events-none absolute inset-y-0 left-0 grid w-7 place-items-center text-muted-fg" aria-hidden="true"><InspectorIcon :name="icon" /></span>
		<select
			v-dom-tooltip="label"
			class="h-7 w-full min-w-0 cursor-pointer truncate rounded-md border-0 bg-secondary/60 pl-7 pr-6 text-xs text-canvas-fg outline-none ring-inset transition hover:ring-1 hover:ring-border focus:bg-canvas focus:ring-1 focus:ring-primary disabled:pointer-events-none disabled:opacity-50"
			:value="modelValue ?? ''"
			:aria-label="label"
			:disabled="disabled"
			@change="emit('update:modelValue', $event.target.value)"
		>
			<option v-if="placeholder" value="">{{ placeholder }}</option>
			<option v-for="option in items" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
		</select>
	</span>
	<select
		v-else
		class="h-7 w-full min-w-0 cursor-pointer truncate rounded-md border-0 bg-secondary/60 pl-2 pr-6 text-xs text-canvas-fg outline-none ring-inset transition hover:ring-1 hover:ring-border focus:bg-canvas focus:ring-1 focus:ring-primary disabled:pointer-events-none disabled:opacity-50"
		:value="modelValue ?? ''"
		:aria-label="label"
		:disabled="disabled"
		@change="emit('update:modelValue', $event.target.value)"
	>
		<option v-if="placeholder" value="">{{ placeholder }}</option>
		<option v-for="option in items" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
	</select>
</template>
