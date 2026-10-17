<script setup>
import { computed, ref, watch } from 'vue';
import CssColorInput from '../color-swatch/DomColorSwatch.vue';
import ControlIconButton from '../_shared/ControlIconButton.vue';
import IconSegmented from '../_shared/IconSegmented.vue';
import InspectorSelect from '../_shared/InspectorSelect.vue';
import ScrubField from '../_shared/ScrubField.vue';
import StyleControlSection from '../_shared/StyleControlSection.vue';
import DomFontPicker from '../../forms/font-picker/DomFontPicker.vue';
import { fontPickerRecords } from './googleFonts.js';
import { createTypography, fontFamilyOptions, fontWeightOptions, isBold, toggleDecoration, typographyToStyle } from './typographyModel.js';

defineOptions({
	__doc: {
		name: 'Typography editor',
		description: 'Beta Figma-style text controls: font family (installed fonts and Google Fonts), weight, size, line height, letter spacing, bold, italic, underline, strikethrough, alignment, case and colour.',
		events: [
			{ name: 'update:modelValue', payload: 'object', description: 'A new typography record.' },
			{ name: 'change', payload: '{ typography, style }', description: 'The record and a ready-to-bind Vue style object.' },
		],
	},
});

const props = defineProps({
	modelValue: { type: Object, default: () => createTypography(), _edit: { description: 'Typography record. Empty values inherit.' } },
	title: { type: String, default: 'Text' },
	fonts: { type: Array, default: () => fontFamilyOptions, _edit: { description: 'Installed font choices as { label, value } CSS stacks. A value not listed still shows.' } },
	googleFonts: { type: Boolean, default: true, _edit: { description: 'Offer Google Fonts in a searchable picker after the installed fonts. Turn off for email and other places that can only use installed fonts.' } },
	weights: { type: Array, default: () => fontWeightOptions },
	showColor: { type: Boolean, default: true },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'change']);
const draft = ref({});
const open = ref(true);
const customFont = ref(false);

const alignOptions = [
	{ value: 'left', icon: 'align-left', label: 'Align left' },
	{ value: 'center', icon: 'align-center', label: 'Align centre' },
	{ value: 'right', icon: 'align-right', label: 'Align right' },
	{ value: 'justify', icon: 'align-justify', label: 'Justify' },
];
const caseOptions = [
	{ value: 'none', text: '—', label: 'As typed' },
	{ value: 'uppercase', text: 'AA', label: 'Uppercase' },
	{ value: 'lowercase', text: 'aa', label: 'Lowercase' },
	{ value: 'capitalize', text: 'Aa', label: 'Title case' },
];
const decoration = computed(() => String(draft.value.textDecoration || ''));
const fontChoices = computed(() => [...props.fonts, { label: 'Custom font…', value: '__custom' }]);
const pickerFonts = computed(() => fontPickerRecords(props.fonts, true));
const meta = computed(() => [draft.value.fontSize && `${draft.value.fontSize}${typeof draft.value.fontSize === 'number' ? 'px' : ''}`, props.weights.find((weight) => String(weight.value) === String(draft.value.fontWeight))?.label].filter(Boolean).join(' · '));

/** Copies the record so editing never mutates caller-owned state. */
function sync(value) {
	if (JSON.stringify(value) !== JSON.stringify(draft.value)) draft.value = { ...value };
}

/** Emits a new record and its style object. */
function publish(value) {
	if (JSON.stringify(value) === JSON.stringify(props.modelValue)) return;
	const typography = { ...value };
	emit('update:modelValue', typography);
	emit('change', { typography, style: typographyToStyle(typography) });
}

function set(key, value) {
	draft.value = { ...draft.value, [key]: value };
}

function setFont(value) {
	if (value === '__custom') customFont.value = true;
	else set('fontFamily', value);
}

function commitCustomFont(event) {
	const value = event.target.value.trim();
	customFont.value = false;
	if (value && !/[;{}<>]|url\(/i.test(value)) set('fontFamily', value);
}

watch(() => props.modelValue, sync, { deep: true, immediate: true });
watch(draft, publish);
</script>

<template>
	<StyleControlSection v-model="open" :title="title" :meta="meta">
		<fieldset :disabled="disabled" class="min-w-0 space-y-1.5 disabled:opacity-50">
			<input
				v-if="customFont"
				type="text"
				class="h-7 w-full rounded-md bg-canvas px-2 text-xs text-canvas-fg outline-none ring-1 ring-inset ring-primary"
				:value="draft.fontFamily"
				aria-label="Custom font family"
				placeholder="'Inter', sans-serif"
				autofocus
				@keydown.enter.prevent="commitCustomFont"
				@keydown.escape="customFont = false"
				@blur="commitCustomFont"
			>
			<DomFontPicker v-else-if="googleFonts" size="sm" label="Font family" placeholder="Inherited font" :model-value="draft.fontFamily || ''" :fonts="pickerFonts" :clearable="false" @update:model-value="set('fontFamily', $event || '')" />
			<InspectorSelect v-else :model-value="draft.fontFamily" :options="fontChoices" label="Font family" placeholder="Inherited font" :style="{ fontFamily: draft.fontFamily || undefined }" @update:model-value="setFont" />
			<div class="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-1.5">
				<InspectorSelect :model-value="draft.fontWeight" :options="weights" label="Font weight" placeholder="Inherited weight" @update:model-value="set('fontWeight', $event)" />
				<ScrubField :model-value="draft.fontSize" icon="font-size" label="Font size" css :min="1" :max="1000" placeholder="Auto" @update:model-value="set('fontSize', $event)" />
			</div>
			<div class="grid grid-cols-2 gap-1.5">
				<ScrubField :model-value="draft.lineHeight" icon="line-height" label="Line height" css :min="0" :max="10" :step="0.05" placeholder="Auto" @update:model-value="set('lineHeight', $event)" />
				<ScrubField :model-value="draft.letterSpacing" icon="letter-spacing" label="Letter spacing" css :min="-50" :max="200" :step="0.1" placeholder="0" @update:model-value="set('letterSpacing', $event)" />
			</div>
			<div class="flex items-center justify-between gap-1.5">
				<div class="flex h-7 items-center rounded-md bg-secondary/60 px-0.5" role="group" aria-label="Text style">
					<ControlIconButton icon="bold" label="Bold" :pressed="isBold(draft.fontWeight)" @click="set('fontWeight', isBold(draft.fontWeight) ? '400' : '700')" />
					<ControlIconButton icon="italic" label="Italic" :pressed="draft.fontStyle === 'italic'" @click="set('fontStyle', draft.fontStyle === 'italic' ? 'normal' : 'italic')" />
					<ControlIconButton icon="underline" label="Underline" :pressed="decoration.includes('underline')" @click="set('textDecoration', toggleDecoration(decoration, 'underline'))" />
					<ControlIconButton icon="strike" label="Strikethrough" :pressed="decoration.includes('line-through')" @click="set('textDecoration', toggleDecoration(decoration, 'line-through'))" />
				</div>
				<IconSegmented :model-value="draft.textAlign" :options="alignOptions" label="Text alignment" @update:model-value="set('textAlign', $event)" />
			</div>
			<div class="flex items-center gap-1.5">
				<IconSegmented :model-value="draft.textTransform" :options="caseOptions" label="Letter case" @update:model-value="set('textTransform', $event)" />
				<CssColorInput v-if="showColor" class="min-w-0 flex-1" :model-value="draft.color || ''" hide-label label="Text colour" placeholder="Inherited colour" @update:model-value="set('color', $event)" />
			</div>
		</fieldset>
	</StyleControlSection>
</template>
