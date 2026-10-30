<script setup>
import { computed } from 'vue';
import { DomBadge, DomStatusPill, DomTooltip } from '@getdom/studio/vue';

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	open: {
		type: Boolean,
		default: false,
	},
	selected: {
		type: Boolean,
		default: false,
	},
	totalDuration: {
		type: Number,
		required: true,
	},
	toggle: {
		type: Function,
		default: null,
	},
});

const barStyle = computed(getBarStyle);
const barToneClass = computed(getBarToneClass);

/**
 * Positions the span inside the full-run timeline.
 *
 * @returns {{ left: string, width: string }} Timeline bar style.
 */
function getBarStyle() {
	const total = Math.max(1, Number(props.totalDuration));
	const left = Math.max(0, (Number(props.item.startMs) / total) * 100);
	const width = Math.max(1.5, (Number(props.item.durationMs) / total) * 100);
	const safeLeft = Math.min(left, 98);
	return {
		left: `${safeLeft}%`,
		width: `${Math.min(width, 100 - safeLeft)}%`,
	};
}

/**
 * Returns a semantic timeline bar for the span outcome.
 *
 * @returns {string} Tailwind classes.
 */
function getBarToneClass() {
	return {
		ok: 'bg-success',
		warning: 'bg-warning',
		failed: 'bg-destructive',
		running: 'bg-primary',
	}[props.item.status] || 'bg-muted-fg';
}

/**
 * Formats a US-dollar span cost.
 *
 * @param {number} value Dollar amount.
 * @returns {string} Currency label.
 */
function formatCost(value) {
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 3 }).format(Number(value || 0));
}
</script>

<template>
	<div class="grid min-h-15 w-full min-w-0 items-center border-l-2 px-3 py-2.5 transition md:grid-cols-[minmax(16rem,0.9fr)_minmax(18rem,1fr)] md:gap-5" :class="selected ? 'border-l-primary bg-primary/7' : 'border-l-transparent hover:bg-secondary/35'">
		<div class="flex min-w-0 items-center gap-2.5">
			<button v-if="item.children?.length" type="button" class="shrink-0 rounded-md px-1.5 py-1 text-[10px] font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" :aria-label="open ? 'Collapse span' : 'Expand span'" @click.stop="toggle?.()">
				{{ open ? 'Hide' : 'Show' }}
			</button>
			<span v-else class="w-9 shrink-0" aria-hidden="true"></span>
			<div class="min-w-0 flex-1">
				<div class="flex min-w-0 items-center gap-2">
					<DomBadge size="sm" variant="outline">{{ item.type }}</DomBadge>
					<p class="truncate text-xs font-semibold sm:text-sm">{{ item.name }}</p>
					<DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill>
				</div>
				<p class="mt-1 truncate text-[11px] text-muted-fg">{{ item.summary }}</p>
				<div class="mt-1.5 text-[11px] text-muted-fg md:hidden">{{ item.durationMs }}ms · {{ formatCost(item.costUsd) }}</div>
			</div>
		</div>

		<div class="hidden min-w-0 md:block">
			<div class="flex items-center justify-between gap-3 text-[10px] text-muted-fg"><span>{{ item.startMs }}ms → {{ item.startMs + item.durationMs }}ms</span><span>{{ item.durationMs }}ms · {{ formatCost(item.costUsd) }}</span></div>
			<DomTooltip class="block w-full" :text="`${item.name}: ${item.durationMs}ms from ${item.startMs}ms`" placement="top">
				<div class="relative mt-2 h-4 w-full overflow-hidden border-y border-border bg-secondary/55">
					<div class="absolute inset-y-0.5 rounded-sm" :class="barToneClass" :style="barStyle"></div>
					<div class="pointer-events-none absolute inset-y-0 left-1/3 border-l border-border/80"></div>
					<div class="pointer-events-none absolute inset-y-0 left-2/3 border-l border-border/80"></div>
				</div>
			</DomTooltip>
		</div>
	</div>
</template>
