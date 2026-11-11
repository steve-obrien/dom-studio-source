<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Toggle',
		tag: '<DomToggle>',
		description: 'Accessible switch for boolean values. Works standalone with v-model or inside DomForm through useField.',
		events: [
			{ name: 'update:modelValue', payload: '(checked: boolean)', description: 'Emitted when checked changes.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the switch receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the switch loses focus.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: Boolean,
		default: false,
		_edit: { group: 'Control props', description: 'On / off state.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { group: 'Control props', options: ['sm', 'md', 'lg'], description: 'Switch size. Matches DomButton size names.' },
	},
	showState: {
		type: Boolean,
		default: false,
		_edit: { group: 'Control props', description: 'Show On or Off inside a wider switch track.' },
	},
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

const root = ref(null);
const field = useField(props, emit, { idPrefix: 'dom-toggle' });
const labelId = computed(() => (props.label && props.chrome !== 'none' ? `${field.id.value}-label` : ''));
const sizeConfig = computed(() => ({
	sm: {
		wrapper: 'gap-2',
		label: 'text-xs',
		description: 'text-[0.6875rem] leading-4',
		style: {
			'--dom-toggle-height': '1.25rem',
			'--dom-toggle-width': '2.25rem',
			'--dom-toggle-thumb-size': '1rem',
			'--dom-toggle-thumb-offset': '1rem',
		},
	},
	md: {
		wrapper: 'gap-3',
		label: 'text-sm',
		description: 'text-xs',
		style: {
			'--dom-toggle-height': '1.5rem',
			'--dom-toggle-width': '2.75rem',
			'--dom-toggle-thumb-size': '1.25rem',
			'--dom-toggle-thumb-offset': '1.25rem',
		},
	},
	lg: {
		wrapper: 'gap-3.5',
		label: 'text-base',
		description: 'text-sm',
		style: {
			'--dom-toggle-height': '1.75rem',
			'--dom-toggle-width': '3.25rem',
			'--dom-toggle-thumb-size': '1.5rem',
			'--dom-toggle-thumb-offset': '1.5rem',
		},
	},
}[props.size] || {
	wrapper: 'gap-3',
	label: 'text-sm',
	description: 'text-xs',
	style: {},
}));
/** Reserves a fixed text area beside the thumb when the current state is shown. */
const switchStyle = computed(() => ({
	...sizeConfig.value.style,
	...(props.showState ? {
		'--dom-toggle-width': 'calc(var(--dom-toggle-thumb-size, 1.25rem) + 2.5rem + 4px)',
		'--dom-toggle-thumb-offset': '2.5rem',
	} : {}),
}));
const wrapperClasses = computed(() => [
	'inline-flex items-center',
	sizeConfig.value.wrapper,
]);
const labelClasses = computed(() => [
	sizeConfig.value.label,
	'text-canvas-fg',
]);
const descriptionClasses = computed(() => [
	sizeConfig.value.description,
	'text-muted-fg',
]);
const errorClasses = computed(() => [
	sizeConfig.value.description,
	'text-destructive',
]);

onMounted(async () => {
	await import('../../lib/headless/toggle.js');
	syncToggleFromValue();
	root.value?.addEventListener('dom:change', (event) => field.onInput(Boolean(event.detail.checked)));
});
watch(field.value, syncToggleFromValue);

/**
 * Keep the underlying headless toggle state aligned with the Vue field value.
 *
 * @returns {void}
 */
function syncToggleFromValue() {
	if (root.value && root.value.checked !== Boolean(field.value.value)) {
		root.value.checked = Boolean(field.value.value);
	}
}

/**
 * Toggle the switch when the visible text label is clicked.
 *
 * @returns {void}
 */
function toggleFromLabel() {
	if (field.disabled.value || field.readOnly.value) return;
	root.value?.focus?.();
	root.value?.toggle?.();
}
</script>

<template>
	<div v-if="field.visible.value" :class="wrapperClasses">
		<input
			v-if="field.htmlName.value"
			type="hidden"
			:name="field.htmlName.value"
			:value="field.value.value ? 'true' : 'false'"
		/>
		<dom-toggle
			ref="root"
			:id="field.id.value"
			:checked="Boolean(field.value.value) || null"
			:disabled="field.disabled.value || field.readOnly.value || null"
			:aria-label="!labelId ? label || undefined : undefined"
			:aria-labelledby="labelId || undefined"
			:aria-describedby="field.describedBy.value || undefined"
			:aria-invalid="field.invalid.value || undefined"
			:aria-errormessage="field.errorId.value || undefined"
			:data-invalid="field.invalid.value ? '' : undefined"
			:style="switchStyle"
			@focus="field.onFocus"
			@blur="field.onBlur"
		>
			<span
				v-if="showState"
				aria-hidden="true"
				class="pointer-events-none absolute inset-y-0 flex w-10 select-none items-center justify-center text-xs font-semibold"
				:class="field.value.value ? 'left-0.5 text-primary-fg' : 'right-0.5 text-canvas-fg'"
			>{{ field.value.value ? 'On' : 'Off' }}</span>
		</dom-toggle>
		<span
			v-if="chrome !== 'none' && (label || description || field.errors.value.length)"
			class="grid gap-0.5"
			:class="field.disabled.value ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
			@click="toggleFromLabel"
		>
			<span v-if="label" :id="labelId" :class="labelClasses">{{ label }}</span>
			<span v-if="description" :id="field.descriptionId.value" :class="descriptionClasses">{{ description }}</span>
			<span v-if="field.errors.value.length" :id="field.errorId.value" :class="errorClasses">{{ field.errors.value[0].message || field.errors.value[0] }}</span>
		</span>
	</div>
</template>
