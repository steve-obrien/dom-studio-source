<script setup>
import { RouterLink } from 'vue-router';
import DomDesigner from '../core/DesignerWorkspace.vue';
import { createWorkspace } from '../canvas/canvasWorkspace.js';
import { tailwindFrameExample } from './frameDocument.js';

/**
 * Nested frames: DomDesigner opened on a page whose frames each lay out their
 * own children, so absolute, flex, grid and normal flow nest in any order.
 * Select a frame to change its layout; layers in an absolute frame move,
 * align and distribute; layers in flow, flex and grid reorder.
 */
const demo = `<template>
<section class="relative min-h-[520px] w-full bg-canvas p-10 text-canvas-fg">
	<div class="absolute left-[40px] top-[90px] flex w-[680px] items-center gap-6 rounded-2xl border border-border bg-canvas p-6 shadow-sm">
		<div class="w-[220px]">
			<h2 class="text-3xl font-semibold tracking-tight">A frame inside a frame.</h2>
			<p class="mt-4 text-sm leading-6 text-muted-fg">This row uses flex. The panel beside it places its children absolutely. Select a frame and change how it arranges them.</p>
		</div>
		<div class="relative h-[240px] min-w-[240px] flex-1 rounded-xl border border-border bg-secondary">
			<p class="absolute left-[16px] top-[24px] w-[120px] rounded-lg bg-primary p-3 text-sm font-medium text-primary-fg">Move me</p>
			<p class="absolute left-[16px] top-[88px] w-[120px] rounded-lg bg-primary p-3 text-sm font-medium text-primary-fg">Same gap</p>
			<p class="absolute left-[16px] top-[152px] w-[120px] rounded-lg bg-primary p-3 text-sm font-medium text-primary-fg">Snap here</p>
		</div>
	</div>
</section>
</template>
`;

// Ids are counted, so the server-rendered page matches when it hydrates.
function createFrames() {
	let next = 0;
	return createWorkspace([
		{ name: 'Frames.vue', source: demo },
		{ name: 'Workspace.vue', source: `<template>\n${tailwindFrameExample}\n</template>\n` },
	], { widths: [820, 390], height: 640, makeId: () => `frame${next++}` });
}

/** Compiles the Tailwind classes the files use. */
async function compileCss(content) {
	const response = await fetch('/api/experiments/template-editor/tailwind.css', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });
	if (!response.ok) throw new Error('On-demand Tailwind is unavailable.');
	return response.text();
}
</script>

<template>
	<main class="h-dvh">
		<DomDesigner title="Nested frames" badge="Beta" storage-key="dom-studio-frames-v2" :create-workspace="createFrames" :compile-css="compileCss" rulers>
			<template #start>
				<RouterLink to="/designer" class="text-xs text-muted-fg hover:text-primary">← Designer</RouterLink>
			</template>
		</DomDesigner>
	</main>
</template>
