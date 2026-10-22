<script setup>
import { componentRegistry, lookupByName } from '../../_layout/inspector/componentRegistry.js';
import DomDesigner from '../../designer/core/DesignerWorkspace.vue';
import DomMonacoCodeView from '../../designer/core/MonacoCodeView.vue';
import { loadMonaco } from '../../designer/core/loadMonaco.js';
import { WORKSPACE_VERSION, importFile } from '../../designer/canvas/canvasWorkspace.js';

/**
 * The real DomDesigner on the homepage: a small website with its code open
 * below the canvas. Edits stay in memory, so every visit starts fresh and the
 * full canvas page keeps its own saved work.
 */
const catalog = { entries: componentRegistry, lookupByName };
const storage = { kind: 'memory', async load() { return null; }, async save() {} };
const source = `<script setup>
import { DomButton } from '@getdom/studio/vue';

const plans = [
	{ name: 'Taster', price: '£9', note: 'Two bags a month' },
	{ name: 'Regular', price: '£16', note: 'Four bags a month' },
	{ name: 'Office', price: '£42', note: 'Ten bags a month' },
];
<\/script>

<template>
	<main class="min-h-full bg-canvas text-canvas-fg">
		<header class="flex items-center justify-between px-10 py-5">
			<p class="text-lg font-semibold">Bean Club</p>
			<nav class="flex gap-6 text-sm text-muted-fg">
				<a href="#plans">Plans</a>
				<a href="#origins">Origins</a>
				<a href="#gifts">Gifts</a>
			</nav>
		</header>
		<section class="relative h-[380px] px-10">
			<h1 class="absolute left-10 top-16 w-[520px] text-6xl font-semibold leading-none tracking-tight">Fresh coffee, delivered.</h1>
			<p class="absolute left-10 top-56 w-[440px] text-lg text-muted-fg">Roasted on Monday. At your door by Wednesday.</p>
			<div class="absolute left-[640px] top-12 h-[280px] w-[420px] rounded-3xl bg-amber-700"></div>
			<p class="absolute left-[700px] top-[290px] rounded-full bg-canvas px-4 py-2 text-sm font-medium shadow">New: Ethiopia Guji</p>
		</section>
		<section id="plans" class="grid grid-cols-3 gap-6 px-10 pb-16">
			<article v-for="plan in plans" :key="plan.name" class="rounded-2xl border border-border p-6">
				<h2 class="text-xl font-semibold">{{ plan.name }}</h2>
				<p class="mt-2 text-3xl font-semibold">{{ plan.price }}</p>
				<p class="mt-1 text-sm text-muted-fg">{{ plan.note }}</p>
			</article>
		</section>
	</main>
</template>
`;

/** @returns {object} One file shown on a desktop artboard. */
function createWorkspace() {
	let index = 0;
	const { file } = importFile(source, 'Home.vue', { makeId: () => `n_home${String(index++).padStart(3, '0')}` });
	file.id = 'file_home';
	return { version: WORKSPACE_VERSION, files: [file], artboards: [{ id: 'board_home', fileId: file.id, name: 'Desktop', x: 0, y: 0, width: 1120, height: 760 }] };
}

/** Compiles the Tailwind classes the file uses, as the canvas page does. */
async function compileCss(content) {
	const response = await fetch('/api/experiments/template-editor/tailwind.css', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });
	if (!response.ok) throw new Error('On-demand Tailwind is unavailable.');
	return response.text();
}
</script>

<template>
	<div class="h-[52rem] overflow-hidden rounded-2xl border border-border shadow-xl shadow-canvas-fg/5">
		<DomDesigner
			:catalog="catalog"
			:storage="storage"
			storage-key="dom-studio-home-designer"
			:create-workspace="createWorkspace"
			:compile-css="compileCss"
			:code-editor="DomMonacoCodeView"
			:code-editor-props="{ load: loadMonaco }"
			code-layout="below"
			code-open
			embedded
			title="Canvas"
			badge="Live"
		/>
	</div>
</template>
