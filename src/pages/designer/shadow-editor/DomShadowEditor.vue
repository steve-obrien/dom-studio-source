<script setup>
import { ref, watch } from 'vue';
import ShadowLayers from './ShadowLayers.vue';
import { shadowListToCss } from '../shadow-editor/shadowModel.js';

defineOptions({ __doc: { name: 'Shadow editor', description: 'Beta controlled CSS box-shadow layers: drop, inner and ring.' } });
const props = defineProps({
	modelValue: { type: Array, default: () => [] },
	title: { type: String, default: 'Box shadows' },
});
const emit = defineEmits(['update:modelValue', 'change']);
const draft = ref([]);
const open = ref(true);

/** Copies caller-owned layers so editing never mutates a prop or its children. */
function syncLayers(value) {
	if (JSON.stringify(value) !== JSON.stringify(draft.value)) draft.value = value.map((layer) => ({ ...layer }));
}
/** Publishes independent layer records and their ready-to-use CSS value. */
function publishLayers(value) {
	if (JSON.stringify(value) === JSON.stringify(props.modelValue)) return;
	const layers = value.map((layer) => ({ ...layer }));
	emit('update:modelValue', layers);
	emit('change', { layers, css: shadowListToCss(layers) });
}
watch(() => props.modelValue, syncLayers, { deep: true, immediate: true });
watch(draft, publishLayers, { deep: true });
</script>

<template>
	<ShadowLayers v-model="open" :shadows="draft" :title="title" />
</template>
