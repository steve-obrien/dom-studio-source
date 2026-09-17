<script setup>
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Vue number input',
		tag: '<DomNumberInput>',
		description: 'An accessible Vue 3 number input with v-model, labels, validation, and native min, max, and step constraints.',
		icon: 'M8 7h8M8 12h8M8 17h8',
		events: [
			{ name: 'update:modelValue', payload: 'number | string', description: 'Fired with a number as the user types, or an empty string when cleared.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the number input receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the number input loses focus.' },
		],
		playground: {
			initial: {
				label: 'Quantity',
				description: 'Choose between 1 and 99 items.',
				modelValue: 3,
				min: 1,
				max: 99,
				step: 1,
			},
		},
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: [Number, String],
		default: '',
		_edit: { description: 'Current numeric value.' },
	},
	min: {
		type: Number,
		default: null,
		_edit: { description: 'Minimum accepted number and native spinbutton boundary.' },
	},
	max: {
		type: Number,
		default: null,
		_edit: { description: 'Maximum accepted number and native spinbutton boundary.' },
	},
	step: {
		type: Number,
		default: 1,
		_edit: { description: 'Increment used by the browser spin buttons and arrow keys.' },
	},
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-number-input' });

/**
 * Normalizes numeric input text while preserving a deliberately empty value.
 *
 * @param {string|number} value Current input value.
 * @returns {string|number} Parsed number, empty string, or original invalid value.
 */
function toNumber(value) {
	if (value === '') return '';
	const number = Number(value);
	return Number.isNaN(number) ? value : number;
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<input
			v-bind="field.inputAttrs.value"
			type="number"
			:min="min"
			:max="max"
			:step="step"
			class="skin-input h-10"
			@input="field.onInput(toNumber($event.target.value))"
			@focus="field.onFocus"
			@blur="field.onBlur"
		/>
	</DomField>
</template>
