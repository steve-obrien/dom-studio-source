<script setup>
import { ref } from 'vue';
import { DomToggleButtonGroup } from '@getdom/studio/vue';

const view = ref('grid');
const tools = ref(['comments']);

const views = [
	{ label: 'List', value: 'list' },
	{ label: 'Grid', value: 'grid' },
	{ label: 'Board', value: 'board' },
];

const toolOptions = [
	{ label: 'Comments', value: 'comments' },
	{ label: 'Activity', value: 'activity' },
	{ label: 'Files', value: 'files' },
];
</script>

<template>
	<div class="space-y-5">
		<DomToggleButtonGroup
			v-model="view"
			label="View"
			:options="views"
			description="Single mode behaves like a segmented control."
		/>

		<DomToggleButtonGroup
			v-model="tools"
			type="multiple"
			label="Panels"
			:options="toolOptions"
			description="Multiple mode lets users keep more than one option pressed."
		/>

		<pre class="overflow-auto rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">{{ { view, tools } }}</pre>
	</div>
</template>
