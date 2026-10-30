<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Confirmation code input',
		tag: '<DomConfirmationCodeInput>',
		description: 'A segmented confirmation-code field with one character per box, automatic focus movement, and full-code paste support.',
		icon: 'M4 8h3v3H4V8Zm6 0h3v3h-3V8Zm6 0h3v3h-3V8ZM4 14h3v3H4v-3Zm6 0h3v3h-3v-3Zm6 0h3v3h-3v-3Z',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired whenever the entered code changes.' },
			{ name: 'complete', payload: 'string', description: 'Fired when every character box contains a value.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when focus enters the segmented control.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when focus leaves the segmented control.' },
		],
		keyboard: [
			{ keys: 'Character', action: 'Enter one character and move focus to the next box.' },
			{ keys: 'Backspace', action: 'Clear the current box, or move back and clear the previous box when empty.' },
			{ keys: 'Delete', action: 'Clear the current box.' },
			{ keys: 'Left / Right', action: 'Move between character boxes.' },
			{ keys: 'Home / End', action: 'Move to the first or last character box.' },
			{ keys: 'Paste', action: 'Distribute a complete or partial code across the boxes.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Confirmation code without the visual separator.' },
	},
	length: {
		type: Number,
		default: 6,
		_edit: { group: 'Control props', min: 1, max: 12, description: 'Number of character boxes.' },
	},
	separatorAfter: {
		type: Number,
		default: 3,
		_edit: { group: 'Control props', min: 0, max: 11, description: 'Box position after which to show a visual separator. Use 0 to hide it.' },
	},
	characterSet: {
		type: String,
		default: 'alphanumeric',
		_edit: { group: 'Control props', options: ['alphanumeric', 'numeric'], description: 'Characters accepted by the control.' },
	},
	uppercase: {
		type: Boolean,
		default: true,
		_edit: { group: 'Control props', description: 'Convert entered letters to uppercase.' },
	},
	autocomplete: {
		type: String,
		default: 'one-time-code',
		_edit: { group: 'Control props', description: 'Native autocomplete hint applied to the first box.' },
	},
});

const emit = defineEmits(['update:modelValue', 'complete', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-confirmation-code-input' });
const group = ref(null);
const codeLength = computed(() => Math.min(12, Math.max(1, Math.round(props.length || 6))));
const separatorPosition = computed(() => {
	const requestedPosition = Math.round(props.separatorAfter || 0);
	return requestedPosition > 0 && requestedPosition < codeLength.value ? requestedPosition : 0;
});
const inputMode = computed(() => (props.characterSet === 'numeric' ? 'numeric' : 'text'));
const inputPattern = computed(() => (props.characterSet === 'numeric' ? '[0-9]' : '[A-Za-z0-9]'));
const segments = ref(createSegments(field.value.value));
const code = computed(() => segments.value.join(''));
let lastEmittedValue = sanitizeCode(field.value.value);

watch(field.value, (value) => {
	const normalizedValue = sanitizeCode(value);
	if (normalizedValue === lastEmittedValue) return;
	segments.value = createSegments(normalizedValue);
	lastEmittedValue = normalizedValue;
});

watch(
	[codeLength, () => props.characterSet, () => props.uppercase],
	() => {
		segments.value = createSegments(field.value.value);
		lastEmittedValue = sanitizeCode(field.value.value);
	},
);

/**
 * Removes unsupported characters and applies the configured letter casing.
 *
 * @param {unknown} value Raw code value.
 * @returns {string} Normalized confirmation code.
 */
function sanitizeCode(value) {
	const pattern = props.characterSet === 'numeric' ? /[^0-9]/g : /[^a-z0-9]/gi;
	const normalizedValue = String(value ?? '').replace(pattern, '');
	return (props.uppercase ? normalizedValue.toUpperCase() : normalizedValue).slice(0, codeLength.value);
}

/**
 * Builds the fixed-length character array used by the segmented inputs.
 *
 * @param {unknown} value Raw or normalized code value.
 * @returns {string[]} Character slots padded with empty strings.
 */
function createSegments(value) {
	const nextSegments = Array.from({ length: codeLength.value }, () => '');
	for (const [index, character] of Array.from(sanitizeCode(value)).entries()) {
		nextSegments[index] = character;
	}
	return nextSegments;
}

/**
 * Resolves a character input from its stable data attribute.
 *
 * @param {number} index Zero-based character position.
 * @returns {HTMLInputElement|null} Matching character input.
 */
function inputAt(index) {
	return group.value?.querySelector(`[data-code-index="${index}"]`) || null;
}

/**
 * Moves focus to a character input and selects its existing value.
 *
 * @param {number} index Zero-based character position.
 * @returns {Promise<void>} Promise resolved after Vue updates the inputs.
 */
async function focusInput(index) {
	const boundedIndex = Math.min(codeLength.value - 1, Math.max(0, index));
	await nextTick();
	const input = inputAt(boundedIndex);
	input?.focus();
	input?.select();
}

/**
 * Writes the local character slots through the shared field contract.
 *
 * @returns {void}
 */
function commitCode() {
	const nextCode = code.value;
	lastEmittedValue = nextCode;
	field.onInput(nextCode);
	if (segments.value.every(Boolean)) emit('complete', nextCode);
}

/**
 * Distributes one or more characters from a starting box.
 *
 * @param {string} value Characters to insert.
 * @param {number} startIndex Zero-based insertion position.
 * @returns {void}
 */
function insertCharacters(value, startIndex) {
	const characters = Array.from(sanitizeCode(value));
	if (!characters.length) return;
	const nextSegments = [...segments.value];
	let nextIndex = startIndex;
	for (const character of characters) {
		if (nextIndex >= codeLength.value) break;
		nextSegments[nextIndex] = character;
		nextIndex += 1;
	}
	segments.value = nextSegments;
	commitCode();
	if (nextIndex < codeLength.value) void focusInput(nextIndex);
}

/**
 * Handles native text input, including browser-provided one-time-code values.
 *
 * @param {InputEvent} event Native input event.
 * @param {number} index Zero-based character position.
 * @returns {void}
 */
function onInput(event, index) {
	if (field.disabled.value || field.readOnly.value) return;
	const value = sanitizeCode(event.target.value);
	if (value) {
		insertCharacters(value, index);
		return;
	}
	const nextSegments = [...segments.value];
	nextSegments[index] = '';
	segments.value = nextSegments;
	commitCode();
}

/**
 * Distributes pasted confirmation-code text from the active box.
 *
 * @param {ClipboardEvent} event Native paste event.
 * @param {number} index Zero-based character position.
 * @returns {void}
 */
function onPaste(event, index) {
	if (field.disabled.value || field.readOnly.value) return;
	const value = sanitizeCode(event.clipboardData?.getData('text'));
	if (!value) return;
	event.preventDefault();
	insertCharacters(value, index);
}

/**
 * Applies segmented-input navigation and deletion keys.
 *
 * @param {KeyboardEvent} event Native keyboard event.
 * @param {number} index Zero-based character position.
 * @returns {void}
 */
function onKeydown(event, index) {
	if (field.disabled.value || field.readOnly.value) return;
	if (event.key === 'ArrowLeft') {
		event.preventDefault();
		void focusInput(index - 1);
		return;
	}
	if (event.key === 'ArrowRight') {
		event.preventDefault();
		void focusInput(index + 1);
		return;
	}
	if (event.key === 'Home') {
		event.preventDefault();
		void focusInput(0);
		return;
	}
	if (event.key === 'End') {
		event.preventDefault();
		void focusInput(codeLength.value - 1);
		return;
	}
	if (event.key !== 'Backspace' && event.key !== 'Delete') return;

	event.preventDefault();
	const nextSegments = [...segments.value];
	if (event.key === 'Backspace' && !nextSegments[index] && index > 0) {
		nextSegments[index - 1] = '';
		segments.value = nextSegments;
		commitCode();
		void focusInput(index - 1);
		return;
	}
	nextSegments[index] = '';
	segments.value = nextSegments;
	commitCode();
}

/**
 * Selects a box's current character when it receives focus.
 *
 * @param {FocusEvent} event Native focus event.
 * @returns {void}
 */
function onCellFocus(event) {
	event.target.select();
}

/**
 * Emits one field-level focus event when focus enters the segmented control.
 *
 * @param {FocusEvent} event Native focus-in event.
 * @returns {void}
 */
function onGroupFocus(event) {
	if (!field.focused.value) field.onFocus(event);
}

/**
 * Emits one field-level blur event after focus leaves every character box.
 *
 * @param {FocusEvent} event Native focus-out event.
 * @returns {void}
 */
function onGroupBlur(event) {
	if (group.value?.contains(event.relatedTarget)) return;
	void field.onBlur(event);
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<input
			v-if="field.htmlName.value"
			type="hidden"
			:name="field.htmlName.value"
			:value="code"
		/>
		<div
			ref="group"
			role="group"
			:aria-label="label || 'Confirmation code'"
			:aria-describedby="field.describedBy.value || undefined"
			:aria-errormessage="field.errorId.value || undefined"
			:aria-invalid="field.invalid.value || undefined"
			:data-invalid="field.invalid.value ? '' : undefined"
			class="flex w-fit max-w-full items-center gap-1.5"
			@focusin="onGroupFocus"
			@focusout="onGroupBlur"
		>
			<template v-for="(_, index) in segments" :key="index">
				<input
					:id="index === 0 ? field.id.value : `${field.id.value}-${index + 1}`"
					type="text"
					:value="segments[index]"
					:inputmode="inputMode"
					:pattern="inputPattern"
					:maxlength="index === 0 ? codeLength : 1"
					:autocomplete="index === 0 ? autocomplete : 'off'"
					:autocapitalize="uppercase ? 'characters' : 'off'"
					:disabled="field.disabled.value || undefined"
					:readonly="field.readOnly.value || undefined"
					:required="required || undefined"
					:aria-label="`Character ${index + 1} of ${codeLength}`"
					:aria-invalid="field.invalid.value || undefined"
					:aria-describedby="field.describedBy.value || undefined"
					:aria-errormessage="field.errorId.value || undefined"
					:data-code-index="index"
					:data-invalid="field.invalid.value ? '' : undefined"
					:spellcheck="false"
					class="skin-input size-11 max-w-11 flex-none px-0 py-0 text-center font-mono text-lg font-semibold tracking-wide sm:size-12 sm:max-w-12"
					@focus="onCellFocus"
					@input="onInput($event, index)"
					@keydown="onKeydown($event, index)"
					@paste="onPaste($event, index)"
				/>
				<span
					v-if="separatorPosition && index + 1 === separatorPosition"
					class="mx-0.5 text-sm font-semibold text-muted-fg"
					aria-hidden="true"
				>
					-
				</span>
			</template>
		</div>
	</DomField>
</template>
