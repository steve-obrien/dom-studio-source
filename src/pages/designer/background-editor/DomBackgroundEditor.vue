<script setup>
import { ref, watch } from 'vue';
import BackgroundLayers from './BackgroundLayers.vue';
import { createBackgroundState, backgroundImageToCss } from './backgroundModel.js';

defineOptions({ __doc: { name: 'Background editor', description: 'Beta controlled CSS background editor shared with the theme designer.' } });
const props = defineProps({
	modelValue: { type: Object, default: () => createBackgroundState({}, { allowEmpty: true }) },
	title: { type: String, default: 'Background layers' },
});
const emit = defineEmits(['update:modelValue', 'change']);
const draft = ref(createBackgroundState({}, { allowEmpty: true }));
const open = ref(true);
/** Copies records so nested control edits never mutate caller-owned state. */
function clone(value) { return { ...value, fills: (value.fills || []).map((fill) => ({ ...fill })) }; }
/** Synchronizes external state, preserving existing fill identities. */
function sync(value) {
	if (JSON.stringify(value) !== JSON.stringify(draft.value)) draft.value = clone(value);
}
/** Emits independent records and ready-to-bind CSS. */
function publish(value) {
	if (JSON.stringify(value) === JSON.stringify(props.modelValue)) return;
	const background = clone(value);
	emit('update:modelValue', background);
	emit('change', { background, css: backgroundImageToCss(background) });
}
watch(() => props.modelValue, sync, { deep: true, immediate: true });
watch(draft, publish, { deep: true });
</script>

<template>
	<BackgroundLayers v-model="open" :background="draft" :title="title" />
</template>
