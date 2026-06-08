<script setup>
import { ref } from 'vue';
import { DomNativeSelect } from '../../../lib/vue';

const workspace = ref('design');
const workspaces = [
	{ label: 'Design system', value: 'design' },
	{ label: 'Marketing site', value: 'marketing' },
	{ label: 'Internal tools', value: 'tools' },
];
</script>

<template>
	<div class="w-full max-w-sm">
		<DomNativeSelect
			v-model="workspace"
			label="Workspace"
			description="Native select behaviour, styled with DOM Studio tokens."
			:options="workspaces"
		/>
	</div>
</template>
