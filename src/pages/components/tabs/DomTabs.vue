<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
	modelValue: { type: String, default: '' },
	tabs: { type: Array, required: true }, // [{ key, label }]
	variant: {
		type: String,
		default: 'pill',
		_edit: { options: ['pill', 'flat', 'page'], description: 'Visual treatment for the tab list.' },
	},
	/** Stretch tabs + active panel to fill a flex parent (studio / inspector shell). */
	fill: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const activeValue = computed(() => props.modelValue || props.tabs[0]?.key || '');
const tablistClass = computed(() => {
	if (props.variant === 'page') {
		return [
			'relative flex min-w-0 shrink-0 overflow-x-auto bg-secondary/55 px-2 pt-1',
			'before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border before:content-[\'\']',
		].join(' ');
	}
	if (props.variant === 'flat') return 'flex min-w-0 shrink-0 gap-6 overflow-x-auto border-b border-border';
	return 'inline-flex shrink-0 gap-1 rounded-full border border-border bg-secondary p-1';
});
const tabButtonClass = computed(() => {
	if (props.variant === 'page') {
		return [
			'relative -mb-px flex h-9 min-w-0 max-w-56 items-center gap-2 rounded-t-md border border-transparent border-b-border px-3 text-left text-sm font-medium text-muted-fg transition',
			'hover:border-x-border hover:border-t-border hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
			'data-[active]:z-10 data-[active]:border-x-border data-[active]:border-t-border data-[active]:border-b-canvas data-[active]:bg-canvas data-[active]:text-canvas-fg',
			'data-[active]:after:pointer-events-none data-[active]:after:absolute data-[active]:after:inset-x-px data-[active]:after:-bottom-px data-[active]:after:h-1 data-[active]:after:bg-canvas data-[active]:after:content-[\'\']',
		].join(' ');
	}
	if (props.variant === 'flat') {
		return [
			'relative -mb-px flex h-10 shrink-0 items-center border-b-2 border-transparent px-1 text-sm font-medium text-muted-fg transition',
			'hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
			'data-[active]:border-primary data-[active]:text-canvas-fg',
		].join(' ');
	}
	return 'rounded-full px-4 py-1.5 text-sm font-medium text-muted-fg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 data-[active]:bg-canvas data-[active]:text-canvas-fg data-[active]:shadow-sm';
});
const panelClass = computed(() => {
	if (props.fill) return props.variant === 'page'
		? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas'
		: 'mt-3 flex min-h-0 flex-1 flex-col overflow-hidden';
	return props.variant === 'page' ? 'mt-0 bg-canvas' : 'mt-6';
});

onMounted(mountTabs);
onUnmounted(removeTabsListeners);
watch(getModelValue, syncModelValue);

/**
 * Load the headless tabs behavior and subscribe to changes from this tab host.
 *
 * @returns {Promise<void>} Resolves after the headless element is registered.
 */
async function mountTabs() {
	await import('../../lib/headless/tabs.js');
	root.value?.addEventListener('dom:change', onTabChange);
}

/**
 * Remove the host-level change listener when the Vue component unmounts.
 *
 * @returns {void}
 */
function removeTabsListeners() {
	root.value?.removeEventListener('dom:change', onTabChange);
}

/**
 * Return the externally controlled tab value for Vue's watcher.
 *
 * @returns {string} Controlled active tab value.
 */
function getModelValue() {
	return props.modelValue;
}

/**
 * Commit only changes dispatched by the tab host itself.
 *
 * Nested DOM Studio controls can also emit bubbling `dom:change` events. Those
 * events must not reset the active tab.
 *
 * @param {CustomEvent<{ value?: string }>} event Headless change event.
 * @returns {void}
 */
function onTabChange(event) {
	if (event.target !== root.value) return;
	const value = event.detail?.value;
	let isKnownTab = false;
	for (const tab of props.tabs) {
		if (tab.key === value) {
			isKnownTab = true;
			break;
		}
	}
	if (!isKnownTab) return;
	emit('update:modelValue', value);
}

/**
 * Keep the headless tab host aligned with the controlled Vue model.
 *
 * @param {string} value Active tab value.
 * @returns {void}
 */
function syncModelValue(value) {
	if (root.value && value && root.value.value !== value) root.value.value = value;
}
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
