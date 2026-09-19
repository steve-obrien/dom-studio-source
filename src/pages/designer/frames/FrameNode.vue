<script setup>
import { computed } from 'vue';
import DomDesignerFrame from '../frame/DomDesignerFrame.vue';
import { frameNodeStyle, isFrameNode } from './frameDocument.js';

const props = defineProps({ node: { type: Object, required: true }, parent: { type: Object, default: null }, detected: { type: Object, default: () => ({}) } });
const style = computed(() => frameNodeStyle(props.node, props.parent));
const frame = computed(() => isFrameNode(props.node));
</script>

<template>
	<template v-if="node.tag === '#text'">{{ node.text }}</template>
	<component v-else :is="node.layout ? DomDesignerFrame : node.tag" v-bind="node.attrs" :as="node.layout ? node.tag : undefined" :layout="node.layout || undefined" :style="style" :data-designer-id="node.id" :data-designer-frame="frame ? (node.layout?.mode || detected[node.id]?.mode || 'flow') : undefined">
		<FrameNode v-for="child in node.children" :key="child.id" :node="child" :parent="node" :detected="detected" />
	</component>
</template>
