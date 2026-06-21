<script setup>
import { DomCodeBlock } from '../../../lib/vue';

const jsonSource = `{
\t"component": "DomCodeBlock",
\t"props": {
\t\t"lang": "json",
\t\t"previewLines": 5,
\t\t"framed": true
\t}
}`;
</script>

<template>
	<div class="w-full min-w-0 max-w-2xl">
		<DomCodeBlock
			:code="jsonSource"
			lang="json"
			:preview-lines="5"
		/>
	</div>
</template>
