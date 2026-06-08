<script setup>
import { ref } from 'vue';
import { DomCodeInput } from '../../../lib/vue';

const code = ref(`{
\t"name": "DOM Studio",
\t"editable": true,
\t"theme": "token-based"
}`);
</script>

<template>
	<div class="w-full max-w-2xl">
		<DomCodeInput
			v-model="code"
			label="Configuration"
			description="Loads an enhanced editor from a CDN when available; otherwise this remains a textarea."
			lang="json"
			:rows="8"
		/>
	</div>
</template>
