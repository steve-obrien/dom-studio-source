<script setup>
import { computed } from 'vue';
import DomIconButton from '../../components/icon-button/DomIconButton.vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';
import { useTextareaAutosize } from '../textarea-input/useTextareaAutosize.js';

defineOptions({
	__doc: {
		name: 'Textarea composer',
		tag: '<DomTextareaComposer>',
		description: 'An autosizing multiline field with attachment content, leading controls, trailing actions, and submit behavior inside one visual input.',
		icon: 'M5 6h14v10H9l-4 3V6Zm3 4h8M8 13h5',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired when the composer text changes.' },
			{ name: 'submit', payload: 'string', description: 'Fired with the current text when the built-in submit action is used.' },
			{ name: 'keydown', payload: 'KeyboardEvent', description: 'Fired before the built-in Enter key behavior runs.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the textarea receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the textarea loses focus.' },
		],
		slots: [
			{ name: 'attachments', payload: '{ value, disabled, readOnly }', description: 'File, image, reference, or context previews shown above the text.' },
			{ name: 'leading', payload: '{ value, submit, disabled }', description: 'Controls at the start of the bottom action row, such as add or tool buttons.' },
			{ name: 'actions', payload: '{ value, submit, disabled }', description: 'Additional controls before the built-in submit action.' },
			{ name: 'submit', payload: '{ submit, disabled, submitting, label }', description: 'Replace the built-in circular submit button.' },
		],
		keyboard: [
			{ keys: 'Enter', action: 'Submit when submitOnEnter is enabled.' },
			{ keys: 'Shift + Enter', action: 'Insert a new line.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	rows: {
		type: Number,
		default: 1,
		_edit: { group: 'Control props', min: 1, description: 'Minimum visible text rows.' },
	},
	autosize: {
		type: Boolean,
		default: true,
		_edit: { group: 'Control props', description: 'Grow and shrink the text area to match its content.' },
	},
	maxRows: {
		type: Number,
		default: 8,
		_edit: { group: 'Control props', min: 0, description: 'Maximum rows before text scrolls. Use 0 for no maximum.' },
	},
	ariaLabel: {
		type: String,
		default: 'Message',
		_edit: { group: 'Control props', description: 'Accessible textarea label used when no visible field label is supplied.' },
	},
	showSubmit: {
		type: Boolean,
		default: true,
		_edit: { group: 'Submit props', description: 'Show the built-in circular submit action.' },
	},
	submitLabel: {
		type: String,
		default: 'Send message',
		_edit: { group: 'Submit props', description: 'Accessible label for the built-in submit action.' },
	},
	submitDisabled: {
		type: Boolean,
		default: false,
		_edit: { group: 'Submit props', description: 'Disable submission in addition to field and empty-value checks.' },
	},
	submitting: {
		type: Boolean,
		default: false,
		_edit: { group: 'Submit props', description: 'Show progress and block repeated submission.' },
	},
	submitOnEnter: {
		type: Boolean,
		default: true,
		_edit: { group: 'Submit props', description: 'Submit on Enter while Shift + Enter continues to add a new line.' },
	},
	allowEmptySubmit: {
		type: Boolean,
		default: false,
		_edit: { group: 'Submit props', description: 'Allow attachment-only or control-defined submission when the text is empty.' },
	},
});
const emit = defineEmits(['update:modelValue', 'submit', 'keydown', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-textarea-composer' });
const autosize = computed(() => props.autosize);
const rows = computed(() => props.rows);
const maxRows = computed(() => props.maxRows);
const text = computed(() => String(field.value.value ?? ''));
const controlsDisabled = computed(() => (
	field.disabled.value
	|| field.readOnly.value
	|| props.submitting
));
const canSubmit = computed(() => (
	!controlsDisabled.value
	&& !props.submitDisabled
	&& (props.allowEmptySubmit || text.value.trim().length > 0)
));
const { textarea, resize } = useTextareaAutosize({
	value: field.value,
	autosize,
	rows,
	maxRows,
});

/**
 * Writes native composer input through the shared form-field contract.
 *
 * @param {InputEvent} event Native input event.
 * @returns {void}
 */
function onInput(event) {
	field.onInput(event.target.value);
	resize();
}

/**
 * Emits the current value when submission is available.
 *
 * @param {Event} [event] Native keyboard or click event that requested submission.
 * @returns {void}
 */
function submit(event) {
	if (!canSubmit.value) return;
	emit('submit', text.value, event);
}

/**
 * Exposes keyboard activity and applies the composer Enter convention.
 *
 * @param {KeyboardEvent} event Native keydown event.
 * @returns {void}
 */
function onKeydown(event) {
	emit('keydown', event);
	if (
		event.defaultPrevented
		|| !props.submitOnEnter
		|| event.isComposing
		|| event.key !== 'Enter'
		|| event.shiftKey
	) return;
	event.preventDefault();
	submit(event);
}

/**
 * Moves focus to the native textarea.
 *
 * @returns {void}
 */
function focus() {
	textarea.value?.focus();
}

defineExpose({ focus, resize });
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<div
			class="skin-input overflow-hidden p-0 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 data-[invalid]:focus-within:border-destructive data-[invalid]:focus-within:ring-destructive/25"
			:data-invalid="field.invalid.value ? '' : undefined"
			:aria-busy="submitting || undefined"
		>
			<div v-if="$slots.attachments" class="flex flex-wrap gap-2 px-3 pt-3">
				<slot
					name="attachments"
					:value="text"
					:disabled="field.disabled.value"
					:read-only="field.readOnly.value"
				/>
			</div>

			<textarea
				ref="textarea"
				:id="field.id.value"
				:name="field.htmlName.value"
				:value="text"
				:placeholder="placeholder"
				:rows="rows"
				:disabled="field.disabled.value || undefined"
				:readonly="field.readOnly.value || undefined"
				:required="required || undefined"
				:aria-label="label ? undefined : ariaLabel"
				:aria-invalid="field.invalid.value || undefined"
				:aria-describedby="field.describedBy.value || undefined"
				:aria-errormessage="field.errorId.value || undefined"
				:class="[
					'block w-full border-0 bg-transparent px-3 pb-2 pt-3 text-base leading-6 text-canvas-fg outline-none placeholder:text-muted-fg disabled:cursor-not-allowed disabled:opacity-50',
					autosize ? 'resize-none overflow-y-hidden' : 'resize-y',
				]"
				@input="onInput"
				@keydown="onKeydown"
				@focus="field.onFocus"
				@blur="field.onBlur"
			></textarea>

			<div
				v-if="$slots.leading || $slots.actions || showSubmit"
				class="flex min-h-10 items-end justify-between gap-2 px-2 pb-2"
			>
				<div class="flex min-w-0 flex-1 items-center gap-1">
					<slot name="leading" :value="text" :submit="submit" :disabled="controlsDisabled" />
				</div>
				<div class="flex shrink-0 items-center gap-1">
					<slot name="actions" :value="text" :submit="submit" :disabled="controlsDisabled" />
					<slot
						v-if="showSubmit"
						name="submit"
						:submit="submit"
						:disabled="!canSubmit"
						:submitting="submitting"
						:label="submitLabel"
					>
						<DomIconButton
							:label="submitLabel"
							:disabled="!canSubmit"
							:loading="submitting"
							variant="primary"
							icon="M12 19V5m0 0-6 6m6-6 6 6"
							@click="submit"
						/>
					</slot>
				</div>
			</div>
		</div>
	</DomField>
</template>
