<script setup>
import { computed, reactive, watch } from 'vue';
import CssComponentEditor from './CssComponentEditor.vue';
import {
	createCssComponentStyle,
	cssStyleToMappedStyles,
} from '../lib/styleModel.js';

defineOptions({
	inheritAttrs: false,
});

const props = defineProps({
	modelValue: {
		type: Object,
		default: () => ({}),
	},
	varmap: {
		type: Object,
		default: () => ({}),
	},
	title: {
		type: String,
		default: 'CSS styles',
	},
	initialStyle: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(['change']);
const fallbackModel = reactive({});
const model = computed(() => props.modelValue && typeof props.modelValue === 'object'
	? props.modelValue
	: fallbackModel);
const editorStyle = computed(() => {
	ensureModelShape();
	return model.value.state;
});

ensureModelShape();

watch(editorStyle, syncOutput, { deep: true, immediate: true });
watch(() => props.varmap, syncOutput, { deep: true });

function ensureModelShape() {
	if (!model.value.state) model.value.state = createCssComponentStyle(props.initialStyle);
	if (!model.value.styles) model.value.styles = {};
	if (!model.value.vars) model.value.vars = {};
}

function syncOutput() {
	ensureModelShape();
	const output = cssStyleToMappedStyles(model.value.state, props.varmap);
	replaceObject(model.value.styles, output.styles);
	replaceObject(model.value.vars, output.vars);
	emit('change', {
		styles: model.value.styles,
		vars: model.value.vars,
		state: model.value.state,
	});
}

function replaceObject(target, source) {
	Object.keys(target).forEach((key) => {
		if (!(key in source)) delete target[key];
	});
	Object.assign(target, source);
}
</script>

<template>
	<CssComponentEditor
		:style="editorStyle"
		:title="title"
	/>
</template>
