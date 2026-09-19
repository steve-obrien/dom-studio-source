<script setup>
import { computed } from 'vue';
const props = defineProps({ matches: { type: Object, default: () => ({}) }, scale: { type: Number, default: 1 } });
const unit = computed(() => 1 / Math.max(props.scale, 0.001));
const measures = computed(measurements);

/** Projects the reference and repeated gaps into non-interactive stage-coordinate rulers. */
function measurements() {
	return ['x', 'y'].flatMap((axis) => {
		const match = props.matches[axis];
		if (match?.kind !== 'spacing') return [];
		return [match.reference, [match.neighbour, match.target]].map(([from, to]) => ({
			axis, from: Math.min(from, to), to: Math.max(from, to), cross: match.cross,
			label: `${Math.round(match.gap * 100) / 100}px`,
		}));
	});
}
</script>

<template>
	<svg v-if="measures.length" class="absolute inset-0 h-full w-full overflow-visible text-primary" aria-hidden="true">
		<g v-for="(measure, index) in measures" :key="index" :stroke-width="unit" stroke="currentColor" fill="none">
			<template v-if="measure.axis === 'x'">
				<path :d="`M${measure.from},${measure.cross}H${measure.to} M${measure.from},${measure.cross - 4 * unit}v${8 * unit} M${measure.to},${measure.cross - 4 * unit}v${8 * unit}`" />
				<text :x="(measure.from + measure.to) / 2" :y="measure.cross - 7 * unit" text-anchor="middle" :font-size="11 * unit" :stroke-width="3 * unit" stroke="var(--canvas)" fill="currentColor" paint-order="stroke">{{ measure.label }}</text>
			</template>
			<template v-else>
				<path :d="`M${measure.cross},${measure.from}V${measure.to} M${measure.cross - 4 * unit},${measure.from}h${8 * unit} M${measure.cross - 4 * unit},${measure.to}h${8 * unit}`" />
				<text :x="measure.cross + 7 * unit" :y="(measure.from + measure.to) / 2" dominant-baseline="middle" :font-size="11 * unit" :stroke-width="3 * unit" stroke="var(--canvas)" fill="currentColor" paint-order="stroke">{{ measure.label }}</text>
			</template>
		</g>
	</svg>
</template>
