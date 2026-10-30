<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'App bottom nav',
		tag: '<DomAppBottomNav>',
		description: 'A thumb-friendly bottom navigation bar for primary app destinations.',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired when a tab is selected.' },
			{ name: 'change', payload: 'object', description: 'Fired with the selected tab item.' },
		],
		playground: {
			mobileSlot: 'bottom',
			initial: {
				modelValue: 'home',
				items: [
					{ value: 'home', label: 'Home' },
					{ value: 'inbox', label: 'Inbox', badge: '3' },
					{ value: 'settings', label: 'Settings' },
				],
			},
		},
	},
});

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
		_edit: { description: 'Currently selected navigation item value.' },
	},
	items: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Navigation items: { value, label, icon, iconPath, badge }.',
		},
	},
});
const emit = defineEmits(['update:modelValue', 'change']);

const activeValue = computed(() => props.modelValue || props.items[0]?.value || '');

/**
 * Selects a primary app destination and reports the full item to consumers.
 *
 * @param {{ value: string }} item Navigation destination selected by the user.
 * @returns {void}
 */
function selectItem(item) {
	if (item.disabled) return;
	emit('update:modelValue', item.value);
	emit('change', item);
}
</script>

<template>
	<nav class="shrink-0 border-t border-border bg-canvas/95 pl-[max(0.5rem,var(--dom-safe-area-left,env(safe-area-inset-left,0px)))] pr-[max(0.5rem,var(--dom-safe-area-right,env(safe-area-inset-right,0px)))] pt-1 pb-[max(0.25rem,var(--dom-safe-area-bottom,env(safe-area-inset-bottom,0px)))]" aria-label="Primary">
		<div class="grid auto-cols-fr grid-flow-col gap-1">
			<button
				v-for="item in items"
				:key="item.value"
				type="button"
				class="relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium text-muted-fg transition active:scale-95 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 disabled:pointer-events-none"
				:disabled="item.disabled"
				:class="item.value === activeValue && 'bg-secondary text-canvas-fg'"
				:aria-current="item.value === activeValue ? 'page' : undefined"
				@click="selectItem(item)"
			>
				<svg
					v-if="item.iconPath"
					class="size-5"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						:d="item.iconPath"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span v-else-if="item.icon" class="grid size-5 place-items-center" v-html="item.icon"></span>
				<span class="max-w-full truncate">{{ item.label }}</span>
				<span
					v-if="item.badge"
					class="absolute right-4 top-2 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-fg"
				>{{ item.badge }}</span>
			</button>
		</div>
	</nav>
</template>
