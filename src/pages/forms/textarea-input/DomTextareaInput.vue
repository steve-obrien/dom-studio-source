<script setup>
import { computed } from 'vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';
import { useTextareaAutosize } from './useTextareaAutosize.js';

defineOptions({
	__doc: {
		name: 'Textarea input',
		tag: '<DomTextareaInput>',
		description: 'A multi-line field with shared form state and optional content-driven growth, including an optional maximum row limit.',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired when the text changes.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the textarea receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the textarea loses focus.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	rows: {
		type: Number,
		default: 3,
		_edit: { group: 'Control props', min: 1, description: 'Minimum visible rows, or the fixed row count when autosize is disabled.' },
	},
	autosize: {
		type: Boolean,
		default: false,
		_edit: { group: 'Control props', description: 'Grow and shrink the textarea to match its content.' },
	},
	maxRows: {
		type: Number,
		default: 0,
		_edit: { group: 'Control props', min: 0, description: 'Maximum autosized rows before vertical scrolling begins. Use 0 for no maximum.' },
	},
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-multiline-input' });
const autosize = computed(() => props.autosize);
const rows = computed(() => props.rows);
const maxRows = computed(() => props.maxRows);
const { textarea, resize } = useTextareaAutosize({
	value: field.value,
	autosize,
	rows,
	maxRows,
});

/**
 * Writes native textarea input through the shared field contract and updates
 * its content-driven height in the same frame.
 *
 * @param {InputEvent} event Native input event.
 * @returns {void}
 */
function onInput(event) {
	field.onInput(event.target.value);
	resize();
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<textarea
			ref="textarea"
			:id="field.id.value"
			:name="field.htmlName.value"
			:value="field.value.value"
			:placeholder="placeholder"
			:rows="rows"
			:disabled="field.disabled.value || undefined"
			:readonly="field.readOnly.value || undefined"
			:required="required || undefined"
			:aria-invalid="field.invalid.value || undefined"
			:aria-describedby="field.describedBy.value || undefined"
			:aria-errormessage="field.errorId.value || undefined"
			:data-invalid="field.invalid.value ? '' : undefined"
			:class="['skin-input', autosize && 'resize-none overflow-y-hidden']"
			@input="onInput"
			@focus="field.onFocus"
			@blur="field.onBlur"
		></textarea>
	</DomField>
</template>
