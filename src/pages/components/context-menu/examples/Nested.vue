<script setup>
import { ref } from 'vue';
import { DomContextMenu } from '@getdom/studio/vue';

const selected = ref('none');
const items = [
	{ label: 'Open', value: 'open' },
	{ label: 'Rename', value: 'rename' },
	{ label: 'Duplicate', value: 'duplicate' },
	{
		label: 'Move to',
		value: 'move',
		children: [
			{ label: 'Inbox', value: 'move-inbox' },
			{ label: 'Archive', value: 'move-archive' },
			{ label: 'Projects', value: 'move-projects' },
		],
	},
	{
		label: 'Share',
		value: 'share',
		children: [
			{ label: 'Email', value: 'share-email' },
			{ label: 'SMS', value: 'share-sms' },
			{ label: 'Instagram', value: 'share-instagram' },
		],
	},
	{ separator: true },
	{ label: 'Delete', value: 'delete', tone: 'danger' },
];
</script>

<template>
	<div class="w-full max-w-lg space-y-3">
		<DomContextMenu :items="items" @select="selected = $event.value">
			<div class="overflow-hidden rounded-2xl border border-border bg-canvas text-sm shadow-sm">
				<div class="grid grid-cols-[1fr_auto] gap-4 border-b border-border skin-card px-4 py-3 backdrop-blur">
					<div>
						<p class="font-medium text-canvas-fg">Quarterly plan</p>
						<p class="mt-1 text-xs text-muted-fg">Right click this row to open nested actions.</p>
					</div>
					<span class="self-start rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">Live</span>
				</div>
				<div class="grid gap-2 p-4 text-muted-fg sm:grid-cols-3">
					<div>
						<p class="text-xs uppercase tracking-[0.14em]">Owner</p>
						<p class="mt-1 text-canvas-fg">Maya Patel</p>
					</div>
					<div>
						<p class="text-xs uppercase tracking-[0.14em]">Status</p>
						<p class="mt-1 text-canvas-fg">In review</p>
					</div>
					<div>
						<p class="text-xs uppercase tracking-[0.14em]">Updated</p>
						<p class="mt-1 text-canvas-fg">Today</p>
					</div>
				</div>
			</div>
		</DomContextMenu>

		<p class="text-xs text-muted-fg">Selected: <code class="text-canvas-fg">{{ selected }}</code></p>
	</div>
</template>
