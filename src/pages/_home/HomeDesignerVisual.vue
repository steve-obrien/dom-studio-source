<script setup>
import { computed, ref } from 'vue';

/** Token colours for the hand-highlighted Vue source. */
const tone = {
	tag: 'text-[var(--chart-1)]',
	attr: 'text-[var(--chart-4)]',
	str: 'text-[var(--chart-2)]',
	text: 'text-canvas-fg',
	punct: 'text-muted-fg',
};

/** Each line is a list of [tone, text] tokens; `node` ties a line to a layer on the artboard. */
const source = [
	{ tokens: [['punct', '<'], ['tag', 'template'], ['punct', '>']] },
	{ node: 'page', tokens: [['punct', '  <'], ['tag', 'main'], ['attr', ' data-theme'], ['punct', '='], ['str', '"dark"'], ['attr', ' class'], ['punct', '='], ['str', '"bg-[#05060b] text-white"'], ['punct', '>']] },
	{ node: 'header', tokens: [['punct', '    <'], ['tag', 'SiteHeader'], ['attr', ' :links'], ['punct', '='], ['str', '"nav"'], ['punct', ' />']] },
	{ node: 'title', tokens: [['punct', '    <'], ['tag', 'h1'], ['attr', ' class'], ['punct', '='], ['str', '"bg-gradient-to-b from-white to-white/60 bg-clip-text text-7xl text-transparent"'], ['punct', '>']] },
	{ node: 'title', tokens: [['text', '      Your health, in a ring.']] },
	{ node: 'title', tokens: [['punct', '    </'], ['tag', 'h1'], ['punct', '>']] },
	{ node: 'cta', tokens: [['punct', '    <'], ['tag', 'DomButton'], ['attr', ' size'], ['punct', '='], ['str', '"lg"'], ['punct', '>'], ['text', 'Pre-order £299'], ['punct', '</'], ['tag', 'DomButton'], ['punct', '>']] },
	{ node: 'ring', tokens: [['punct', '    <'], ['tag', 'div'], ['attr', ' class'], ['punct', '='], ['str', '"rounded-full bg-[conic-gradient(…)] p-7"'], ['punct', ' />']] },
	{ node: 'specs', tokens: [['punct', '    <'], ['tag', 'article'], ['attr', ' v-for'], ['punct', '='], ['str', '"spec in specs"'], ['attr', ' class'], ['punct', '='], ['str', '"rounded-3xl bg-white/[0.06] backdrop-blur-xl"'], ['punct', '>']] },
	{ node: 'specs', tokens: [['punct', '      <'], ['tag', 'p'], ['punct', '>'], ['text', '{{ spec.value }}'], ['punct', '</'], ['tag', 'p'], ['punct', '>']] },
	{ node: 'specs', tokens: [['punct', '    </'], ['tag', 'article'], ['punct', '>']] },
	{ node: 'page', tokens: [['punct', '  </'], ['tag', 'main'], ['punct', '>']] },
	{ tokens: [['punct', '</'], ['tag', 'template'], ['punct', '>']] },
];
const layers = [
	{ id: 'page', label: 'main', icon: '▤', depth: 0 },
	{ id: 'header', label: 'SiteHeader', icon: '▭', depth: 1 },
	{ id: 'title', label: 'h1', icon: 'T', depth: 1 },
	{ id: 'cta', label: 'DomButton', icon: '◆', depth: 1 },
	{ id: 'ring', label: 'div · ring', icon: '◯', depth: 1 },
	{ id: 'specs', label: 'article · v-for', icon: '▦', depth: 1 },
];
const specs = [{ value: '8 days', label: 'Battery' }, { value: '100 m', label: 'Water resistant' }, { value: '2.4 g', label: 'Weight' }];
const selected = ref('title');
const label = computed(() => layers.find((layer) => layer.id === selected.value)?.label);

/** @param {string} id Layer id. @returns {string} Selection outline classes for an artboard layer. */
function outline(id) {
	return selected.value === id ? 'outline-2 outline-offset-2 outline-designer' : 'hover:outline-1 hover:outline-offset-2 hover:outline-designer/60';
}

/** @param {string} id Layer to select on the artboard, in the layer list and in the source. @returns {void} */
function select(id) {
	selected.value = id;
}
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-secondary/40 shadow-xl shadow-canvas-fg/5">
		<div class="flex items-center gap-2 border-b border-border bg-canvas px-4 py-2.5 text-xs">
			<span class="flex gap-1.5" aria-hidden="true"><span class="size-2.5 rounded-full bg-destructive/70"></span><span class="size-2.5 rounded-full bg-warning/70"></span><span class="size-2.5 rounded-full bg-success/70"></span></span>
			<span class="ml-2 font-medium">Home.vue</span>
			<span class="ml-auto inline-flex rounded-md border border-border p-0.5">
				<span class="rounded bg-secondary px-2 py-0.5 font-medium">Canvas</span>
				<span class="px-2 py-0.5 text-muted-fg">Page</span>
			</span>
		</div>
		<div class="grid lg:grid-cols-[8.5rem_minmax(0,1fr)]">
			<ul class="hidden border-r border-border bg-canvas py-2 text-xs lg:block" aria-label="Layers">
				<li v-for="layer in layers" :key="layer.id">
					<button type="button" class="flex w-full items-center gap-1.5 py-1 pr-2 text-left" :class="selected === layer.id ? 'bg-ring/15 font-medium' : 'text-muted-fg hover:bg-secondary/60'" :style="{ paddingLeft: `${0.75 + layer.depth * 0.75}rem` }" @click="select(layer.id)">
						<span class="w-3 text-center font-mono text-[0.65rem]" aria-hidden="true">{{ layer.icon }}</span>{{ layer.label }}
					</button>
				</li>
			</ul>
			<div class="min-w-0">
				<div class="p-4 sm:p-6">
					<div class="relative mx-auto max-w-[34rem] cursor-pointer overflow-hidden rounded-lg bg-[#05060b] text-white shadow-md" :class="selected === 'page' && 'outline-2 outline-offset-2 outline-designer'" @click.self="select('page')">
						<div class="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-violet-600/40 blur-3xl" aria-hidden="true"></div>
						<div class="pointer-events-none absolute -bottom-10 right-0 size-48 rounded-full bg-cyan-400/25 blur-3xl" aria-hidden="true"></div>
						<div class="relative flex cursor-pointer items-center justify-between rounded px-5 py-3 text-[0.7rem]" :class="outline('header')" @click="select('header')">
							<span class="font-semibold">Halo</span>
							<span class="flex gap-3 text-white/60"><span>Ring</span><span>Health</span><span>Sizing</span></span>
						</div>
						<div class="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-4 pt-3" @click.self="select('page')">
							<div>
								<span class="inline-block rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] text-violet-200 ring-1 ring-white/15">New · Halo Ring 2</span>
								<h3 class="relative mt-2 cursor-pointer rounded bg-gradient-to-b from-white to-white/60 bg-clip-text pb-1 text-2xl font-semibold leading-tight tracking-tight text-transparent sm:text-[2rem]" :class="outline('title')" @click="select('title')">
									Your health,<br>in a ring.
									<template v-if="selected === 'title'">
										<span v-for="corner in ['-left-2 -top-2', '-right-2 -top-2', '-left-2 -bottom-2', '-right-2 -bottom-2']" :key="corner" class="absolute size-2 border border-ring bg-canvas" :class="corner" aria-hidden="true"></span>
									</template>
								</h3>
								<span class="mt-3 inline-block cursor-pointer rounded-lg bg-white px-3.5 py-2 text-xs font-medium text-black" :class="outline('cta')" @click="select('cta')">Pre-order £299</span>
							</div>
							<div class="size-24 cursor-pointer rounded-full bg-[conic-gradient(from_210deg,#c4b5fd,#22d3ee,#f0abfc,#818cf8,#c4b5fd)] p-2.5 shadow-[0_0_60px_rgba(139,92,246,0.55)] sm:size-36 sm:p-4" :class="outline('ring')" @click="select('ring')">
								<div class="size-full rounded-full bg-[radial-gradient(circle_at_50%_30%,#1e1b4b,#05060b_70%)] shadow-[inset_0_6px_24px_rgba(255,255,255,0.18)]"></div>
							</div>
						</div>
						<div class="relative grid cursor-pointer grid-cols-3 gap-2 rounded px-5 pb-5" :class="outline('specs')" @click="select('specs')">
							<div v-for="spec in specs" :key="spec.value" class="rounded-xl bg-white/[0.06] p-2.5 ring-1 ring-white/10 backdrop-blur-xl">
								<div class="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text text-sm font-semibold text-transparent">{{ spec.value }}</div>
								<div class="mt-0.5 text-[0.6rem] text-white/55">{{ spec.label }}</div>
							</div>
						</div>
					</div>
				</div>
				<div class="border-t border-border bg-canvas">
					<div class="flex items-center justify-between border-b border-border px-4 py-1.5 text-[0.65rem] text-muted-fg">
						<span>Home.vue · selected <strong class="font-medium text-canvas-fg">{{ label }}</strong></span>
						<span>Two-way sync</span>
					</div>
					<pre class="overflow-x-auto py-2 font-mono text-[0.68rem] leading-[1.15rem]"><code><span v-for="(line, lineIndex) in source" :key="lineIndex" class="flex cursor-pointer pr-4" :class="line.node === selected ? 'bg-ring/15' : 'hover:bg-secondary/50'" @click="line.node && select(line.node)"><span class="w-8 shrink-0 select-none pr-3 text-right text-muted-fg/60">{{ lineIndex + 1 }}</span><span class="whitespace-pre"><span v-for="(token, tokenIndex) in line.tokens" :key="tokenIndex" :class="tone[token[0]]">{{ token[1] }}</span></span></span></code></pre>
				</div>
			</div>
		</div>
	</div>
</template>
