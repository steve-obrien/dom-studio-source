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

const specs = [
	{ value: '8 days', label: 'Battery on one charge' },
	{ value: '100 m', label: 'Water resistant' },
	{ value: '2.4 g', label: 'Lighter than a coin' },
];
<\/script>

<template>
	<main data-theme="dark" class="relative min-h-screen min-w-[1120px] overflow-hidden bg-[#05060b] text-white">
		<div class="absolute left-[520px] top-[-120px] size-[620px] rounded-full bg-violet-600/40 blur-[120px]"></div>
		<div class="absolute left-[820px] top-[260px] size-[380px] rounded-full bg-cyan-400/30 blur-[100px]"></div>
		<header class="relative flex items-center justify-between px-12 py-6">
			<p class="text-lg font-semibold tracking-tight">Halo</p>
			<nav class="flex gap-8 text-sm text-white/60">
				<a href="#ring">Ring</a>
				<a href="#health">Health</a>
				<a href="#sizing">Sizing</a>
			</nav>
			<a href="#buy" class="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">Buy</a>
		</header>
		<section id="ring" class="relative h-[470px]">
			<p class="absolute left-12 top-14 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-violet-200 ring-1 ring-white/15">New · Halo Ring 2</p>
			<h1 class="absolute left-12 top-28 w-[420px] bg-gradient-to-b from-white to-white/60 bg-clip-text pb-2 text-7xl font-semibold leading-[1.02] tracking-tight text-transparent">Your health, in a ring.</h1>
			<p class="absolute left-12 top-[300px] w-[420px] text-lg text-white/60">Sleep, heart and recovery, measured all night. No screen, no buzzing, just answers.</p>
			<DomButton class="absolute left-12 top-[372px]" size="lg">Pre-order £299</DomButton>
			<a href="#film" class="absolute left-[236px] top-[382px] text-sm font-medium text-cyan-300">Watch the film ›</a>
			<div class="absolute left-[640px] top-6 size-[360px] rounded-full bg-[conic-gradient(from_210deg,#c4b5fd,#22d3ee,#f0abfc,#818cf8,#c4b5fd)] p-7 shadow-[0_0_140px_rgba(139,92,246,0.55)]">
				<div class="size-full rounded-full bg-[radial-gradient(circle_at_50%_30%,#1e1b4b,#05060b_70%)] shadow-[inset_0_10px_40px_rgba(255,255,255,0.18)]"></div>
			</div>
			<div class="absolute left-[580px] top-[270px] rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20 backdrop-blur-xl">
				<p class="text-xs text-white/60">Sleep score</p>
				<p class="text-2xl font-semibold">92</p>
			</div>
			<div class="absolute left-[930px] top-[110px] rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20 backdrop-blur-xl">
				<p class="text-xs text-white/60">Resting heart rate</p>
				<p class="text-2xl font-semibold">54 bpm</p>
			</div>
		</section>
		<section id="health" class="relative grid grid-cols-3 gap-5 px-12 pb-14">
			<article v-for="spec in specs" :key="spec.value" class="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-xl">
				<p class="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">{{ spec.value }}</p>
				<p class="mt-1 text-sm text-white/55">{{ spec.label }}</p>
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
