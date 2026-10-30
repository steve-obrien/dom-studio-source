<script setup>
import DomCodeBlock from '../dev/code-block/DomCodeBlock.vue';

defineOptions({ inheritAttrs: false });

defineProps({
	lang: { type: String, default: 'vue' },
	code: { type: String, default: '' },
	filename: { type: String, default: '' },
	defaultOpen: { type: Boolean, default: true },
	previewLines: { type: Number, default: 0 },
	framed: { type: Boolean, default: true },
});
</script>

<template>
	<DomCodeBlock
		v-bind="$attrs"
		:code="code"
		:filename="filename"
		:framed="framed"
		:lang="lang"
		:preview-lines="previewLines"
	>
		<slot />
	</DomCodeBlock>
</template>
