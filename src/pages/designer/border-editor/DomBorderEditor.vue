<script setup>
import { ref, watch } from 'vue';
import BorderControl from './BorderControl.vue';
import { createDesignerBorder, borderToCss } from './borderModel.js';

defineOptions({ __doc: { name: 'Border editor', description: 'Beta controlled CSS border width, style and colour, shared with the CSS button creator.' } });
const props = defineProps({
	modelValue: { type: Object, default: () => createDesignerBorder() },
	title: { type: String, default: 'Border' },
	maxWidth: { type: Number, default: 40 },
});
const emit = defineEmits(['update:modelValue', 'change']);
const draft = ref(createDesignerBorder());
const open = ref(true);

/** Copies incoming values so the underlying control never mutates application-owned records. */
function syncBorder(value) {
	const next = createDesignerBorder(value);
	if (JSON.stringify(next) !== JSON.stringify(draft.value)) draft.value = next;
}
/** Emits an independent record and its CSS value for application-owned styling. */
function publishBorder(value) {
	if (JSON.stringify(value) === JSON.stringify(createDesignerBorder(props.modelValue))) return;
	const border = { ...value };
	emit('update:modelValue', border);
	emit('change', { border, css: borderToCss(border) });
}
watch(() => props.modelValue, syncBorder, { deep: true, immediate: true });
watch(draft, publishBorder, { deep: true });
</script>

<template>
	<BorderControl v-model="open" :border="draft" :title="title" :max-width="maxWidth" />
</template>
