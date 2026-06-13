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

const typeIcon = {
	agent: 'M5 12a7 7 0 1 0 14 0 7 7 0 0 0-14 0Zm5-2h4M9 14h6M12 5v3',
	model: 'M5 5h14v11H8l-3 3V5Zm4 4h6M9 12h4',
	tool: 'M14 6l4 4-8 8H6v-4l8-8Zm1 3l-6 6',
	memory: 'M6 5h12v14H6V5Zm3 3h6M9 12h6M9 16h4',
	guardrail: 'M12 4l7 3v5c0 4-2.7 7-7 8-4.3-1-7-4-7-8V7l7-3Z',
};

const toneByStatus = {
	ok: 'success',
	warning: 'warning',
	failed: 'danger',
	running: 'info',
};

const barStyle = computed(() => {
	const total = Math.max(1, Number(props.totalDuration));
	const left = Math.max(0, (Number(props.item.startMs) / total) * 100);
	const width = Math.max(2, (Number(props.item.durationMs) / total) * 100);

	return {
		left: `${Math.min(left, 98)}%`,
		width: `${Math.min(width, 100 - Math.min(left, 98))}%`,
	};
});

const barToneClass = computed(() => ({
	ok: 'bg-success',
	warning: 'bg-warning',
	failed: 'bg-destructive',
	running: 'bg-primary',
}[props.item.status] || 'bg-muted-fg'));
</script>

<template>
	<div class="grid min-h-16 w-full min-w-0 items-center gap-3 px-2 py-2 sm:grid-cols-[minmax(15rem,0.95fr)_minmax(14rem,1fr)]">
		<div class="flex min-w-0 items-center gap-2">
			<button
				v-if="item.children?.length"
				type="button"
				class="grid size-8 shrink-0 place-items-center rounded-lg text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 group-aria-selected:text-primary-fg"
				:aria-label="open ? 'Collapse span' : 'Expand span'"
				@click.stop="toggle?.()"
			>
				<svg viewBox="0 0 20 20" class="size-4 transition" :class="open && 'rotate-90'" fill="none" aria-hidden="true">
					<path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<span v-else class="size-8 shrink-0" aria-hidden="true"></span>

			<span class="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-canvas text-muted-fg group-aria-selected:border-primary-fg/30 group-aria-selected:bg-primary-fg/10 group-aria-selected:text-primary-fg">
				<svg viewBox="0 0 24 24" class="size-4.5" fill="none" aria-hidden="true">
					<path :d="typeIcon[item.type] || typeIcon.tool" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</span>

			<div class="min-w-0 flex-1">
				<div class="flex min-w-0 flex-wrap items-center gap-2">
					<p class="truncate text-sm font-semibold text-canvas-fg group-aria-selected:text-primary-fg">{{ item.name }}</p>
					<DomStatusPill :tone="toneByStatus[item.status] || 'neutral'" size="sm" :pulse="item.status === 'running'">
						{{ item.statusLabel }}
					</DomStatusPill>
				</div>
				<p class="mt-1 truncate text-xs text-muted-fg group-aria-selected:text-primary-fg/75">
					{{ item.description }}
				</p>
			</div>
		</div>

		<div class="min-w-0">
			<div class="flex items-center justify-between gap-2 text-[11px] text-muted-fg group-aria-selected:text-primary-fg/75">
				<span>{{ item.durationMs }}ms</span>
				<span>{{ item.cost }}</span>
			</div>
			<DomTooltip :text="`${item.name} started at ${item.startMs}ms and ran for ${item.durationMs}ms`" placement="top">
				<div class="relative mt-2 h-7 overflow-hidden rounded-full border border-border bg-secondary/70">
					<div class="absolute inset-y-1 rounded-full shadow-sm" :class="barToneClass" :style="barStyle"></div>
					<div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border/80"></div>
				</div>
			</DomTooltip>
			<div class="mt-2 flex flex-wrap gap-1.5">
				<DomBadge v-for="tag in item.tags" :key="tag" size="sm" variant="outline">{{ tag }}</DomBadge>
			</div>
		</div>
	</div>
</template>
