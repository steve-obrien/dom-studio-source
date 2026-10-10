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

export const calendarEditorDefinitions = {
	locale: {
		type: String,
		default: 'en-GB',
		_edit: { description: 'Locale used for month and weekday labels.' },
	},
	weekStartsOn: {
		type: Number,
		default: 1,
		_edit: { options: [0, 1, 2, 3, 4, 5, 6], description: 'First day of week. 0 is Sunday, 1 is Monday.' },
	},
	initialMonth: {
		type: Number,
		default: null,
		_edit: { description: 'Initial visible month, 1-12. Ignored when modelValue has a valid date.' },
	},
	initialYear: {
		type: Number,
		default: null,
		_edit: { description: 'Initial visible year. Ignored when modelValue has a valid date.' },
	},
	min: {
		type: String,
		default: '',
		_edit: { description: 'Minimum selectable date as YYYY-MM-DD.' },
	},
	max: {
		type: String,
		default: '',
		_edit: { description: 'Maximum selectable date as YYYY-MM-DD.' },
	},
	showAdjacentDays: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show dates from the previous and next months in the grid.' },
	},
	fixedWeeks: {
		type: Boolean,
		default: true,
		_edit: { description: 'Always render six weeks so the calendar height stays stable.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Disable date selection.' },
	},
};

export const dateTimePickerProps = {
	...fieldProps,
	modelValue: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Selected date and time as YYYY-MM-DDTHH:mm, or YYYY-MM-DDTHH:mm:ss when showSeconds is enabled.' },
	},
	dateFormat: {
		type: String,
		default: 'dd/mm/yyyy',
		_edit: { options: ['dd/mm/yyyy', 'mm/dd/yyyy'], description: 'How typed dates are parsed and displayed.' },
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
		_edit: { group: 'Control props', description: 'Minute interval used to generate time options.' },
	},
	defaultTime: {
		type: String,
		default: '09:00',
		_edit: { group: 'Control props', description: 'Time used when a date is selected before the user has chosen a time.' },
	},
	min: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Minimum selectable date-time as YYYY-MM-DDTHH:mm.' },
	},
	max: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Maximum selectable date-time as YYYY-MM-DDTHH:mm.' },
	},
	timeOptions: {
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
	popoverProps: {
		type: Object,
		default: () => ({}),
		_edit: {
			component: 'DomPropDefinitionInput',
			description: 'Props passed to the inner DomPopover. Date time picker defaults position to bottom-end, max width to 34rem, padding to p-0, and arrow to true.',
			props: {
				definitions: popoverEditorDefinitions,
				include: ['position', 'offset', 'collisionPadding', 'floatingMode', 'flip', 'lockScroll', 'arrow', 'width', 'padding'],
				compact: true,
			},
		},
	},
	calendarProps: {
		type: Object,
		default: () => ({}),
		_edit: {
			component: 'DomPropDefinitionInput',
			description: 'Props passed to the inner DomCalendar, such as locale, weekStartsOn, min, max, fixedWeeks, and showAdjacentDays.',
			props: {
				definitions: calendarEditorDefinitions,
				include: ['locale', 'weekStartsOn', 'initialMonth', 'initialYear', 'min', 'max', 'showAdjacentDays', 'fixedWeeks', 'disabled'],
				compact: true,
			},
		},
	},
};
</script>

<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import DomPopover, { popoverProps } from '../../components/popover/DomPopover.vue';
import DomCalendar, { calendarProps } from '../calendar/DomCalendar.vue';
import DomField from '../field/DomField.vue';
import { useField } from '../field/useField.js';
import {
	buildTimeOptions,
	compareTimeValues,
	formatTimeDisplay,
	normalizeTimeValue,
	parseTimeInput,
	timeToSeconds,
} from '../time-selector/timeUtils.js';

defineOptions({
	__doc: {
		name: 'Date time picker',
		tag: '<DomDateTimePicker>',
		description: 'A typed date and time input with a popover calendar and time selector. Stores a local YYYY-MM-DDTHH:mm value.',
		icon: 'M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm7 7v3l2 1',
		events: [
			{ name: 'update:modelValue', payload: 'YYYY-MM-DDTHH:mm', description: 'Fired when a valid date-time is typed or selected.' },
			{ name: 'change', payload: 'YYYY-MM-DDTHH:mm', description: 'Fired when a valid date-time is committed.' },
			{ name: 'invalid-date-time', payload: 'string', description: 'Fired when typed text cannot be parsed or is outside the allowed range.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the text input receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the text input loses focus.' },
		],
		keyboard: [
			{ keys: 'Alt + ArrowDown', action: 'Open the calendar and time popover.' },
			{ keys: 'Enter', action: 'Commit the typed date-time when it is valid.' },
			{ keys: 'Esc', action: 'Close the popover.' },
			{ keys: 'Arrow keys in calendar', action: 'Move focus by day or week once the calendar is open.' },
			{ keys: 'Tab', action: 'Move through generated time options.' },
		],
	},
});

const props = defineProps(dateTimePickerProps);
const emit = defineEmits(['update:modelValue', 'change', 'invalid-date-time', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-date-time-picker' });
const popover = ref(null);
const calendar = ref(null);
const displayValue = ref(formatDisplay(field.value.value));
const parseError = ref('');
const optionRefs = new Map();
const uniqueId = useId();
const triggerId = computed(() => `${field.id.value || uniqueId}-date-time-button`);
const selectedParts = computed(() => splitDateTime(field.value.value));
const selectedDate = computed(() => selectedParts.value?.date || '');
const selectedTime = computed(() => selectedParts.value?.time || normalizeTimeValue(props.defaultTime, props) || '09:00');
const placeholderText = computed(() => props.placeholder || `${props.dateFormat} ${props.timeFormat === '12h' ? '9:30 AM' : props.showSeconds ? '09:30:00' : '09:30'}`);
const resolvedCalendarProps = computed(() => ({
	...defaultPropsFrom(calendarProps),
	...props.calendarProps,
	modelValue: selectedDate.value,
	min: props.calendarProps.min || datePart(props.min),
	max: props.calendarProps.max || datePart(props.max),
	disabled: field.disabled.value || props.calendarProps.disabled,
	chrome: 'none',
	registerField: false,
	nativeInput: false,
}));
const resolvedPopoverProps = computed(() => ({
	...defaultPropsFrom(popoverProps),
	position: 'bottom-end',
	width: 'w-[calc(100vw-1rem)] max-w-[34rem]',
	padding: 'p-0',
	arrow: true,
	...props.popoverProps,
	triggerId: triggerId.value,
}));
const timeOptions = computed(() => buildTimeOptions({
	options: props.timeOptions,
	minuteStep: props.minuteStep,
	min: minTimeForDate(selectedDate.value),
	max: maxTimeForDate(selectedDate.value),
	timeFormat: props.timeFormat,
	showSeconds: props.showSeconds,
}).map((option) => ({
	...option,
	disabled: option.disabled || Boolean(selectedDate.value && !isDateTimeInRange(combineDateTime(selectedDate.value, option.value))),
})));
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
const inputAttrs = computed(() => ({
	...field.inputAttrs.value,
	value: displayValue.value,
	placeholder: placeholderText.value,
	'aria-invalid': invalid.value || undefined,
	'data-invalid': invalid.value ? '' : undefined,
}));

watch(field.value, (value) => {
	displayValue.value = formatDisplay(value);
	if (isDateTimeValue(value)) clearParseError();
});

watch(() => [props.dateFormat, props.timeFormat, props.showSeconds], () => {
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

function pad(value) {
	return String(value).padStart(2, '0');
}

function isIsoDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isoToParts(value) {
	if (!isIsoDate(value)) return null;
	const [year, month, day] = value.split('-').map(Number);
	return { year, month, day };
}

function partsToIso({ year, month, day }) {
	return `${year}-${pad(month)}-${pad(day)}`;
}

function formatDateDisplay(value) {
	const parts = isoToParts(value);
	if (!parts) return '';
	if (props.dateFormat === 'mm/dd/yyyy') return `${pad(parts.month)}/${pad(parts.day)}/${parts.year}`;
	return `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`;
}

function parseDateDisplay(value) {
	const trimmed = String(value || '').trim();
	if (!trimmed) return { value: '', error: '' };
	const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (isoMatch) {
		const iso = trimmed;
		return isIsoDate(iso) ? { value: iso, error: '' } : { value: '', error: 'Enter a real calendar date.' };
	}
	const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!match) return { value: '', error: `Use ${props.dateFormat}.` };
	const first = Number(match[1]);
	const second = Number(match[2]);
	const year = Number(match[3]);
	const month = props.dateFormat === 'mm/dd/yyyy' ? first : second;
	const day = props.dateFormat === 'mm/dd/yyyy' ? second : first;
	const iso = partsToIso({ year, month, day });
	if (!isIsoDate(iso)) return { value: '', error: 'Enter a real calendar date.' };
	return { value: iso, error: '' };
}

function normalizeDateTimeValue(value) {
	const parts = splitDateTime(value);
	if (!parts) return '';
	return combineDateTime(parts.date, parts.time);
}

function isDateTimeValue(value) {
	return normalizeDateTimeValue(value) === value;
}

function splitDateTime(value) {
	const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/);
	if (!match) return null;
	const date = match[1];
	const time = normalizeTimeValue(match[2], { showSeconds: props.showSeconds });
	if (!isIsoDate(date) || !time) return null;
	return { date, time };
}

function combineDateTime(date, time) {
	const normalizedTime = normalizeTimeValue(time, { showSeconds: props.showSeconds });
	if (!isIsoDate(date) || !normalizedTime) return '';
	return `${date}T${normalizedTime}`;
}

function datePart(value) {
	const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
	return match && isIsoDate(match[1]) ? match[1] : '';
}

function timePart(value) {
	const match = String(value || '').match(/[T ](\d{2}:\d{2}(?::\d{2})?)$/);
	return match ? normalizeTimeValue(match[1], { showSeconds: props.showSeconds }) : '';
}

function minTimeForDate(date) {
	return date && date === datePart(props.min) ? timePart(props.min) : '';
}

function maxTimeForDate(date) {
	return date && date === datePart(props.max) ? timePart(props.max) : '';
}

function isDateTimeInRange(value) {
	const normalized = normalizeDateTimeValue(value);
	if (!normalized) return false;
	const min = normalizeDateTimeValue(props.min);
	const max = normalizeDateTimeValue(props.max);
	if (min && normalized < min) return false;
	if (max && normalized > max) return false;
	return true;
}

function rangeError(value) {
	const min = normalizeDateTimeValue(props.min);
	const max = normalizeDateTimeValue(props.max);
	if (min && value < min) return `Date and time must be on or after ${formatDisplay(min)}.`;
	if (max && value > max) return `Date and time must be on or before ${formatDisplay(max)}.`;
	return '';
}

function formatDisplay(value) {
	const parts = splitDateTime(value);
	if (!parts) return '';
	return `${formatDateDisplay(parts.date)} ${formatTimeDisplay(parts.time, props)}`;
}

function parseDisplay(value) {
	const trimmed = String(value || '').trim();
	if (!trimmed) return { value: '', error: '' };
	const normalized = normalizeDateTimeValue(trimmed);
	if (normalized) {
		const error = rangeError(normalized);
		return error ? { value: '', error } : { value: normalized, error: '' };
	}

	const [dateText, ...timeTokens] = trimmed.split(/\s+/);
	const timeText = timeTokens.join(' ');
	if (!dateText || !timeText) return { value: '', error: `Use ${props.dateFormat} plus a time.` };
	const parsedDate = parseDateDisplay(dateText);
	if (parsedDate.error) return { value: '', error: parsedDate.error };
	const parsedTime = parseTimeInput(timeText, props);
	if (parsedTime.error) return { value: '', error: parsedTime.error };
	const nextValue = combineDateTime(parsedDate.value, parsedTime.value);
	const error = rangeError(nextValue);
	return error ? { value: '', error } : { value: nextValue, error: '' };
}

function clearParseError() {
	parseError.value = '';
	field.setFieldState({ errors: [], invalid: false });
}

function setParseError(message) {
	parseError.value = message;
	field.setFieldState({ errors: message ? [message] : [], invalid: Boolean(message) });
	if (message) emit('invalid-date-time', message);
}

function commitDateTime(value) {
	const normalized = normalizeDateTimeValue(value);
	const error = normalized ? rangeError(normalized) : '';
	if (error) {
		setParseError(error);
		return false;
	}
	clearParseError();
	field.setValue(normalized);
	displayValue.value = formatDisplay(normalized);
	emit('change', normalized);
	return true;
}

function commitTypedValue() {
	const parsed = parseDisplay(displayValue.value);
	if (parsed.error) {
		setParseError(parsed.error);
		return false;
	}
	commitDateTime(parsed.value);
	return true;
}

function onInput(event) {
	displayValue.value = event.target.value;
	if (!displayValue.value.trim()) commitDateTime('');
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
			commitDateTime(parsed.value);
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

function constrainedTimeForDate(date, preferredTime) {
	const preferred = normalizeTimeValue(preferredTime, { showSeconds: props.showSeconds }) || normalizeTimeValue(props.defaultTime, props) || '09:00';
	const min = minTimeForDate(date);
	const max = maxTimeForDate(date);
	if (min && compareTimeValues(preferred, min) < 0) return min;
	if (max && compareTimeValues(preferred, max) > 0) return max;
	return preferred;
}

function selectCalendarDate(value) {
	const time = constrainedTimeForDate(value, selectedTime.value);
	commitDateTime(combineDateTime(value, time));
}

function selectTime(option) {
	if (option.disabled) return;
	const date = selectedDate.value || todayValue();
	const time = constrainedTimeForDate(date, option.value);
	commitDateTime(combineDateTime(date, time));
}

function setOptionRef(value, element) {
	if (element) optionRefs.set(value, element);
	else optionRefs.delete(value);
}

/**
 * Focus the calendar and reveal the selected time after the popover is laid out.
 * Scroll only the time list so opening the picker does not move the page.
 * @returns {Promise<void>}
 */
async function onPopoverOpen() {
	await nextTick();
	await calendar.value?.focusSelectedDate?.();
	const selectedOption = timeOptions.value.find((option) => selectedTimeSeconds(option.value) === selectedTimeSeconds(selectedTime.value));
	const option = optionRefs.get(selectedOption?.value);
	const list = option?.parentElement;
	if (!option || !list || !list.clientHeight) return;

	const optionTop = option.offsetTop;
	const optionBottom = optionTop + option.offsetHeight;
	if (optionTop < list.scrollTop) list.scrollTop = optionTop;
	else if (optionBottom > list.scrollTop + list.clientHeight) list.scrollTop = optionBottom - list.clientHeight;
}

function todayValue() {
	const now = new Date();
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function selectedTimeSeconds(value) {
	const seconds = timeToSeconds(value);
	return Number.isFinite(seconds) ? seconds : -1;
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
				:aria-label="`Choose date and time for ${props.label || field.name.value}`"
				@click.stop
				@focus="field.onFocus"
				@blur="field.onBlur"
			>
				<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
					<path d="M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm7 7v3l2 1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
		</div>

		<DomPopover
			ref="popover"
			v-bind="resolvedPopoverProps"
			@open="onPopoverOpen"
		>
			<div class="grid max-h-[calc(100vh-1rem)] gap-0 overflow-auto md:grid-cols-[20rem_14rem]">
				<DomCalendar
					ref="calendar"
					v-bind="resolvedCalendarProps"
					@change="selectCalendarDate"
				/>

				<div class="border-t border-border p-3 md:border-l md:border-t-0">
					<div class="mb-2 flex items-center justify-between gap-3">
						<p class="text-sm font-semibold text-canvas-fg">Time</p>
						<p class="text-xs text-muted-fg">{{ selectedTime ? formatTimeDisplay(selectedTime, props) : 'Choose time' }}</p>
					</div>
					<div class="relative grid max-h-72 grid-cols-2 gap-1 overflow-auto pr-1" role="listbox" :aria-label="`${props.label || 'Date time'} time options`">
						<button
							v-for="option in timeOptions"
							:key="option.value"
							:ref="(element) => setOptionRef(option.value, element)"
							type="button"
							role="option"
							class="rounded-md px-2.5 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40"
							:class="selectedTimeSeconds(option.value) === selectedTimeSeconds(selectedTime) ? 'bg-primary text-primary-fg' : 'text-canvas-fg hover:bg-secondary'"
							:aria-selected="selectedTimeSeconds(option.value) === selectedTimeSeconds(selectedTime)"
							:disabled="option.disabled"
							@click="selectTime(option)"
						>
							{{ option.label }}
						</button>
					</div>
				</div>
			</div>
		</DomPopover>
	</DomField>
</template>
