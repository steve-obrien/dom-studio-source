<script setup>
import { computed, ref } from 'vue';

/**
 * Two flows on the same canvas: an n8n-style AI lead flow and the db3 Dock
 * server routes diagram. Positions are in stage units (1000 wide).
 */
const W = 1000;
const MAIN = { w: 165, h: 64 };
const SUB = { w: 140, h: 46 };
const flows = {
	lead: {
		label: 'AI lead flow',
		title: 'Lead intake',
		badge: 'Run #482 · hot lead',
		footer: 'Last run took the Hot path in 1.9 s',
		height: 500,
		nodes: [
			{ id: 'form', x: 10, y: 170, icon: '⇲', kind: 'Trigger', label: 'Web form', detail: 'New lead', status: 'done' },
			{ id: 'score', x: 200, y: 170, icon: '✦', kind: 'AI agent', label: 'Score lead', detail: 'Fit 86 · demo', status: 'done', ai: true },
			{ id: 'route', x: 390, y: 170, icon: '⑂', kind: 'Switch', label: 'Route', detail: '3 outputs', status: 'done' },
			{ id: 'crm', x: 605, y: 30, icon: '◎', kind: 'CRM', label: 'Create deal', detail: 'Inbound', status: 'done' },
			{ id: 'slack', x: 820, y: 30, icon: '#', kind: 'Slack', label: 'Alert sales', detail: '#new-deals', status: 'done' },
			{ id: 'draft', x: 605, y: 170, icon: '✦', kind: 'AI agent', label: 'Draft reply', detail: 'Friendly tone', ai: true },
			{ id: 'approve', x: 820, y: 170, icon: '✓', kind: 'Human', label: 'Approve', detail: 'Human step' },
			{ id: 'spam', x: 605, y: 310, icon: '⌫', kind: 'Filter', label: 'Discard', detail: 'Spam or bots' },
			{ id: 'model', sub: true, x: 10, y: 330, icon: '◇', kind: 'Model', label: 'Claude' },
			{ id: 'memory', sub: true, x: 160, y: 330, icon: '▤', kind: 'Data', label: 'CRM notes' },
			{ id: 'lookup', sub: true, x: 310, y: 330, icon: '⌕', kind: 'Tool', label: 'Search' },
			{ id: 'icp', sub: true, x: 460, y: 330, icon: '¶', kind: 'Docs', label: 'ICP guide' },
		],
		edges: [
			{ from: 'form', to: 'score', state: 'active' },
			{ from: 'score', to: 'route', state: 'active' },
			{ from: 'route', to: 'crm', label: 'Hot', state: 'active' },
			{ from: 'crm', to: 'slack', state: 'active' },
			{ from: 'route', to: 'draft', label: 'Warm', state: 'idle' },
			{ from: 'draft', to: 'approve', state: 'idle' },
			{ from: 'route', to: 'spam', label: 'Spam', state: 'idle' },
			{ from: 'score', to: 'model', state: 'sub' },
			{ from: 'score', to: 'memory', state: 'sub' },
			{ from: 'score', to: 'lookup', state: 'sub' },
			{ from: 'score', to: 'icp', state: 'sub' },
		],
		legend: [['active', 'Ran'], ['idle', 'Not taken'], ['sub', 'Attached to the agent']],
	},
	routes: {
		label: 'Server routes',
		title: 'Demo server',
		badge: '6 / 8 running',
		footer: 'From db3 Dock: how requests reach each container',
		height: 470,
		nodeWidth: 190,
		nodes: [
			{ id: 'app', x: 10, y: 40, icon: '◍', kind: 'Hostname', label: 'app.acme.io', detail: 'HTTPS' },
			{ id: 'api', x: 10, y: 180, icon: '◍', kind: 'Hostname', label: 'api.acme.io', detail: 'HTTPS' },
			{ id: 'port', x: 10, y: 340, icon: '⌁', kind: 'Port', label: ':8443', detail: 'Published' },
			{ id: 'tunnel', x: 250, y: 110, icon: '⇢', kind: 'Tunnel', label: 'cloudflared', detail: '2 hostnames', status: 'live' },
			{ id: 'gateway', x: 500, y: 220, icon: '⑂', kind: 'Proxy', label: 'gateway-1', detail: 'nginx · 4 rules', status: 'live' },
			{ id: 'blue', x: 795, y: 90, icon: '▤', kind: 'Slot', label: 'acme-blue', detail: '3 / 3 running', status: 'live', tint: 'blue' },
			{ id: 'green', x: 795, y: 330, icon: '▤', kind: 'Slot', label: 'acme-green', detail: 'api stopped · 1 / 3', status: 'standby', tint: 'green' },
		],
		edges: [
			{ from: 'app', to: 'tunnel', state: 'live' },
			{ from: 'api', to: 'tunnel', state: 'live' },
			{ from: 'tunnel', to: 'gateway', state: 'live' },
			{ from: 'port', to: 'gateway', state: 'live' },
			{ from: 'gateway', to: 'blue', state: 'live' },
			{ from: 'gateway', to: 'green', state: 'standby' },
		],
		legend: [['live', 'Live (moving)'], ['standby', 'Previous upstream']],
	},
};
const STROKES = {
	active: { color: 'var(--color-success)', width: 2 },
	idle: { color: 'var(--color-muted-fg)', width: 1.25, dash: '4 4' },
	sub: { color: 'var(--color-muted-fg)', width: 1.25, dash: '2 3' },
	live: { color: 'var(--color-canvas-fg)', width: 1.75, dash: '6 6', moving: true },
	standby: { color: 'var(--color-warning)', width: 1.5, dash: '5 4' },
};
const active = ref('lead');
const flow = computed(() => flows[active.value]);
const byId = computed(() => Object.fromEntries(flow.value.nodes.map((node) => [node.id, node])));

/** @param {object} node Flow node. @returns {{ w: number, h: number }} Node size in stage units. */
function size(node) {
	if (node.sub) return SUB;
	return { ...MAIN, w: flow.value.nodeWidth || MAIN.w };
}

/** @param {object} edge Connection. @returns {string} Cubic path; agent attachments leave from the bottom, everything else left to right. */
function path(edge) {
	const a = byId.value[edge.from];
	const b = byId.value[edge.to];
	if (edge.state === 'sub') {
		const sx = a.x + size(a).w / 2;
		const sy = a.y + size(a).h;
		const tx = b.x + size(b).w / 2;
		return `M${sx} ${sy} C${sx} ${sy + 50}, ${tx} ${b.y - 50}, ${tx} ${b.y}`;
	}
	const sx = a.x + size(a).w;
	const sy = a.y + size(a).h / 2;
	const tx = b.x;
	const ty = b.y + size(b).h / 2;
	const bend = (tx - sx) / 2;
	return `M${sx} ${sy} C${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}`;
}

/** @param {object} edge Labelled connection. @returns {object} Label position near the middle of the curve. */
function labelStyle(edge) {
	const a = byId.value[edge.from];
	const b = byId.value[edge.to];
	return { left: pct((a.x + size(a).w + b.x) / 2, W), top: pct((a.y + b.y) / 2 + MAIN.h / 2, flow.value.height) };
}

/** @param {object} node Flow node. @returns {object} Absolute box in percentages of the stage. */
function box(node) {
	const { w, h } = size(node);
	return { left: pct(node.x, W), top: pct(node.y, flow.value.height), width: pct(w, W), height: pct(h, flow.value.height) };
}

/** @param {number} value Stage units. @param {number} total Axis length. @returns {string} CSS percentage. */
function pct(value, total) {
	return `${(value / total) * 100}%`;
}

/** @param {object} node Flow node. @returns {string} Border classes for its run or route state. */
function border(node) {
	if (node.tint === 'blue' && node.status === 'live') return 'border-l-4 border-l-[var(--chart-1)] border-border';
	if (node.tint === 'green') return 'border-l-4 border-l-[var(--chart-2)] border-dashed border-border';
	if (node.status === 'done') return 'border-success/60';
	return 'border-border';
}
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 text-xs">
			<span class="inline-flex rounded-md border border-border p-0.5" role="tablist" aria-label="Example flows">
				<button v-for="(item, key) in flows" :key="key" type="button" role="tab" class="rounded px-2.5 py-1" :class="active === key ? 'bg-secondary font-medium' : 'text-muted-fg'" :aria-selected="active === key" @click="active = key">{{ item.label }}</button>
			</span>
			<span class="font-semibold">{{ flow.title }}</span>
			<span class="rounded-full bg-success/15 px-2 py-0.5 text-success">{{ flow.badge }}</span>
		</div>
		<div class="overflow-x-auto">
			<div class="relative min-w-[720px] bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px]" :style="{ aspectRatio: `${W} / ${flow.height}` }">
				<svg class="pointer-events-none absolute inset-0 size-full" :viewBox="`0 0 ${W} ${flow.height}`" preserveAspectRatio="none" aria-hidden="true">
					<path v-for="edge in flow.edges" :key="`${active}-${edge.from}-${edge.to}`" :d="path(edge)" fill="none" :stroke="STROKES[edge.state].color" :stroke-width="STROKES[edge.state].width" :stroke-dasharray="STROKES[edge.state].dash" :class="STROKES[edge.state].moving && 'home-flow-moving'" vector-effect="non-scaling-stroke" />
				</svg>
				<span v-for="edge in flow.edges.filter((item) => item.label)" :key="`${active}-${edge.label}`" class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-canvas px-2 py-0.5 text-[0.62rem] font-medium" :class="edge.state === 'active' ? 'border-success/50 text-success' : 'border-border'" :style="labelStyle(edge)">{{ edge.label }}</span>
				<div v-for="node in flow.nodes" :key="`${active}-${node.id}`" class="absolute flex items-center gap-2 border bg-canvas shadow-sm" :class="[border(node), node.sub ? 'rounded-full px-2' : 'rounded-xl px-2.5']" :style="box(node)">
					<span class="grid shrink-0 place-items-center text-sm" :class="[node.sub ? 'size-6 rounded-full' : 'size-7 rounded-lg', node.ai ? 'bg-primary text-primary-fg' : 'bg-secondary text-canvas-fg']" aria-hidden="true">{{ node.icon }}</span>
					<span class="min-w-0 flex-1 leading-tight">
						<span class="flex items-center gap-1.5 text-[0.55rem] uppercase tracking-wider text-muted-fg">{{ node.kind }}<span v-if="node.status === 'live' || node.status === 'standby'" class="rounded px-1 text-[0.5rem] font-bold tracking-normal" :class="node.status === 'live' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'">{{ node.status.toUpperCase() }}</span></span>
						<span class="block truncate text-[0.7rem] font-semibold">{{ node.label }}</span>
						<span v-if="node.detail" class="block truncate text-[0.6rem]" :class="node.status === 'standby' ? 'text-destructive' : 'text-muted-fg'">{{ node.detail }}</span>
					</span>
					<span v-if="node.status === 'done'" class="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-success text-[0.55rem] text-success-fg" aria-hidden="true">✓</span>
				</div>
			</div>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-4 py-2.5 text-xs text-muted-fg">
			<span>{{ flow.footer }}</span>
			<span class="flex flex-wrap gap-3">
				<span v-for="[state, text] in flow.legend" :key="state" class="inline-flex items-center gap-1.5">
					<svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" :stroke="STROKES[state].color" :stroke-width="STROKES[state].width" :stroke-dasharray="STROKES[state].dash" /></svg>{{ text }}
				</span>
			</span>
		</div>
	</div>
</template>

<style scoped>
.home-flow-moving {
	animation: home-flow-dash 0.9s linear infinite;
}

@keyframes home-flow-dash {
	to { stroke-dashoffset: -12; }
}

@media (prefers-reduced-motion: reduce) {
	.home-flow-moving { animation: none; }
}
</style>
