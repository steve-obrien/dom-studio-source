<script setup>
import { computed, useAttrs } from 'vue';
import { createFrameLayout, frameLayoutStyle } from './frameLayout.js';

defineOptions({ inheritAttrs: false, __doc: { name: 'Designer frame', description: 'An ordinary container with independent flow, flex, grid or absolute child layout.', slots: [{ name: 'default', description: 'Frame content. Applications own child placement.' }] } });
const props = defineProps({
	as: { type: String, default: 'div' },
	layout: { type: Object, default: () => createFrameLayout() },
});
const attrs = useAttrs();
const style = computed(() => frameLayoutStyle(props.layout));
</script>

<template>
	<component :is="as" v-bind="attrs" :style="[style, attrs.style]"><slot /></component>
</template>
