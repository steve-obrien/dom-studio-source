<script setup>
import { DomCodeBlock } from '../../../lib/vue';

const source = `import { DomButton } from '@getdom/studio/vue';

export function SaveAction() {
\treturn {
\t\tlabel: 'Save changes',
\t\tcomponent: DomButton,
\t};
}`;
</script>

<template>
	<div class="w-full min-w-0 max-w-2xl">
		<DomCodeBlock
			:code="source"
			filename="save-action.js"
			lang="js"
		/>
	</div>
</template>
