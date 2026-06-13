<script setup>
import { ref } from 'vue';
import { DomMenu, DomPopover } from '@getdom/studio/vue';

const popover = ref(null);
const menu = ref(null);
const selected = ref('none');

const items = Array.from({ length: 30 }, (_, index) => ({
	label: `Project ${index + 1}`,
	value: `project-${index + 1}`,
}));

function focusMenu() {
	requestAnimationFrame(() => {
		menu.value?.querySelector('[role="menuitem"]')?.focus();
	});
}

function onSelect(event) {
	selected.value = event.value;
	popover.value?.close();
}
</script>

<template>
	<div class="space-y-3">
		<DomPopover
			ref="popover"
			label="Switch project"
			position="bottom-start"
			width="min-w-64"
			padding="p-0"
			lock-scroll
			@open="focusMenu"
		>
			<div ref="menu" class="max-h-72 overflow-y-auto p-1">
				<DomMenu :items="items" :skin="false" @select="onSelect" />
			</div>
		</DomPopover>

		<p class="text-xs text-muted-fg">Selected: <code class="text-canvas-fg">{{ selected }}</code></p>
	</div>
</template>
