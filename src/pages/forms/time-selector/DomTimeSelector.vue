<script>
import { fieldProps } from '../field/fieldProps.js';

export const popoverEditorDefinitions = {
	position: {
		type: String,
		default: 'bottom-start',
		_edit: {
			component: 'DomPositionInput',
			props: { label: 'Position' },
			description: 'Preferred side and alignment around the trigger.',
		},
	},
	offset: {
		type: Number,
		default: 8,
		_edit: { description: 'Gap in pixels between the trigger and the popover.' },
	},
	collisionPadding: {
		type: Number,
		default: 8,
		_edit: { description: 'Viewport padding used when the panel flips or shifts.' },
	},
	floatingMode: {
		type: String,
		default: 'viewport',
		_edit: { options: ['viewport', 'anchor'], description: 'viewport keeps the panel inside the browser; anchor keeps it attached while scrolling.' },
	},
	flip: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow the popover to flip to the opposite side when it would collide with the viewport.' },
	},
	lockScroll: {
		type: Boolean,
		default: false,
		_edit: { description: 'Lock browser scrolling while the popover is open.' },
	},
	arrow: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show a small arrow pointing back to the trigger.' },
	},
	width: {
		type: String,
		default: 'min-w-[14rem] max-w-[20rem]',
		_edit: { description: 'Tailwind width utility(ies) for the panel.' },
	},
	padding: {
		type: String,
		default: 'p-4',
		_edit: { description: 'Tailwind padding utility for the panel.' },
	},
};

export const timeSelectorProps = {
	...fieldProps,
	modelValue: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Selected time as HH:mm, or HH:mm:ss when showSeconds is enabled.' },
	},
	timeFormat: {
		type: String,
		default: '24h',
		validator: (value) => ['24h', '12h'].includes(value),
		_edit: { options: ['24h', '12h'], description: 'How times are displayed in the input and option list.' },
	},
	minuteStep: {
		type: Number,
		default: 15,
		_edit: { group: 'Control props', description: 'Minute interval used to generate selectable options.' },
	},
	min: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Minimum selectable time as HH:mm or HH:mm:ss.' },
	},
	max: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Maximum selectable time as HH:mm or HH:mm:ss.' },
	},
	options: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			group: 'Control props',
			description: 'Optional custom time options. Use strings such as 09:30 or records with value, label, and disabled.',
			props: {
				compact: true,
				schema: [
					{ key: 'value', label: 'Value', placeholder: '09:30' },
					{ key: 'label', label: 'Label', placeholder: '9:30 AM' },
					{ key: 'disabled', label: 'Disabled', type: 'boolean' },
				],
			},
		},
	},
	showSeconds: {
		type: Boolean,
		default: false,
		_edit: { group: 'Control props', description: 'Store and display seconds in addition to hours and minutes.' },
	},
	nativeInput: {
		type: Boolean,
		default: true,
		_edit: { description: 'Include the native input name for HTML form submission.' },
	},
	registerField: {
		type: Boolean,
		default: true,
		_edit: { description: 'Register with a parent form. Disable when composing this inside another form control.' },
	},
	popoverProps: {
		type: Object,
		default: () => ({}),
		_edit: {
			component: 'DomPropDefinitionInput',
			description: 'Props passed to the inner DomPopover. Time selector defaults position to bottom-end, max width to 18rem, padding to p-2, and arrow to true.',
			props: {
				definitions: popoverEditorDefinitions,
				include: ['position', 'offset', 'collisionPadding', 'floatingMode', 'flip', 'lockScroll', 'arrow', 'width', 'padding'],
				compact: true,
			},
		},
	},
};
</script>

<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import DomPopover, { popoverProps } from '../../components/popover/DomPopover.vue';
import DomField from '../field/DomField.vue';
import { useField } from '../field/useField.js';
import {
	buildTimeOptions,
	formatTimeDisplay,
	normalizeTimeValue,
	parseTimeInput,
	timeRangeError,
} from './timeUtils.js';

defineOptions({
	__doc: {
		name: 'Time selector',
		tag: '<DomTimeSelector>',
		description: 'A typed time field with a popover list of selectable times. Stores HH:mm by default and can display 12-hour or 24-hour labels.',
		icon: 'M12 6v6l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
		events: [
			{ name: 'update:modelValue', payload: 'HH:mm', description: 'Fired when a valid time is committed or selected.' },
			{ name: 'change', payload: 'HH:mm', description: 'Fired when a valid time is committed.' },
			{ name: 'invalid-time', payload: 'string', description: 'Fired when typed text cannot be parsed or is outside the allowed range.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the text input receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the text input loses focus.' },
		],
		keyboard: [
			{ keys: 'Alt + ArrowDown', action: 'Open the time list.' },
			{ keys: 'Enter', action: 'Commit the typed time when it is valid.' },
			{ keys: 'Esc', action: 'Close the popover.' },
			{ keys: 'Tab', action: 'Move through generated time options when the list is open.' },
		],
	},
});

const props = defineProps(timeSelectorProps);
const emit = defineEmits(['update:modelValue', 'change', 'invalid-time', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-time-selector', register: props.registerField });
const popover = ref(null);
const displayValue = ref(formatDisplay(field.value.value));
const parseError = ref('');
const optionRefs = new Map();
const uniqueId = useId();
const triggerId = computed(() => `${field.id.value || uniqueId}-time-button`);
const listId = computed(() => `${field.id.value || uniqueId}-time-list`);
const placeholderText = computed(() => props.placeholder || (props.timeFormat === '12h' ? '9:30 AM' : props.showSeconds ? '09:30:00' : '09:30'));
const selectionOptions = computed(() => buildTimeOptions({
	options: props.options,
	minuteStep: props.minuteStep,
	min: props.min,
	max: props.max,
	timeFormat: props.timeFormat,
	showSeconds: props.showSeconds,
}));
const selectedTime = computed(() => normalizeTimeValue(field.value.value, { showSeconds: props.showSeconds }));
const resolvedPopoverProps = computed(() => ({
	...defaultPropsFrom(popoverProps),
	position: 'bottom-end',
	width: 'w-[calc(100vw-1rem)] max-w-[18rem]',
	padding: 'p-2',
	arrow: true,
	...props.popoverProps,
	triggerId: triggerId.value,
}));
const combinedErrors = computed(() => [
	...field.errors.value,
	...(parseError.value ? [parseError.value] : []),
]);
const invalid = computed(() => Boolean(field.invalid.value || parseError.value));
const fieldAttrs = computed(() => ({
	...field.fieldAttrs.value,
	invalid: invalid.value,
	errors: combinedErrors.value,
}));
const inputAttrs = computed(() => {
	const attrs = {
		...field.inputAttrs.value,
		value: displayValue.value,
		placeholder: placeholderText.value,
		'aria-invalid': invalid.value || undefined,
		'aria-controls': listId.value,
		'data-invalid': invalid.value ? '' : undefined,
	};
	if (!props.nativeInput) delete attrs.name;
	return attrs;
});

watch(field.value, (value) => {
	displayValue.value = formatDisplay(value);
	if (normalizeTimeValue(value, { showSeconds: props.showSeconds })) clearParseError();
});

watch(() => [props.timeFormat, props.showSeconds], () => {
	displayValue.value = formatDisplay(field.value.value);
});

function defaultPropsFrom(definitions) {
	return Object.fromEntries(Object.entries(definitions).map(([key, definition]) => [key, defaultPropValue(definition)]));
}

function defaultPropValue(definition) {
	if (!definition || !Object.prototype.hasOwnProperty.call(definition, 'default')) {
		return definition?.type === Boolean ? false : undefined;
	}
	if (typeof definition.default === 'function' && definition.type !== Function) return definition.default();
	return definition.default;
}

function formatDisplay(value) {
	const normalized = normalizeTimeValue(value, { showSeconds: props.showSeconds });
	return normalized ? formatTimeDisplay(normalized, props) : '';
}

function clearParseError() {
	parseError.value = '';
	field.setFieldState({ errors: [], invalid: false });
}

function setParseError(message) {
	parseError.value = message;
	field.setFieldState({ errors: message ? [message] : [], invalid: Boolean(message) });
	if (message) emit('invalid-time', message);
}

function parseDisplay(value) {
	const parsed = parseTimeInput(value, props);
	if (parsed.error) return parsed;
	const rangeError = timeRangeError(parsed.value, props);
	if (rangeError) return { value: '', error: rangeError };
	return parsed;
}

function commitTime(value) {
	clearParseError();
	field.setValue(value);
	displayValue.value = formatDisplay(value);
	emit('change', value);
}

function commitTypedValue() {
	const parsed = parseDisplay(displayValue.value);
	if (parsed.error) {
		setParseError(parsed.error);
		return false;
	}
	commitTime(parsed.value);
	return true;
}

function onInput(event) {
	displayValue.value = event.target.value;
	if (!displayValue.value.trim()) commitTime('');
	else parseError.value = '';
}

async function onBlur(event) {
	let errorMessage = '';
	if (displayValue.value.trim()) {
		const parsed = parseDisplay(displayValue.value);
		if (parsed.error) {
			errorMessage = parsed.error;
			parseError.value = parsed.error;
		} else {
			commitTime(parsed.value);
		}
	} else {
		clearParseError();
	}
	await field.onBlur(event);
	if (errorMessage) setParseError(errorMessage);
}

function onKeydown(event) {
	if (event.key === 'Enter') {
		event.preventDefault();
		commitTypedValue();
	} else if (event.key === 'ArrowDown' && event.altKey) {
		event.preventDefault();
		popover.value?.open();
	} else if (event.key === 'Escape') {
		popover.value?.close();
	}
}

function selectTime(option) {
	if (option.disabled) return;
	commitTime(option.value);
	popover.value?.close();
}

function setOptionRef(value, element) {
	if (element) optionRefs.set(value, element);
	else optionRefs.delete(value);
}

async function focusSelectedOption() {
	await nextTick();
	const selected = selectedTime.value && optionRefs.get(selectedTime.value);
	const first = selectionOptions.value.find((option) => !option.disabled);
	(selected || optionRefs.get(first?.value))?.focus?.();
}
</script>

<template>
	<DomField v-bind="fieldAttrs" :chrome="chrome">
		<div class="relative w-full">
			<input
				v-bind="inputAttrs"
				type="text"
				inputmode="numeric"
				autocomplete="off"
				class="skin-input h-10 pr-11"
				@input="onInput"
				@focus="field.onFocus"
				@blur="onBlur"
				@keydown="onKeydown"
			/>
			<button
				:id="triggerId"
				type="button"
				class="absolute inset-y-1 right-1 grid size-8 cursor-pointer place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
				:disabled="field.disabled.value || field.readOnly.value"
				:aria-label="`Choose time for ${props.label || field.name.value}`"
				@click.stop
				@focus="field.onFocus"
				@blur="field.onBlur"
			>
				<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
					<path d="M12 6v6l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
		</div>

		<DomPopover
			ref="popover"
			v-bind="resolvedPopoverProps"
			@open="focusSelectedOption"
		>
			<div :id="listId" class="max-h-72 overflow-auto p-1" role="listbox" :aria-label="props.label || 'Time options'">
				<button
					v-for="option in selectionOptions"
					:key="option.value"
					:ref="(element) => setOptionRef(option.value, element)"
					type="button"
					role="option"
					class="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40"
					:class="option.value === selectedTime ? 'bg-primary text-primary-fg' : 'text-canvas-fg hover:bg-secondary'"
					:aria-selected="option.value === selectedTime"
					:disabled="option.disabled"
					@click="selectTime(option)"
				>
					<span class="font-medium">{{ option.label }}</span>
					<span v-if="option.description" class="text-xs opacity-70">{{ option.description }}</span>
				</button>
			</div>
		</DomPopover>
	</DomField>
</template>
