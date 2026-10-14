<script setup>
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';

/**
 * Align and distribute buttons. The editor applies the result with
 * alignRects and distributeRects from alignGeometry.js.
 */
defineProps({
	disabled: { type: Boolean, default: false },
	distribute: { type: Boolean, default: false },
	target: { type: String, default: 'selection' },
});
const emit = defineEmits(['align', 'distribute']);

const alignments = [
	{ id: 'left', label: 'Align left', line: [2, 1, 2, 15], bars: [[4, 4, 9, 3], [4, 9, 5, 3]] },
	{ id: 'center', label: 'Align horizontal centres', line: [8, 1, 8, 15], bars: [[3.5, 4, 9, 3], [5.5, 9, 5, 3]] },
	{ id: 'right', label: 'Align right', line: [14, 1, 14, 15], bars: [[3, 4, 9, 3], [7, 9, 5, 3]] },
	{ id: 'top', label: 'Align top', line: [1, 2, 15, 2], bars: [[4, 4, 3, 9], [9, 4, 3, 5]] },
	{ id: 'middle', label: 'Align vertical centres', line: [1, 8, 15, 8], bars: [[4, 3.5, 3, 9], [9, 5.5, 3, 5]] },
	{ id: 'bottom', label: 'Align bottom', line: [1, 14, 15, 14], bars: [[4, 3, 3, 9], [9, 7, 3, 5]] },
];
const distributions = [
	{ id: 'horizontal', label: 'Distribute horizontal spacing', bars: [[2, 3, 2, 10], [7, 5, 2, 6], [12, 3, 2, 10]] },
	{ id: 'vertical', label: 'Distribute vertical spacing', bars: [[3, 2, 10, 2], [5, 7, 6, 2], [3, 12, 10, 2]] },
];
</script>

<template>
	<div class="flex flex-wrap items-center gap-0.5" role="toolbar" :aria-label="`Align to ${target}`">
		<button v-for="item in alignments" :key="item.id" type="button" class="grid size-7 place-items-center rounded text-muted-fg hover:bg-secondary hover:text-canvas-fg disabled:pointer-events-none disabled:opacity-40" :disabled="disabled" v-dom-tooltip="`${item.label} (to ${target})`" :aria-label="`${item.label} to ${target}`" @click="emit('align', item.id)">
			<svg viewBox="0 0 16 16" class="size-4" fill="currentColor" aria-hidden="true"><line :x1="item.line[0]" :y1="item.line[1]" :x2="item.line[2]" :y2="item.line[3]" stroke="currentColor" stroke-width="1.5" /><rect v-for="(bar, index) in item.bars" :key="index" :x="bar[0]" :y="bar[1]" :width="bar[2]" :height="bar[3]" rx="0.5" /></svg>
		</button>
		<template v-if="distribute">
			<span class="mx-1 h-5 border-l border-border" />
			<button v-for="item in distributions" :key="item.id" type="button" class="grid size-7 place-items-center rounded text-muted-fg hover:bg-secondary hover:text-canvas-fg disabled:pointer-events-none disabled:opacity-40" :disabled="disabled" v-dom-tooltip="item.label" :aria-label="item.label" @click="emit('distribute', item.id)">
				<svg viewBox="0 0 16 16" class="size-4" fill="currentColor" aria-hidden="true"><rect v-for="(bar, index) in item.bars" :key="index" :x="bar[0]" :y="bar[1]" :width="bar[2]" :height="bar[3]" rx="0.5" /></svg>
			</button>
		</template>
	</div>
</template>
