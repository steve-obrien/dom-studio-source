<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import DomField from '../field/DomField.vue';
import DomButton from '../../components/button/DomButton.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

const props = defineProps({
	...fieldProps,
	modelValue: {
		default: null,
		_edit: { group: 'Control props', description: 'Selected value.' },
	},
	options: {
		type: Array,
		default: () => [],
		_edit: {
			group: 'Control props',
			component: 'DomJsonListInput',
			description: 'Options to render as buttons.',
			props: {
				compact: true,
				addLabel: '+ Add option',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Option label', default: (index) => `Option ${index + 1}` },
					{ key: 'value', label: 'Value', placeholder: 'option-value', default: (index) => `option-${index + 1}` },
				],
			},
		},
	},
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-select-input' });
const groupElement = ref(null);
const wrapped = ref(false);
let resizeObserver;

/**
 * Resolves the visible label for an option.
 *
 * @param {unknown} option Select option.
 * @returns {unknown} Visible option label.
 */
function labelOf(option) {
	return option && typeof option === 'object' ? (option.label ?? option.value) : option;
}

/**
 * Resolves the emitted value for an option.
 *
 * @param {unknown} option Select option.
 * @returns {unknown} Stable option value.
 */
function valueOf(option) {
	return option && typeof option === 'object' ? (option.value ?? option.label) : option;
}

/**
 * Selects an enabled, writable option.
 *
 * @param {unknown} value Option value.
 * @returns {void}
 */
function select(value) {
	if (field.disabled.value || field.readOnly.value) return;
	field.onInput(value);
}

/**
 * Detects whether the rendered option buttons occupy more than one row.
 *
 * @returns {void}
 */
function measureWrapping() {
	const buttons = [...(groupElement.value?.children || [])];
	const firstTop = buttons[0]?.offsetTop;
	wrapped.value = firstTop != null && buttons.some((button) => button.offsetTop !== firstTop);
}

/**
 * Starts observing the option group so its joined styling can adapt to wrapping.
 *
 * @returns {void}
 */
function startWrappingObserver() {
	nextTick(measureWrapping);
	if (typeof ResizeObserver === 'undefined' || !groupElement.value) return;
	resizeObserver = new ResizeObserver(measureWrapping);
	resizeObserver.observe(groupElement.value);
}

/**
 * Stops the option-group resize observer during component teardown.
 *
 * @returns {void}
 */
function stopWrappingObserver() {
	resizeObserver?.disconnect();
}

/**
 * Builds option classes for joined and wrapped group layouts.
 *
 * @param {number} index Option index.
 * @returns {Array<string>} Vue class list for the option button.
 */
function optionClasses(index) {
	if (wrapped.value) return ['ml-0 rounded-full'];
	return [
		index > 0 ? '-ml-px' : '',
		index === 0 ? 'rounded-l-full' : 'rounded-none',
		index === props.options.length - 1 ? 'rounded-r-full' : 'rounded-none',
	];
}

onMounted(startWrappingObserver);
onBeforeUnmount(stopWrappingObserver);
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<input
			v-if="field.htmlName.value"
			type="hidden"
			:name="field.htmlName.value"
			:value="field.value.value ?? ''"
		/>
		<div
			:id="field.id.value"
			ref="groupElement"
			role="group"
			:aria-label="label || undefined"
			:aria-describedby="field.describedBy.value || undefined"
			:aria-invalid="field.invalid.value || undefined"
			:aria-errormessage="field.errorId.value || undefined"
			:data-wrapped="wrapped || undefined"
			class="flex flex-wrap"
			:class="wrapped ? 'gap-1' : 'gap-0'"
		>
			<DomButton
				v-for="(opt, i) in options"
				:key="valueOf(opt)"
				type="button"
				size="sm"
				:variant="field.value.value === valueOf(opt) ? 'primary' : 'secondary'"
				:disabled="field.disabled.value"
				:aria-pressed="field.value.value === valueOf(opt)"
				@click="select(valueOf(opt))"
				@focus="field.onFocus"
				@blur="field.onBlur"
				:class="optionClasses(i)"
			>{{ labelOf(opt) }}</DomButton>
		</div>
	</DomField>
</template>
