<script setup>
import { ref, watch } from 'vue';
import BackdropControl from './BackdropControl.vue';
import { createBackdrop, backdropToCss } from './backdropModel.js';

defineOptions({ __doc: { name: 'Backdrop editor', description: 'Beta controlled CSS backdrop editor shared with the theme designer.' } });
const props = defineProps({
	modelValue: { type: Object, default: () => createBackdrop() },
	title: { type: String, default: 'Backdrop effects' },
});
const emit = defineEmits(['update:modelValue', 'change']);
const draft = ref(createBackdrop());
const open = ref(true);
/** Copies records so nested control edits never mutate caller-owned state. */
function clone(value) { return { ...value }; }
/** Synchronizes external state, preserving existing fill identities. */
function sync(value) {
	if (JSON.stringify(value) !== JSON.stringify(draft.value)) draft.value = clone(value);
}
/** Emits independent records and ready-to-bind CSS. */
function publish(value) {
	if (JSON.stringify(value) === JSON.stringify(props.modelValue)) return;
	const backdrop = clone(value);
	emit('update:modelValue', backdrop);
	emit('change', { backdrop, css: backdropToCss(backdrop) });
}
watch(() => props.modelValue, sync, { deep: true, immediate: true });
watch(draft, publish, { deep: true });
</script>

<template>
	<BackdropControl v-model="open" :backdrop="draft" :title="title" />
</template>
