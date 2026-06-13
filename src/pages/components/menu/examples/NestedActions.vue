<script setup>
import { ref } from 'vue';
import { DomButton, DomMenu, DomPopover } from '@getdom/studio/vue';

const popover = ref(null);
const menu = ref(null);
const selected = ref('none');

const items = [
	{ label: 'Open', value: 'open' },
	{ label: 'Rename', value: 'rename' },
	{ label: 'Duplicate', value: 'duplicate' },
	{ label: 'Delete', value: 'delete', tone: 'danger' },
	{
		label: 'Share',
		value: 'share',
		children: [
			{ label: 'Email', value: 'share-email' },
			{ label: 'SMS', value: 'share-sms' },
			{ label: 'Instagram', value: 'share-instagram' },
		],
	},
];

function onSelect(event) {
	selected.value = event.value;
	popover.value?.close();
}

function focusMenu() {
	requestAnimationFrame(() => {
		menu.value?.querySelector('[role="menuitem"]')?.focus();
	});
}
</script>

<template>
	<div class="space-y-3">
		<DomPopover ref="popover" position="bottom-end" width="min-w-48" padding="p-1" :arrow="false" @open="focusMenu">
			<template #trigger>
				<DomButton variant="secondary" size="sm" aria-label="Open actions">
					<span aria-hidden="true" class="text-lg leading-none">...</span>
				</DomButton>
			</template>
			<div ref="menu">
				<DomMenu :items="items" :skin="false" @select="onSelect" />
			</div>
		</DomPopover>

		<p class="text-xs text-muted-fg">Selected: <code class="text-canvas-fg">{{ selected }}</code></p>
	</div>
</template>
