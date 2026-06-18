<script setup>
import { computed, ref } from 'vue';
import DomField from '../field/DomField.vue';
import DomTooltip from '../../components/tooltip/DomTooltip.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Toggle button group',
		tag: '<DomToggleButtonGroup>',
		description: 'A single or multiple selection button group for compact form choices.',
		slots: [{ name: 'option', payload: '{ option, index, selected }', description: 'Custom option markup.' }],
		events: [{ name: 'update:modelValue', payload: '(value: string | string[])', description: 'Emitted when selection changes.' }],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: [String, Number, Array],
		default: '',
		_edit: { description: 'Selected value for single mode, or selected values for multiple mode.' },
	},
	options: {
		type: Array,
		required: true,
		_edit: {
			component: 'DomJsonListInput',
			description: 'Toggle button options.',
			props: {
				compact: true,
				addLabel: '+ Add option',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Option label', default: (index) => `Option ${index + 1}` },
					{ key: 'value', label: 'Value', placeholder: 'option-value', default: (index) => `option-${index + 1}` },
					{ key: 'tooltip', label: 'Tooltip', placeholder: 'Choose this option' },
				],
			},
		},
	},
	type: {
		type: String,
		default: 'single',
		_edit: { options: ['single', 'multiple'], description: 'Allow one selection or many.' },
	},
	orientation: {
		type: String,
		default: 'horizontal',
		_edit: { options: ['horizontal', 'vertical'], description: 'Visual direction and arrow key behaviour.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { options: ['sm', 'md', 'lg', 'icon-sm', 'icon-md'], description: 'Button size.' },
	},
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-toggle-button-group' });
const buttons = ref([]);

const isMultiple = computed(() => props.type === 'multiple');
const selectedValues = computed(() => {
	if (isMultiple.value) return Array.isArray(field.value.value) ? field.value.value.map(String) : [];
	return field.value.value == null || field.value.value === '' ? [] : [String(field.value.value)];
});
const sizeClass = computed(() => ({
	sm: 'min-h-8 px-3 py-1.5 text-xs',
	md: 'min-h-10 px-4 py-2 text-sm',
	lg: 'min-h-11 px-5 py-2.5 text-base',
	'icon-sm': 'size-8 p-0 text-xs',
	'icon-md': 'size-10 p-0 text-sm',
}[props.size] || 'min-h-10 px-4 py-2 text-sm'));

const labelOf = (option) => (option && typeof option === 'object' ? (option.label ?? option.value) : option);
const valueOf = (option) => String(option && typeof option === 'object' ? (option.value ?? option.label) : option);
const selected = (option) => selectedValues.value.includes(valueOf(option));
const tooltipOf = (option) => (option && typeof option === 'object' ? option.tooltip : '');
const ariaLabelOf = (option) => (option && typeof option === 'object' ? (option.ariaLabel || option.tooltip || null) : null);

function joinClass(index) {
	const last = index === props.options.length - 1;
	if (props.orientation === 'vertical') {
		return [
			index > 0 ? 'border-t border-border/80' : '',
			index === 0 ? 'rounded-t-xl' : '',
			last ? 'rounded-b-xl' : '',
		];
	}
	return [
		index > 0 ? 'border-l border-border/80' : '',
		index === 0 ? 'rounded-l-xl' : '',
		last ? 'rounded-r-xl' : '',
	];
}

function buttonClass(index) {
	return [
		'relative inline-flex items-center justify-center gap-2 font-medium text-muted-fg outline-none transition hover:bg-secondary hover:text-canvas-fg focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:z-10 aria-pressed:bg-canvas aria-pressed:text-canvas-fg aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-ring/30',
		sizeClass.value,
		joinClass(index),
	];
}

function setButtonRef(element, index) {
	if (element) buttons.value[index] = element;
}

function selectOption(option) {
	if (field.disabled.value || field.readOnly.value || option?.disabled) return;
	const value = valueOf(option);
	if (isMultiple.value) {
		const next = selected(option)
			? selectedValues.value.filter((item) => item !== value)
			: [...selectedValues.value, value];
		field.onInput(next);
		return;
	}
	field.onInput(value);
}

function moveFocus(index, direction) {
	const enabled = buttons.value.filter((button) => button && !button.disabled);
	if (!enabled.length) return;
	const current = buttons.value[index];
	const currentIndex = Math.max(0, enabled.indexOf(current));
	enabled[(currentIndex + direction + enabled.length) % enabled.length]?.focus();
}

function onKeydown(event, index, option) {
	const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
	const prevKey = props.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
	if (event.key === nextKey) {
		event.preventDefault();
		moveFocus(index, 1);
	} else if (event.key === prevKey) {
		event.preventDefault();
		moveFocus(index, -1);
	} else if (event.key === 'Home') {
		event.preventDefault();
		buttons.value.find((button) => button && !button.disabled)?.focus();
	} else if (event.key === 'End') {
		event.preventDefault();
		[...buttons.value].reverse().find((button) => button && !button.disabled)?.focus();
	} else if (event.key === ' ' || event.key === 'Enter') {
		event.preventDefault();
		selectOption(option);
	}
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<input
			v-if="field.htmlName.value"
			type="hidden"
			:name="field.htmlName.value"
			:value="isMultiple ? JSON.stringify(selectedValues) : (selectedValues[0] || '')"
		/>
		<div
			:id="field.id.value"
			role="group"
			:aria-label="label || undefined"
			:aria-describedby="field.describedBy.value || undefined"
			:aria-invalid="field.invalid.value || undefined"
			:aria-errormessage="field.errorId.value || undefined"
			:data-invalid="field.invalid.value ? '' : undefined"
			class="skin-control inline-flex w-fit overflow-hidden rounded-xl p-0 data-[invalid]:border-destructive"
			:class="orientation === 'vertical' ? 'flex-col' : 'flex-row'"
		>
			<template v-for="(option, index) in options" :key="valueOf(option) || index">
				<DomTooltip v-if="tooltipOf(option)" :text="tooltipOf(option)" placement="top">
					<button
						:ref="(element) => setButtonRef(element, index)"
						type="button"
						:aria-label="ariaLabelOf(option) || undefined"
						:aria-pressed="String(selected(option))"
						:disabled="field.disabled.value || option?.disabled || undefined"
						:class="buttonClass(index)"
						@click="selectOption(option)"
						@keydown="onKeydown($event, index, option)"
						@focus="field.onFocus"
						@blur="field.onBlur"
					>
						<slot name="option" :option="option" :index="index" :selected="selected(option)">{{ labelOf(option) }}</slot>
					</button>
				</DomTooltip>
				<button
					v-else
					:ref="(element) => setButtonRef(element, index)"
					type="button"
					:aria-label="ariaLabelOf(option) || undefined"
					:aria-pressed="String(selected(option))"
					:disabled="field.disabled.value || option?.disabled || undefined"
					:class="buttonClass(index)"
					@click="selectOption(option)"
					@keydown="onKeydown($event, index, option)"
					@focus="field.onFocus"
					@blur="field.onBlur"
				>
					<slot name="option" :option="option" :index="index" :selected="selected(option)">{{ labelOf(option) }}</slot>
				</button>
			</template>
		</div>
	</DomField>
</template>
