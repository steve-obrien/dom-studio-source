<script setup>
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Native select',
		tag: '<DomNativeSelect>',
		description: 'A styled native select for cases where browser-native picker behaviour is intentionally preferred.',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired when the selected option changes.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	options: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			props: {
				description: 'Options can be strings or objects with label/value.',
				compact: true,
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Team workspace' },
					{ key: 'value', label: 'Value', placeholder: 'team' },
				],
			},
		},
	},
	placeholder: {
		type: String,
		default: 'Select an option',
		_edit: { description: 'Disabled placeholder option.' },
	},
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
/** @param {string|object} option Select option. @returns {string} Visible option label. */
const labelOf = (option) => (option && typeof option === 'object' ? (option.label ?? option.value) : option);
/** @param {string|object} option Select option. @returns {unknown} Submitted option value. */
const valueOf = (option) => (option && typeof option === 'object' ? (option.value ?? option.label) : option);
const field = useField(props, emit, { idPrefix: 'dom-native-select' });

/** @param {unknown} value Option value. @returns {boolean} Explicit selection for SSR and initial hydration. */
function isSelected(value) { return String(field.value.value ?? '') === String(value ?? ''); }
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<select
			v-bind="field.inputAttrs.value"
			class="skin-input h-10"
			@change="field.onInput($event.target.value)"
			@focus="field.onFocus"
			@blur="field.onBlur"
		>
			<option v-if="placeholder" disabled value="" :selected="isSelected('')">{{ placeholder }}</option>
			<option v-for="option in options" :key="valueOf(option)" :value="valueOf(option)" :selected="isSelected(valueOf(option))">
				{{ labelOf(option) }}
			</option>
		</select>
	</DomField>
</template>
