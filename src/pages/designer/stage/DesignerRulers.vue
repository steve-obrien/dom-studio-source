<script setup>
import { computed } from 'vue';

/**
 * Top and left rulers for a fixed-size artboard, in document pixels.
 *
 * Place it inside the scaled artwork's positioned wrapper. Ticks keep a
 * readable spacing at every zoom, and the selection's extent is highlighted
 * on both rulers.
 */
const props = defineProps({
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	scale: { type: Number, default: 1 },
	selection: { type: Object, default: null },
	size: { type: Number, default: 20 },
});

const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
const step = computed(() => steps.find((value) => value * props.scale >= 56) || steps[steps.length - 1]);
const minor = computed(() => step.value / (step.value * props.scale / 5 >= 6 ? 5 : 2));

/** Tick positions along one axis, in document pixels. */
function ticks(length) {
	const list = [];
	for (let value = 0; value <= length + 0.001; value += minor.value) list.push({ value: Math.round(value * 1000) / 1000, major: Math.abs(value / step.value - Math.round(value / step.value)) < 0.001 });
	return list;
}
const horizontal = computed(() => ticks(props.width));
const vertical = computed(() => ticks(props.height));
</script>

<template>
	<div aria-hidden="true" class="pointer-events-none select-none text-muted-fg">
		<svg class="absolute left-0 bg-canvas" :style="{ top: `${-size}px`, width: `${width * scale}px`, height: `${size}px` }">
			<rect v-if="selection" :x="selection.left * scale" y="0" :width="selection.width * scale" :height="size" class="fill-primary/15" />
			<line v-for="tick in horizontal" :key="tick.value" :x1="tick.value * scale" :x2="tick.value * scale" :y1="tick.major ? 0 : size * 0.65" :y2="size" stroke="currentColor" stroke-width="1" :opacity="tick.major ? 0.7 : 0.35" />
			<text v-for="tick in horizontal.filter((item) => item.major)" :key="`h${tick.value}`" :x="tick.value * scale + 3" y="9" font-size="9" fill="currentColor">{{ tick.value }}</text>
			<line x1="0" :x2="width * scale" :y1="size - 0.5" :y2="size - 0.5" stroke="currentColor" opacity="0.4" />
		</svg>
		<svg class="absolute top-0 bg-canvas" :style="{ left: `${-size}px`, width: `${size}px`, height: `${height * scale}px` }">
			<rect v-if="selection" x="0" :y="selection.top * scale" :width="size" :height="selection.height * scale" class="fill-primary/15" />
			<line v-for="tick in vertical" :key="tick.value" :y1="tick.value * scale" :y2="tick.value * scale" :x1="tick.major ? 0 : size * 0.65" :x2="size" stroke="currentColor" stroke-width="1" :opacity="tick.major ? 0.7 : 0.35" />
			<text v-for="tick in vertical.filter((item) => item.major)" :key="`v${tick.value}`" x="9" :y="tick.value * scale + 3" font-size="9" fill="currentColor" :transform="`rotate(-90 9 ${tick.value * scale + 3})`" text-anchor="end">{{ tick.value }}</text>
			<line :x1="size - 0.5" :x2="size - 0.5" y1="0" :y2="height * scale" stroke="currentColor" opacity="0.4" />
		</svg>
		<div class="absolute bg-canvas" :style="{ left: `${-size}px`, top: `${-size}px`, width: `${size}px`, height: `${size}px` }" />
	</div>
</template>
