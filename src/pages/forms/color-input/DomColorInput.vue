<script setup>
import { computed, onMounted, ref } from 'vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';
import { cssColorToHex, hexToOklch } from '../../lib/css/color.js';

defineOptions({
	__doc: {
		name: 'Color input',
		tag: '<DomColorInput>',
		description: 'A compact colour swatch that opens the native colour picker while preserving CSS colour values.',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired when the colour changes.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when either control receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when either control loses focus.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: String,
		default: '#000000',
		_edit: { group: 'Control props', description: 'CSS colour value. Hex and OKLCH values are supported.' },
	},
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-color-input' });
const canResolveBrowserColors = ref(false);

const displayColor = computed(() => String(field.value.value || 'transparent').trim() || 'transparent');
const swatchValue = computed(() => cssColorToHex(displayColor.value));
const nativeColorValue = computed(() => {
	if (!canResolveBrowserColors.value && needsBrowserColorResolution(displayColor.value)) return '#000000';
	return swatchValue.value;
});
const nativeColorAttrs = computed(() => ({
	id: field.id.value,
	name: field.htmlName.value,
	value: nativeColorValue.value,
	disabled: field.disabled.value || field.readOnly.value || undefined,
	required: props.required || undefined,
	'aria-invalid': field.invalid.value || undefined,
	'aria-describedby': field.describedBy.value || undefined,
	'aria-errormessage': field.errorId.value || undefined,
	'data-invalid': field.invalid.value ? '' : undefined,
	'aria-label': props.label ? undefined : 'Change colour',
	title: displayColor.value,
}));
const swatchStyle = computed(() => ({
	'--dom-color-swatch': displayColor.value,
}));

function onNativeColorInput(value) {
	const currentValue = String(field.value.value || '').trim();
	field.onInput(/^oklch\(/i.test(currentValue) ? hexToOklch(value) : value);
}

function needsBrowserColorResolution(value) {
	const color = String(value || '').trim();
	if (!color || color === 'transparent') return false;
	return !(
		/^#[0-9a-f]{3,8}$/i.test(color)
		|| /^rgba?\(/i.test(color)
		|| /^oklch\(/i.test(color)
		|| /^color\(\s*srgb\s+/i.test(color)
	);
}

onMounted(() => {
	canResolveBrowserColors.value = true;
});
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<div
			class="dom-color-control relative h-10 w-full overflow-hidden rounded-lg border border-border shadow-sm transition focus-within:ring-2 focus-within:ring-ring/50"
			:class="(field.disabled.value || field.readOnly.value) && 'cursor-not-allowed opacity-50'"
		>
			<span class="dom-color-swatch absolute inset-0" :style="swatchStyle"></span>
			<span class="sr-only">{{ displayColor }}</span>
			<input
				v-bind="nativeColorAttrs"
				type="color"
				class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
				@input="onNativeColorInput($event.target.value)"
				@focus="field.onFocus"
				@blur="field.onBlur"
			/>
		</div>
	</DomField>
</template>

<style scoped>
.dom-color-control[data-invalid],
.dom-color-control:has(input[data-invalid]) {
	border-color: var(--destructive);
}

.dom-color-swatch {
	background:
		linear-gradient(var(--dom-color-swatch), var(--dom-color-swatch)),
		conic-gradient(
			from 45deg,
			color-mix(in oklch, var(--border) 60%, white) 0 25%,
			transparent 0 50%,
			color-mix(in oklch, var(--border) 60%, white) 0 75%,
			transparent 0
		);
	background-color: var(--dom-color-swatch);
	background-size:
		100% 100%,
		14px 14px;
}
</style>
