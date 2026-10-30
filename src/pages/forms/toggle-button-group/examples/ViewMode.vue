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

const viewIcons = [
	{ label: 'List', value: 'list', tooltip: 'List view', ariaLabel: 'List view', icon: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01' },
	{ label: 'Grid', value: 'grid', tooltip: 'Grid view', ariaLabel: 'Grid view', icon: 'M7 7h4v4H7V7Zm6 0h4v4h-4V7ZM7 13h4v4H7v-4Zm6 0h4v4h-4v-4Z' },
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
			v-model="view"
			:options="viewIcons"
			label="Display"
			chrome="none"
			size="icon-lg"
			variant="switch"
		>
			<template #option="{ option }">
				<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
					<path :d="option.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<span class="sr-only">{{ option.label }}</span>
			</template>
		</DomToggleButtonGroup>

		<DomToggleButtonGroup
			v-model="tools"
			type="multiple"
			label="Panels"
			:options="toolOptions"
			description="Multiple mode lets users keep more than one option pressed."
		/>

		<pre class="overflow-auto rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-fg">{{ { view, tools } }}</pre>
	</div>
</template>
