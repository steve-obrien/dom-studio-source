<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
	modelValue: { type: String, default: '' },
	tabs: { type: Array, required: true }, // [{ key, label }]
	variant: {
		type: String,
		default: 'pill',
		_edit: { options: ['pill', 'page'], description: 'Visual treatment for the tab list.' },
	},
	/** Stretch tabs + active panel to fill a flex parent (studio / inspector shell). */
	fill: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const activeValue = computed(() => props.modelValue || props.tabs[0]?.key || '');
const tablistClass = computed(() => {
	if (props.variant === 'page') return 'flex min-w-0 shrink-0 overflow-x-auto border-b border-border bg-secondary/55 px-2 pt-1';
	return 'inline-flex shrink-0 gap-1 rounded-full border border-border bg-secondary p-1';
});
const tabButtonClass = computed(() => {
	if (props.variant === 'page') {
		return [
			'relative -mb-px flex h-9 min-w-0 max-w-56 items-center gap-2 rounded-t-md border border-transparent border-b-border px-3 text-left text-sm font-medium text-muted-fg transition',
			'hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
			'data-[active]:border-border data-[active]:border-b-canvas data-[active]:bg-canvas data-[active]:text-canvas-fg data-[active]:shadow-sm',
		].join(' ');
	}
	return 'rounded-full px-4 py-1.5 text-sm font-medium text-muted-fg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 data-[active]:bg-canvas data-[active]:text-canvas-fg data-[active]:shadow-sm';
});
const panelClass = computed(() => {
	if (props.fill) return props.variant === 'page'
		? 'flex min-h-0 flex-1 flex-col overflow-hidden'
		: 'mt-3 flex min-h-0 flex-1 flex-col overflow-hidden';
	return props.variant === 'page' ? 'mt-0' : 'mt-6';
});

onMounted(async () => {
	await import('../../lib/headless/tabs.js');
	root.value?.addEventListener('dom:change', (e) => emit('update:modelValue', e.detail.value));
});

watch(() => props.modelValue, (v) => {
	if (root.value && v && root.value.value !== v) root.value.value = v;
});
</script>

<template>
	<dom-tabs
		ref="root"
		:value="modelValue || tabs[0]?.key"
		:class="fill ? 'flex min-h-0 flex-1 flex-col' : 'block'"
	>
		<div role="tablist" :class="tablistClass">
			<button
				v-for="t in tabs"
				:key="t.key"
				:data-tab="t.key"
				:class="tabButtonClass"
			>
				<slot name="tab" :tab="t" :active="activeValue === t.key">
					<span class="truncate">{{ t.label }}</span>
				</slot>
			</button>
		</div>
		<div :class="panelClass">
			<div
				v-for="t in tabs"
				:key="t.key"
				:data-panel="t.key"
				:class="fill && 'flex min-h-0 flex-1 flex-col overflow-hidden'"
			>
				<slot :name="t.key" />
			</div>
		</div>
	</dom-tabs>
</template>
