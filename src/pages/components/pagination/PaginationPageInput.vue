<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import DomButton from '../button/DomButton.vue';
import DomField from '../../forms/field/DomField.vue';
import NumberInputControl from '../../forms/number-input/NumberInputControl.vue';

const props = defineProps({
	page: { type: Number, required: true },
	pageCount: { type: Number, required: true },
	disabled: { type: Boolean, default: false },
	inline: { type: Boolean, default: false },
});
const emit = defineEmits(['submit', 'cancel']);
const inputId = useId();
const input = ref(null);
const draft = ref(String(props.page));
const error = ref('');

/** Sizes the editable number for the page count without sizing it to an invalid draft. */
const inputWidth = computed(() => `calc(${Math.max(3, String(props.pageCount).length)}ch + 2rem)`);

/** Returns the controlled state that invalidates an unfinished page edit. */
function pageState() {
	return [props.page, props.pageCount, props.disabled];
}

/** Discards an unfinished edit and its validation message without requesting a page. */
function reset() {
	draft.value = String(props.page);
	error.value = '';
}

/**
 * Stores raw text so empty, fractional, and malformed values can be rejected on submit.
 *
 * @param {number|string} value Typed text or a bounded mouse adjustment.
 */
function updateDraft(value) {
	draft.value = String(value);
	error.value = '';
}

/**
 * Selects the current number for quick replacement when the field receives focus.
 *
 * @param {FocusEvent} event Native focus event.
 */
function selectNumber(event) {
	event.target.select();
}

/** Resets and focuses the field when its containing popover opens. */
async function focus() {
	reset();
	await nextTick();
	if (props.disabled) return;
	input.value?.focus();
	input.value?.select();
}

/** Validates an explicit jump and emits only a whole page within the current range. */
function submit() {
	if (props.disabled) return;
	const text = draft.value.trim();
	const page = Number(text);
	if (!/^\d+$/.test(text) || !Number.isSafeInteger(page) || page < 1 || page > props.pageCount) {
		error.value = `Enter a whole page number from 1 to ${props.pageCount}.`;
		input.value?.focus();
		return;
	}
	draft.value = String(page);
	error.value = '';
	emit('submit', page);
}

/** Cancels editing without navigating; the parent can also dismiss a popover. */
function cancel() {
	reset();
	emit('cancel');
}

/**
 * Commits or cancels the page draft without submitting a surrounding application form.
 *
 * @param {KeyboardEvent} event Key event forwarded by the shared numeric control.
 */
function onKeydown(event) {
	if (event.key !== 'Enter' && event.key !== 'Escape') return;
	event.preventDefault();
	event.stopPropagation();
	if (event.key === 'Enter') submit();
	else cancel();
}

watch(pageState, reset);
defineExpose({ focus });
</script>

<template>
	<DomField
		class="min-w-0"
		:html-for="inputId"
		:invalid="!!error"
		:errors="error"
		:error-id="`${inputId}-error`"
	>
		<template #label>
			<label v-if="!inline" :for="inputId" class="block font-medium text-canvas-fg">Go to page</label>
		</template>
		<div class="flex h-9 items-center gap-2 whitespace-nowrap" :class="inline && '@max-[18rem]:gap-1'">
			<label v-if="inline" :for="inputId" class="text-muted-fg @max-[18rem]:sr-only">Page</label>
			<NumberInputControl
				:id="inputId"
				ref="input"
				:model-value="draft"
				type="text"
				scrubbable
				:min="1"
				:max="pageCount"
				inputmode="numeric"
				enterkeyhint="go"
				autocomplete="off"
				aria-label="Page number"
				:aria-describedby="`${inputId}-range${error ? ` ${inputId}-error` : ''}`"
				:aria-invalid="error ? 'true' : undefined"
				:disabled="disabled"
				class="h-8! shrink-0 rounded-md text-sm tabular-nums"
				:style="{ width: inputWidth }"
				@update:model-value="updateDraft"
				@focus="selectNumber"
				@keydown="onKeydown"
			/>
			<span class="text-muted-fg tabular-nums">of {{ pageCount }}</span>
			<DomButton type="button" size="xs" variant="secondary" :disabled="disabled" @click="submit">Go</DomButton>
		</div>
		<template #errors>
			<p v-if="error" :id="`${inputId}-error`" role="alert" class="max-w-56 text-xs text-destructive" :class="inline && 'w-0 min-w-full'">{{ error }}</p>
		</template>
		<template #description>
			<p :id="`${inputId}-range`" :class="inline ? 'sr-only' : 'text-xs text-muted-fg'">Choose 1–{{ pageCount }}. Type, drag the handle, or scroll while focused. Enter or Go opens the page.</p>
		</template>
	</DomField>
</template>
