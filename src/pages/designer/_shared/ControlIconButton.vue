<script setup>
import { computed } from 'vue';
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';
import InspectorIcon from './InspectorIcon.vue';

/** Small inspector icon button with a tooltip. `remove` shows Figma's minus. */
const props = defineProps({
	icon: { type: String, required: true },
	label: { type: String, required: true },
	pressed: { type: Boolean, default: null },
});
const iconName = computed(() => (props.icon === 'remove' ? 'minus' : props.icon));
</script>

<template>
	<button
		type="button"
		class="grid size-6 shrink-0 place-items-center rounded text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
		:class="pressed && 'bg-canvas text-canvas-fg shadow-sm ring-1 ring-border'"
		:aria-label="label"
		:aria-pressed="pressed ?? undefined"
		v-dom-tooltip="label"
	>
		<InspectorIcon :name="iconName" />
	</button>
</template>
