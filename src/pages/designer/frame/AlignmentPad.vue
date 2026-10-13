<script setup>
import { computed } from 'vue';

/**
 * Figma-style 3×3 alignment pad for a flex or grid frame.
 *
 * Columns are the horizontal position and rows the vertical one. In a row,
 * horizontal is `justify` and vertical is `align`; in a column they swap. When
 * the main axis is distributed (space-between and friends) or the cross axis
 * stretches, a whole line of cells lights up and a click changes only the
 * other axis. Grid frames pass `axis="grid"`: horizontal is `justifyItems`,
 * vertical is `align`.
 */
const props = defineProps({
	justify: { type: String, default: 'start' },
	align: { type: String, default: 'stretch' },
	direction: { type: String, default: 'row' },
	axis: { type: String, default: 'flex' },
});
const emit = defineEmits(['change']);
const positions = ['start', 'center', 'end'];
const words = { start: ['left', 'top'], center: ['centre', 'middle'], end: ['right', 'bottom'] };

const column = computed(() => props.axis === 'flex' && props.direction.startsWith('column'));
const horizontal = computed(() => (column.value ? props.align : props.justify));
const vertical = computed(() => (column.value ? props.justify : props.align));
const distributed = computed(() => props.axis === 'flex' && !positions.includes(props.justify));

function lit(value, line) {
	return positions.includes(value) ? value === line : true;
}

function active(x, y) {
	return lit(horizontal.value, x) && lit(vertical.value, y);
}

function pick(x, y) {
	const next = column.value ? { justify: y, align: x } : { justify: x, align: y };
	if (distributed.value) next.justify = props.justify;
	emit('change', next);
}

/** Bars that preview the alignment inside an active cell. */
function bars(x, y) {
	const across = column.value;
	const lengths = [4, 7, 5];
	return lengths.map((size, index) => {
		const offset = 3 + index * 3;
		if (!across) {
			const top = (vertical.value === 'stretch' ? 1.5 : y === 'start' ? 2 : y === 'end' ? 14 - size : 8 - size / 2);
			return { x: offset - 0.75, y: top, width: 1.5, height: vertical.value === 'stretch' ? 13 : size };
		}
		const left = (horizontal.value === 'stretch' ? 1.5 : x === 'start' ? 2 : x === 'end' ? 14 - size : 8 - size / 2);
		return { x: left, y: offset - 0.75, width: horizontal.value === 'stretch' ? 13 : size, height: 1.5 };
	});
}
</script>

<template>
	<div class="grid size-[5.25rem] shrink-0 grid-cols-3 grid-rows-3 rounded-md bg-secondary/60 p-1" role="group" aria-label="Alignment">
		<template v-for="y in positions" :key="y">
			<button
				v-for="x in positions"
				:key="`${x}-${y}`"
				type="button"
				class="group/cell grid place-items-center rounded text-primary"
				:aria-label="`Align ${words[y][1]} ${words[x][0]}`"
				:title="`Align ${words[y][1]} ${words[x][0]}`"
				:aria-pressed="active(x, y)"
				@click="pick(x, y)"
			>
				<svg v-if="active(x, y)" viewBox="0 0 16 16" class="size-4" aria-hidden="true">
					<rect v-for="(bar, index) in bars(x, y)" :key="index" v-bind="bar" rx="0.75" fill="currentColor" />
				</svg>
				<span v-else class="size-1 rounded-full bg-muted-fg/50 transition group-hover/cell:size-1.5 group-hover/cell:bg-primary/60" aria-hidden="true"></span>
			</button>
		</template>
	</div>
</template>
