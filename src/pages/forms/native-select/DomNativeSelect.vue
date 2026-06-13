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

const emit = defineEmits(['update:modelValue']);
const labelOf = (option) => (option && typeof option === 'object' ? (option.label ?? option.value) : option);
const valueOf = (option) => (option && typeof option === 'object' ? (option.value ?? option.label) : option);
const field = useField(props, emit, { idPrefix: 'dom-native-select' });
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<div class="relative">
			<select
				v-bind="field.inputAttrs.value"
				class="skin-input h-10 appearance-none pr-10"
				@change="field.onInput($event.target.value)"
				@focus="field.onFocus"
				@blur="field.onBlur"
			>
				<option v-if="placeholder" disabled value="">{{ placeholder }}</option>
				<option v-for="option in options" :key="valueOf(option)" :value="valueOf(option)">
					{{ labelOf(option) }}
				</option>
			</select>
			<svg class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</div>
	</DomField>
</template>
