<script setup>
import { DomSpinner } from '@getdom/studio/vue';

const sizes = [
	{ value: 'sm', label: 'Small' },
	{ value: 'md', label: 'Medium' },
	{ value: 'lg', label: 'Large' },
];
</script>

<template>
	<div class="w-full max-w-md space-y-3">
		<div class="flex items-center gap-3 text-sm text-canvas-fg">
			<DomSpinner aria-hidden="true" />
			<span>Default arc</span>
		</div>
		<ul class="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-canvas">
			<li v-for="size in sizes" :key="size.value" class="grid justify-items-center gap-2 px-2 py-4">
				<DomSpinner aria-hidden="true" variant="tail" :size="size.value" tone="success" />
				<span class="text-xs text-muted-fg">{{ size.label }}</span>
			</li>
		</ul>
	</div>
</template>
