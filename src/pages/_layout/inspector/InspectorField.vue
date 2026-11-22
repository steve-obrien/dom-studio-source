<script setup>
import { computed } from 'vue';
import { getEditor, getDefaultEditor } from './editorRegistry.js';

// One generic renderer: the field knows which editor component it wants by
// name (e.g. 'DomSelectInput', 'DomJsonListInput'). We resolve the name to the real
// component via the editor registry — no per-type switch statement, no string
// mappings like 'select' or 'text' to maintain.
const props = defineProps({
	field: { type: Object, required: true },
	modelValue: { default: undefined },
	overrideReason: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

/**
 * Forwards edits only while the field controls the preview.
 *
 * @param {unknown} value Edited field value.
 * @returns {void}
 */
function update(value) {
	if (!props.overrideReason) emit('update:modelValue', value);
}

const editor = computed(() => getEditor(props.field.component) || getDefaultEditor());

// Editors that can show an unset prop's default as greyed placeholder text.
// Other editors (toggles, selects, swatches) show the default as their value,
// which stays unset in the source until it is edited.
const placeholderEditors = new Set(['DomTextInput', 'DomTextareaInput', 'DomNumberInput', 'ScrubField']);
const unset = computed(() => props.modelValue === undefined && props.field.defaultValue !== undefined);
const shownValue = computed(() => (unset.value && !placeholderEditors.has(props.field.component) ? props.field.defaultValue : props.modelValue));
const defaultPlaceholder = computed(() => {
	if (!unset.value || !placeholderEditors.has(props.field.component) || props.field.defaultValue === '') return {};
	return { placeholder: String(props.field.defaultValue) };
});

// Pass through every schema entry except the bookkeeping fields so editors
// pick up their own props (options, rows, min/max/step, placeholder, …).
const editorProps = computed(() => {
	// eslint-disable-next-line no-unused-vars
	const { key, keys, component, target, label, description, group, half, defaultValue, overriddenBy, props: fieldProps = {}, ...rest } = props.field;
	return {
		...rest,
		...fieldProps,
		...defaultPlaceholder.value,
		...(props.overrideReason ? { disabled: true, description: props.overrideReason } : {}),
	};
});
</script>

<template>
	<component
		:is="editor"
		:model-value="shownValue"
		:label="field.label"
		:description="field.description"
		v-bind="editorProps"
		@update:model-value="update"
	/>
</template>
