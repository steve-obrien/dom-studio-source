<script setup>
/** Canvas units: the stage is 1000 × 470 and every position below is in those units. */
const W = 1000;
const H = 470;
const NODE_W = 165;
const NODE_H = 64;
const nodes = [
	{ id: 'form', x: 10, y: 203, icon: '⇲', kind: 'Trigger', label: 'Web form', detail: 'New lead', status: 'done', time: '0 ms' },
	{ id: 'score', x: 200, y: 203, icon: '✦', kind: 'AI agent', label: 'Score lead', detail: 'Fit 86 · demo', status: 'done', time: '1.4 s', ai: true },
	{ id: 'route', x: 390, y: 203, icon: '⑂', kind: 'Switch', label: 'Route', detail: '3 outputs', status: 'done', time: '1 ms' },
	{ id: 'crm', x: 605, y: 40, icon: '◎', kind: 'CRM', label: 'Create deal', detail: 'Inbound', status: 'done', time: '310 ms' },
	{ id: 'slack', x: 820, y: 40, icon: '#', kind: 'Slack', label: 'Alert sales', detail: '#new-deals', status: 'done', time: '220 ms' },
	{ id: 'draft', x: 605, y: 203, icon: '✦', kind: 'AI agent', label: 'Draft reply', detail: 'Friendly tone', status: 'idle', ai: true },
	{ id: 'approve', x: 820, y: 203, icon: '✓', kind: 'Human', label: 'Approve', detail: 'Human step', status: 'idle' },
	{ id: 'spam', x: 605, y: 366, icon: '⌫', kind: 'Filter', label: 'Discard', detail: 'Spam or bots', status: 'idle' },
];
const edges = [
	{ from: 'form', to: 'score', active: true },
	{ from: 'score', to: 'route', active: true },
	{ from: 'route', to: 'crm', label: 'Hot', active: true },
	{ from: 'crm', to: 'slack', active: true },
	{ from: 'route', to: 'draft', label: 'Warm' },
	{ from: 'draft', to: 'approve' },
	{ from: 'route', to: 'spam', label: 'Spam' },
];
const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));

/** @param {object} edge Connection between two nodes. @returns {string} Cubic path from the right of one node to the left of the next. */
function path(edge) {
	const a = byId[edge.from];
	const b = byId[edge.to];
	const sx = a.x + NODE_W;
	const sy = a.y + NODE_H / 2;
	const tx = b.x;
	const ty = b.y + NODE_H / 2;
	const bend = (tx - sx) / 2;
	return `M${sx} ${sy} C${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}`;
}

/** @param {object} edge Labelled connection. @returns {object} Position of the label near the middle of the curve. */
function labelStyle(edge) {
	const a = byId[edge.from];
	const b = byId[edge.to];
	return { left: pct((a.x + NODE_W + b.x) / 2, W), top: pct((a.y + b.y) / 2 + NODE_H / 2, H) };
}

/** @param {number} value Canvas units. @param {number} total Axis length. @returns {string} CSS percentage. */
function pct(value, total) {
	return `${(value / total) * 100}%`;
}
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-xs">
			<span class="font-semibold">Lead intake</span>
			<span class="rounded-full bg-success/15 px-2 py-0.5 text-success">Run #482 · hot lead</span>
			<span class="ml-auto flex gap-2">
				<span class="rounded-md border border-border px-2.5 py-1.5">+ Add step</span>
				<span class="rounded-md bg-primary px-2.5 py-1.5 font-medium text-primary-fg">▶ Test workflow</span>
			</span>
		</div>
		<div class="overflow-x-auto">
			<div class="relative min-w-[720px] bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px]" :style="{ aspectRatio: `${W} / ${H}` }">
				<svg class="pointer-events-none absolute inset-0 size-full" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" aria-hidden="true">
					<path v-for="edge in edges" :key="`${edge.from}-${edge.to}`" :d="path(edge)" fill="none" :stroke="edge.active ? 'var(--color-success)' : 'var(--color-muted-fg)'" :stroke-width="edge.active ? 2 : 1.25" :stroke-dasharray="edge.active ? null : '4 4'" vector-effect="non-scaling-stroke" />
				</svg>
				<span v-for="edge in edges.filter((item) => item.label)" :key="edge.label" class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-canvas px-2 py-0.5 text-[0.62rem] font-medium" :class="edge.active && 'border-success/50 text-success'" :style="labelStyle(edge)">{{ edge.label }}</span>
				<div v-for="node in nodes" :key="node.id" class="absolute flex items-center gap-2 rounded-xl border bg-canvas px-2.5 shadow-sm" :class="node.status === 'done' ? 'border-success/60' : 'border-border'" :style="{ left: pct(node.x, W), top: pct(node.y, H), width: pct(NODE_W, W), height: pct(NODE_H, H) }">
					<span class="grid size-7 shrink-0 place-items-center rounded-lg text-sm" :class="node.ai ? 'bg-primary text-primary-fg' : 'bg-secondary text-canvas-fg'" aria-hidden="true">{{ node.icon }}</span>
					<span class="min-w-0 leading-tight">
						<span class="block text-[0.58rem] uppercase tracking-wider text-muted-fg">{{ node.kind }}</span>
						<span class="block truncate text-[0.72rem] font-semibold">{{ node.label }}</span>
						<span class="block truncate text-[0.6rem] text-muted-fg">{{ node.detail }}</span>
					</span>
					<span v-if="node.status === 'done'" class="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-success text-[0.55rem] text-success-fg" :title="node.time" aria-hidden="true">✓</span>
				</div>
			</div>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-fg">
			<span><span class="inline-block size-2 rounded-full bg-success align-middle"></span> Last run took the Hot path in 1.9 s</span>
			<span>Editable steps · connections · minimap · export</span>
		</div>
	</div>
</template>
