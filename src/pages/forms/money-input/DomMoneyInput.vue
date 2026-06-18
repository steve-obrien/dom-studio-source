<script setup>
import { computed } from 'vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Money input',
		tag: '<DomMoneyInput>',
		description: 'A field-compatible decimal input with currency chrome for prices, budgets, invoices, and payouts.',
		icon: 'M12 5v14M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8',
		events: [
			{ name: 'update:modelValue', payload: 'string | number', description: 'Fired when the amount changes.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the input receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the input loses focus.' },
		],
		playground: {
			initial: {
				label: 'Price',
				modelValue: '149.00',
				currency: 'GBP',
				description: 'Stored as a decimal string; upload and billing logic stay parent-owned.',
			},
		},
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: [String, Number],
		default: '',
		_edit: { description: 'Current decimal amount.' },
	},
	currency: {
		type: String,
		default: 'GBP',
		_edit: { description: 'ISO currency code used for the visual prefix.' },
	},
	locale: {
		type: String,
		default: 'en-GB',
		_edit: { description: 'Locale used to resolve the currency symbol.' },
	},
	prefix: {
		type: String,
		default: '',
		_edit: { description: 'Prefix override. Defaults to the currency symbol.' },
	},
	suffix: {
		type: String,
		default: '',
		_edit: { description: 'Optional suffix such as per month.' },
	},
	min: {
		type: Number,
		default: null,
		_edit: { description: 'Minimum numeric value.' },
	},
	max: {
		type: Number,
		default: null,
		_edit: { description: 'Maximum numeric value.' },
	},
	step: {
		type: Number,
		default: 0.01,
		_edit: { description: 'Native numeric step hint.' },
	},
	textAlign: {
		type: String,
		default: 'right',
		_edit: {
			options: ['left', 'right'],
			description: 'Input text alignment.',
		},
	},
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-money-input' });

const prefixText = computed(() => props.prefix || currencySymbol(props.currency, props.locale));
const inputAttrs = computed(() => ({
	...field.inputAttrs.value,
	inputmode: 'decimal',
	autocomplete: 'off',
	'aria-valuemin': props.min ?? undefined,
	'aria-valuemax': props.max ?? undefined,
}));
const controlClass = computed(() => [
	'flex h-10 w-full overflow-hidden rounded-lg border border-input bg-canvas text-sm shadow-sm transition focus-within:ring-2 focus-within:ring-ring/50',
	field.invalid.value && 'border-destructive',
	(field.disabled.value || field.readOnly.value) && 'opacity-60',
]);
const inputClass = computed(() => [
	'min-w-0 flex-1 bg-transparent px-3 text-canvas-fg outline-none placeholder:text-muted-fg disabled:cursor-not-allowed',
	props.textAlign === 'right' ? 'text-right' : 'text-left',
]);

function currencySymbol(currency, locale) {
	try {
		const parts = new Intl.NumberFormat(locale || undefined, {
			style: 'currency',
			currency: currency || 'GBP',
			currencyDisplay: 'narrowSymbol',
		}).formatToParts(0);
		return parts.find((part) => part.type === 'currency')?.value || currency || '';
	} catch {
		return currency || '';
	}
}

function onInput(event) {
	field.onInput(event.target.value);
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<div :class="controlClass">
			<span
				v-if="prefixText"
				class="flex shrink-0 items-center border-r border-border bg-secondary px-3 text-sm font-medium text-muted-fg"
				aria-hidden="true"
			>
				{{ prefixText }}
			</span>
			<input
				v-bind="inputAttrs"
				type="text"
				:class="inputClass"
				:placeholder="placeholder || '0.00'"
				@input="onInput"
				@focus="field.onFocus"
				@blur="field.onBlur"
			/>
			<span
				v-if="suffix"
				class="flex shrink-0 items-center border-l border-border bg-secondary px-3 text-sm font-medium text-muted-fg"
			>
				{{ suffix }}
			</span>
		</div>
	</DomField>
</template>
