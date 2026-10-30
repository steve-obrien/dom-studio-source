<script setup>
import { ref } from 'vue';
import { DomContextMenu } from '@getdom/studio/vue';

const selected = ref('none');
const items = [
	{ label: 'Open', value: 'open' },
	{ label: 'Rename', value: 'rename' },
	{ label: 'Duplicate', value: 'duplicate' },
	{ separator: true },
	{ label: 'Delete', value: 'delete', tone: 'danger' },
];
</script>

<template>
	<div class="w-full max-w-md space-y-3">
		<DomContextMenu :items="items" @select="selected = $event.value">
			<div class="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 text-center text-sm text-muted-fg">
				Right click this panel to open the context menu.
			</div>
		</DomContextMenu>

		<p class="text-xs text-muted-fg">Selected: <code class="text-canvas-fg">{{ selected }}</code></p>
	</div>
</template>
