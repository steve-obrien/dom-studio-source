<script setup>
import { computed, ref, watch } from 'vue';
import IconSegmented from '../_shared/IconSegmented.vue';
import InspectorIcon from '../_shared/InspectorIcon.vue';
import ScrubField from '../_shared/ScrubField.vue';
import AlignmentPad from './AlignmentPad.vue';
import { createFrameLayout } from './frameLayout.js';

defineOptions({ __doc: { name: 'Frame layout editor', description: 'Compact, Figma-style layout settings for flow, flex, grid and absolute frames: mode, direction, a 3×3 alignment pad, gap and per-side padding.' } });
const props = defineProps({
	modelValue: { type: Object, default: () => createFrameLayout() },
	title: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const modes = [
	{ value: 'flow', label: 'Flow: normal document flow', icon: 'mode-flow' },
	{ value: 'flex', label: 'Flex: auto layout in a row or column', icon: 'mode-flex' },
	{ value: 'grid', label: 'Grid: rows and columns', icon: 'mode-grid' },
	{ value: 'absolute', label: 'Absolute: place children freely', icon: 'mode-absolute' },
];
const directions = [
	{ value: 'row', label: 'Horizontal', icon: 'dir-row' },
	{ value: 'column', label: 'Vertical', icon: 'dir-column' },
];
const spacing = [
	{ label: 'Packed', value: 'packed' },
	{ label: 'Space between', value: 'space-between' },
	{ label: 'Space around', value: 'space-around' },
	{ label: 'Space evenly', value: 'space-evenly' },
];
const crossModes = [
	{ label: 'Align to pad', value: 'aligned' },
	{ label: 'Stretch', value: 'stretch' },
	{ label: 'Baseline', value: 'baseline' },
];
const selectClass = 'h-7 w-full min-w-0 rounded-md border-0 bg-secondary/60 px-2 text-xs text-canvas-fg outline-none ring-inset hover:ring-1 hover:ring-border focus:ring-1 focus:ring-primary';
const toggleClass = 'grid size-7 shrink-0 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-canvas-fg';

const layout = computed(() => createFrameLayout(props.modelValue));
const axis = computed(() => (layout.value.direction.startsWith('column') ? 'column' : 'row'));
const reversed = computed(() => layout.value.direction.endsWith('-reverse'));
const distribution = computed(() => (['start', 'center', 'end'].includes(layout.value.justify) ? 'packed' : layout.value.justify));
const crossMode = computed(() => (['stretch', 'baseline'].includes(layout.value.align) ? layout.value.align : 'aligned'));
const individual = ref(false);
const uneven = computed(() => layout.value.paddingLeft !== layout.value.paddingRight || layout.value.paddingTop !== layout.value.paddingBottom);
watch(uneven, (value) => { if (value) individual.value = true; }, { immediate: true });

/** Emits a fresh record; the host captures geometry before committing a mode change. */
function update(patch) {
	emit('update:modelValue', createFrameLayout({ ...layout.value, ...patch }));
}

function setDirection(value, reverse = reversed.value) {
	update({ direction: reverse ? `${value}-reverse` : value });
}

function setDistribution(value) {
	update({ justify: value === 'packed' ? 'start' : value });
}

function setCross(value) {
	update({ align: value === 'aligned' ? 'start' : value });
}

/** Sets one padding side, or a pair: `x` is left and right, `y` is top and bottom. */
function setPadding(side, value) {
	if (value === '' || !Number.isFinite(Number(value))) return;
	const amount = Math.max(0, Number(value));
	const sides = { x: ['paddingLeft', 'paddingRight'], y: ['paddingTop', 'paddingBottom'] }[side] || [side];
	update(Object.fromEntries(sides.map((key) => [key, amount])));
}

function pair(a, b) {
	return layout.value[a] === layout.value[b] ? layout.value[a] : '';
}

function togglePaddingSides() {
	if (individual.value && uneven.value) update({ paddingLeft: layout.value.paddingLeft, paddingRight: layout.value.paddingLeft, paddingTop: layout.value.paddingTop, paddingBottom: layout.value.paddingTop });
	individual.value = !individual.value;
}

/** Number of tracks in a grid template: `repeat(3, …)` or `120px 1fr 1fr`. */
function trackCount(template) {
	const text = String(template || '').trim();
	if (!text || text === 'none' || text === 'auto') return '';
	const repeat = /^repeat\(\s*(\d+)\s*,/.exec(text);
	if (repeat) return Number(repeat[1]);
	let depth = 0;
	let count = 1;
	for (const char of text.replace(/\s+/g, ' ')) {
		if (char === '(') depth += 1;
		else if (char === ')') depth -= 1;
		else if (/\s/.test(char) && depth === 0) count += 1;
	}
	return count;
}

function setTracks(key, value) {
	if (value === '' || !Number.isFinite(Number(value))) return;
	const count = Math.min(24, Math.max(1, Math.round(Number(value))));
	update({ [key]: key === 'columns' ? `repeat(${count}, minmax(0, 1fr))` : `repeat(${count}, auto)` });
}
</script>

<template>
	<div class="space-y-3 text-xs">
		<div class="flex items-center justify-between gap-2">
			<span v-if="title" class="text-[11px] font-semibold text-canvas-fg">{{ title }}</span>
			<IconSegmented :model-value="layout.mode" :options="modes" label="Child layout" @update:model-value="update({ mode: $event })" />
		</div>

		<template v-if="layout.mode === 'flex'">
			<div class="flex items-center gap-1">
				<IconSegmented :model-value="axis" :options="directions" label="Direction" @update:model-value="setDirection($event)" />
				<span class="flex-1"></span>
				<button type="button" :class="[toggleClass, reversed && 'bg-secondary text-canvas-fg']" :aria-pressed="reversed" aria-label="Reverse order" title="Reverse order" @click="setDirection(axis, !reversed)"><InspectorIcon name="reverse" /></button>
				<button type="button" :class="[toggleClass, layout.wrap === 'wrap' && 'bg-secondary text-canvas-fg']" :aria-pressed="layout.wrap === 'wrap'" aria-label="Wrap children" title="Wrap children" @click="update({ wrap: layout.wrap === 'wrap' ? 'nowrap' : 'wrap' })"><InspectorIcon name="wrap" /></button>
			</div>
			<div class="flex gap-2">
				<AlignmentPad :justify="layout.justify" :align="layout.align" :direction="layout.direction" @change="update($event)" />
				<div class="flex min-w-0 flex-1 flex-col gap-1.5">
					<ScrubField :model-value="layout.gap" :icon="axis === 'row' ? 'gap-x' : 'gap-y'" label="Gap between children" :min="0" @update:model-value="update({ gap: $event })" />
					<select :class="selectClass" :value="distribution" aria-label="Distribution along the main axis" title="Distribution along the main axis" @change="setDistribution($event.target.value)">
						<option v-for="option in spacing" :key="option.value" :value="option.value">{{ option.label }}</option>
					</select>
					<select :class="selectClass" :value="crossMode" aria-label="Cross-axis alignment" title="Cross-axis alignment" @change="setCross($event.target.value)">
						<option v-for="option in crossModes" :key="option.value" :value="option.value">{{ option.label }}</option>
					</select>
				</div>
			</div>
		</template>

		<template v-else-if="layout.mode === 'grid'">
			<div class="grid grid-cols-2 gap-1.5">
				<ScrubField :model-value="trackCount(layout.columns)" icon="columns" label="Columns" :min="1" :max="24" placeholder="Auto" @update:model-value="setTracks('columns', $event)" />
				<ScrubField :model-value="trackCount(layout.rows)" icon="rows" label="Rows" :min="1" :max="24" placeholder="Auto" @update:model-value="setTracks('rows', $event)" />
			</div>
			<div class="flex gap-2">
				<AlignmentPad axis="grid" :justify="layout.justifyItems" :align="layout.align" @change="update({ justifyItems: $event.justify, align: $event.align })" />
				<div class="flex min-w-0 flex-1 flex-col gap-1.5">
					<ScrubField :model-value="layout.gap" icon="gap-x" label="Gap between cells" :min="0" @update:model-value="update({ gap: $event })" />
					<select :class="selectClass" :value="layout.autoFlow" aria-label="Auto flow" title="Auto flow" @change="update({ autoFlow: $event.target.value })">
						<option v-for="value in ['row', 'column', 'row dense', 'column dense']" :key="value" :value="value">Flow {{ value }}</option>
					</select>
					<select :class="selectClass" :value="['stretch', 'baseline'].includes(layout.align) || layout.justifyItems === 'stretch' ? 'stretch' : 'aligned'" aria-label="Cell alignment" title="Cell alignment" @change="$event.target.value === 'stretch' ? update({ justifyItems: 'stretch', align: 'stretch' }) : update({ justifyItems: 'start', align: 'start' })">
						<option value="aligned">Align to pad</option>
						<option value="stretch">Fill cells</option>
					</select>
				</div>
			</div>
			<details class="group/tracks rounded-md">
				<summary class="cursor-pointer select-none text-[11px] text-muted-fg hover:text-canvas-fg">Track templates</summary>
				<div class="mt-2 space-y-1.5">
					<label class="block"><span class="mb-0.5 block text-[11px] text-muted-fg">Columns</span><input :class="[selectClass, 'font-mono']" :value="layout.columns" spellcheck="false" @change="update({ columns: $event.target.value })"></label>
					<label class="block"><span class="mb-0.5 block text-[11px] text-muted-fg">Rows</span><input :class="[selectClass, 'font-mono']" :value="layout.rows" spellcheck="false" @change="update({ rows: $event.target.value })"></label>
					<label class="block"><span class="mb-0.5 block text-[11px] text-muted-fg">Justify content</span>
						<select :class="selectClass" :value="layout.justify" @change="update({ justify: $event.target.value })"><option v-for="value in ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly']" :key="value" :value="value">{{ value }}</option></select>
					</label>
				</div>
			</details>
		</template>

		<p v-else class="text-[11px] leading-4 text-muted-fg">{{ layout.mode === 'absolute' ? 'Children move freely inside this frame. Drag them on the canvas, or set X and Y on a child.' : 'Children follow normal document flow. Their margins and widths control spacing.' }}</p>

		<div class="space-y-1.5">
			<div class="flex items-center justify-between">
				<span class="text-[11px] text-muted-fg">Padding</span>
				<button type="button" :class="[toggleClass, 'size-6', individual && 'bg-secondary text-canvas-fg']" :aria-pressed="individual" aria-label="Padding per side" title="Padding per side" @click="togglePaddingSides"><InspectorIcon name="padding-sides" /></button>
			</div>
			<div v-if="individual" class="grid grid-cols-2 gap-1.5">
				<ScrubField :model-value="layout.paddingTop" prefix="T" label="Top padding" :min="0" @update:model-value="setPadding('paddingTop', $event)" />
				<ScrubField :model-value="layout.paddingRight" prefix="R" label="Right padding" :min="0" @update:model-value="setPadding('paddingRight', $event)" />
				<ScrubField :model-value="layout.paddingBottom" prefix="B" label="Bottom padding" :min="0" @update:model-value="setPadding('paddingBottom', $event)" />
				<ScrubField :model-value="layout.paddingLeft" prefix="L" label="Left padding" :min="0" @update:model-value="setPadding('paddingLeft', $event)" />
			</div>
			<div v-else class="grid grid-cols-2 gap-1.5">
				<ScrubField :model-value="pair('paddingLeft', 'paddingRight')" icon="padding-x" label="Horizontal padding" placeholder="Mixed" :min="0" @update:model-value="setPadding('x', $event)" />
				<ScrubField :model-value="pair('paddingTop', 'paddingBottom')" icon="padding-y" label="Vertical padding" placeholder="Mixed" :min="0" @update:model-value="setPadding('y', $event)" />
			</div>
		</div>
	</div>
</template>
