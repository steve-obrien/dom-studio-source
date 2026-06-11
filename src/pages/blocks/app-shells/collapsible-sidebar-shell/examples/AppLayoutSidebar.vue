<script setup>
import { computed } from 'vue';

const props = defineProps({
	collapsed: {
		type: Boolean,
		default: false,
	},
	expandedWidth: {
		type: [Number, String],
		default: 248,
	},
	collapsedWidth: {
		type: [Number, String],
		default: 64,
	},
});

const sidebarWidth = computed(() => toCssLength(props.collapsed ? props.collapsedWidth : props.expandedWidth));

function toCssLength(value) {
	return typeof value === 'number' ? `${value}px` : value;
}
</script>

<template>
	<div class="min-h-screen bg-background text-fg">
		<div
			class="grid min-h-screen transition-[grid-template-columns] duration-300 ease-out"
			:style="{ gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr)` }"
		>
			<aside class="flex min-h-screen min-w-0 flex-col border-r border-border bg-secondary/30">
				<slot name="sidebar" />
			</aside>

			<main class="min-w-0 overflow-hidden bg-background">
				<slot name="content" />
			</main>
		</div>
	</div>
</template>
