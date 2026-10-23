<script setup>
const DAYS = 14;
const days = Array.from({ length: DAYS }, (_, index) => ({ label: 'MTWTFSS'[index % 7], date: ((19 + index) % 31) + 1, weekend: index % 7 >= 5 }));
const rows = [
	{ name: 'Aisha Khan', role: 'Design', initials: 'AK', color: 'var(--chart-1)', items: [{ title: 'Brand refresh', start: 0, length: 4 }, { title: 'Checkout UI', start: 7, length: 4 }] },
	{ name: 'Sam Ortiz', role: 'Engineering', initials: 'SO', color: 'var(--chart-2)', items: [{ title: 'Payments API', start: 1, length: 6, dragging: true }, { title: 'Release', start: 9, length: 3 }] },
	{ name: 'Jo Lee', role: 'Content', initials: 'JL', color: 'var(--chart-4)', items: [{ title: 'Launch copy', start: 2, length: 3 }, { title: 'Help centre', start: 3, length: 5, lane: 1 }, { title: 'Newsletter', start: 9, length: 2 }] },
	{ name: 'Room 2.04', role: 'Meeting room', initials: '2.04', color: 'var(--chart-3)', items: [{ title: 'Sprint review', start: 2, length: 2 }, { title: 'Workshop', start: 7, length: 2 }], draft: { start: 10, length: 2 } },
];

/** @param {number} day Day offset. @returns {string} Horizontal position as a percentage of the timeline. */
function x(day) {
	return `${(day / DAYS) * 100}%`;
}

/** @param {object} row Resource row. @returns {number} Number of stacked lanes needed for overlapping items. */
function lanes(row) {
	return Math.max(...row.items.map((item) => (item.lane || 0) + 1));
}
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-xs">
			<span class="font-semibold">Team resources</span>
			<span class="text-muted-fg">20 Oct – 2 Nov</span>
			<span class="ml-auto inline-flex rounded-md border border-border p-0.5">
				<span class="px-2 py-1 text-muted-fg">Hours</span>
				<span class="rounded bg-secondary px-2 py-1 font-medium">Days</span>
				<span class="px-2 py-1 text-muted-fg">Weeks</span>
				<span class="px-2 py-1 text-muted-fg">Months</span>
			</span>
		</div>
		<div class="overflow-x-auto">
			<div class="grid min-w-[640px] grid-cols-[11rem_minmax(0,1fr)] text-xs">
				<div class="border-b border-r border-border px-4 py-2 font-medium text-muted-fg">Resource</div>
				<div class="grid border-b border-border" :style="{ gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` }">
					<div v-for="day in days" :key="day.date" class="py-1 text-center leading-tight" :class="day.weekend ? 'text-muted-fg/60' : 'text-muted-fg'">
						<div class="text-[0.6rem]">{{ day.label }}</div>
						<div class="font-medium">{{ day.date }}</div>
					</div>
				</div>
				<template v-for="row in rows" :key="row.name">
					<div class="flex items-center gap-2.5 border-b border-r border-border px-4" :style="{ height: `${lanes(row) * 2.25 + 1}rem` }">
						<span class="grid size-7 shrink-0 place-items-center rounded-full text-[0.55rem] font-semibold text-canvas" :style="{ background: row.color }">{{ row.initials }}</span>
						<span class="min-w-0 leading-tight"><span class="block truncate font-medium">{{ row.name }}</span><span class="text-[0.65rem] text-muted-fg">{{ row.role }}</span></span>
					</div>
					<div class="relative border-b border-border">
						<div class="absolute inset-0 grid" :style="{ gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` }" aria-hidden="true">
							<div v-for="day in days" :key="day.date" class="border-r border-border/40" :class="day.weekend && 'bg-secondary/50'"></div>
						</div>
						<div v-for="item in row.items" :key="item.title" class="absolute flex h-7 items-center overflow-hidden rounded-md border-l-[3px] px-2 text-[0.68rem] font-medium" :class="item.dragging && 'z-10 -translate-y-0.5 shadow-lg ring-2 ring-ring'" :style="{ top: `${(item.lane || 0) * 2.25 + 0.5}rem`, left: x(item.start), width: `calc(${x(item.length)} - 3px)`, borderColor: row.color, background: `color-mix(in oklab, ${row.color} 22%, var(--color-canvas))` }">
							<span class="truncate">{{ item.title }}</span>
							<span v-if="item.dragging" class="absolute inset-y-1 right-0.5 w-1 rounded-full border-r-2 border-dotted border-canvas-fg/50" aria-hidden="true"></span>
						</div>
						<div v-if="row.draft" class="absolute top-2 flex h-7 items-center justify-center rounded-md border-2 border-dashed border-ring bg-ring/10 text-[0.65rem] font-medium text-ring" :style="{ left: x(row.draft.start), width: x(row.draft.length) }">+ New booking</div>
					</div>
				</template>
			</div>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-fg">
			<span>Draw to create · drag between rows · resize · overlaps stack</span>
			<span>Week planner · Month calendar · Gantt · Resources</span>
		</div>
	</div>
</template>
