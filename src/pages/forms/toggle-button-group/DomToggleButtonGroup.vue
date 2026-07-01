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
		_edit: { options: ['sm', 'md', 'lg', 'icon-sm', 'icon-md', 'icon-lg'], description: 'Button size.' },
	},
	variant: {
		type: String,
		default: 'default',
		validator: (value) => ['default', 'switch'].includes(value),
		_edit: { options: ['default', 'switch'], description: 'Visual treatment. Use switch for raised icon-only segmented controls.' },
	},
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-toggle-button-group' });
const buttons = ref([]);

const isMultiple = computed(() => props.type === 'multiple');
const selectedValues = computed(getSelectedValues);
const sizeClass = computed(getSizeClass);
const groupClass = computed(getGroupClass);

/**
 * Resolves the selected values as stable strings for aria-pressed checks.
 *
 * @returns {Array<string>} Selected option values.
 */
function getSelectedValues() {
	if (isMultiple.value) return Array.isArray(field.value.value) ? field.value.value.map(String) : [];
	return field.value.value == null || field.value.value === '' ? [] : [String(field.value.value)];
}

/**
 * Resolves the size utility classes for each button.
 *
 * @returns {string} Button size class list.
 */
function getSizeClass() {
	return {
		sm: 'min-h-8 px-3 py-1.5 text-xs',
		md: 'min-h-10 px-4 py-2 text-sm',
		lg: 'min-h-11 px-5 py-2.5 text-base',
		'icon-sm': 'size-8 p-0 text-xs',
		'icon-md': 'size-10 p-0 text-sm',
		'icon-lg': 'size-12 p-0 text-sm',
	}[props.size] || 'min-h-10 px-4 py-2 text-sm';
}

/**
 * Builds the root group classes for the selected visual variant.
 *
 * @returns {Array<string>} Vue class list.
 */
function getGroupClass() {
	const directionClass = props.orientation === 'vertical' ? 'flex-col' : 'flex-row';
	if (props.variant === 'switch') {
		return [
			'inline-flex w-fit items-center overflow-hidden rounded-xl bg-secondary/80 p-0.5 shadow-inner ring-1 ring-border/30 data-[invalid]:ring-destructive/30',
			directionClass,
			'gap-0.5',
		];
	}

	return [
		'skin-control inline-flex w-fit overflow-hidden rounded-xl p-0 data-[invalid]:border-destructive',
		directionClass,
	];
}

/**
 * Resolves the visible label for an option.
 *
 * @param {unknown} option Toggle option.
 * @returns {unknown} Label content.
 */
function labelOf(option) {
	return option && typeof option === 'object' ? (option.label ?? option.value) : option;
}

/**
 * Resolves the emitted value for an option.
 *
 * @param {unknown} option Toggle option.
 * @returns {string} Stable option value.
 */
function valueOf(option) {
	return String(option && typeof option === 'object' ? (option.value ?? option.label) : option);
}

/**
 * Checks whether an option is selected.
 *
 * @param {unknown} option Toggle option.
 * @returns {boolean} True when the option is pressed.
 */
function selected(option) {
	return selectedValues.value.includes(valueOf(option));
}

/**
 * Resolves optional tooltip text for an option.
 *
 * @param {unknown} option Toggle option.
 * @returns {string} Tooltip text.
 */
function tooltipOf(option) {
	return option && typeof option === 'object' ? option.tooltip : '';
}

/**
 * Resolves an accessible label for icon-only options.
 *
 * @param {unknown} option Toggle option.
 * @returns {string|null} Accessible label or null.
 */
function ariaLabelOf(option) {
	return option && typeof option === 'object' ? option.ariaLabel || option.tooltip || null : null;
}

/**
 * Builds joining classes for adjacent buttons.
 *
 * @param {number} index Option index.
 * @returns {Array<string>} Classes for the option position.
 */
function joinClass(index) {
	if (props.variant === 'switch') return ['rounded-lg'];

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

/**
 * Builds the button classes for an option.
 *
 * @param {number} index Option index.
 * @returns {Array<string>} Vue class list.
 */
function buttonClass(index) {
	if (props.variant === 'switch') {
		return [
			'relative inline-flex items-center justify-center gap-2 font-medium text-muted-fg outline-none transition hover:bg-canvas/35 hover:text-canvas-fg focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:z-10 aria-pressed:bg-canvas aria-pressed:text-canvas-fg aria-pressed:shadow-md aria-pressed:ring-1 aria-pressed:ring-border/70',
			sizeClass.value,
			joinClass(index),
		];
	}

	return [
		'relative inline-flex items-center justify-center gap-2 font-medium text-muted-fg outline-none transition hover:bg-secondary hover:text-canvas-fg focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:z-10 aria-pressed:bg-canvas aria-pressed:text-canvas-fg aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-ring/30',
		sizeClass.value,
		joinClass(index),
	];
}

/**
 * Stores a button reference for keyboard roving focus.
 *
 * @param {HTMLButtonElement|null} element Button element.
 * @param {number} index Option index.
 */
function setButtonRef(element, index) {
	if (element) buttons.value[index] = element;
}

/**
 * Selects or toggles an option depending on group type.
 *
 * @param {unknown} option Toggle option.
 */
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

/**
 * Moves focus between enabled buttons.
 *
 * @param {number} index Current option index.
 * @param {number} direction Relative movement direction.
 */
function moveFocus(index, direction) {
	const enabled = buttons.value.filter((button) => button && !button.disabled);
	if (!enabled.length) return;
	const current = buttons.value[index];
	const currentIndex = Math.max(0, enabled.indexOf(current));
	enabled[(currentIndex + direction + enabled.length) % enabled.length]?.focus();
}

/**
 * Handles keyboard selection and roving focus for the group.
 *
 * @param {KeyboardEvent} event Native keyboard event.
 * @param {number} index Current option index.
 * @param {unknown} option Toggle option.
 */
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
			:class="groupClass"
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
