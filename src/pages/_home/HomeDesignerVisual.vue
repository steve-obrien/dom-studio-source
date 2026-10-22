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
	{ node: 'header', tokens: [['punct', '  <'], ['tag', 'SiteHeader'], ['attr', ' :links'], ['punct', '='], ['str', '"nav"'], ['punct', ' />']] },
	{ node: 'hero', tokens: [['punct', '  <'], ['tag', 'section'], ['attr', ' class'], ['punct', '='], ['str', '"px-10 pt-16 text-center"'], ['punct', '>']] },
	{ node: 'title', tokens: [['punct', '    <'], ['tag', 'h1'], ['attr', ' class'], ['punct', '='], ['str', '"text-5xl font-semibold"'], ['punct', '>']] },
	{ node: 'title', tokens: [['text', '      Fresh coffee, delivered.']] },
	{ node: 'title', tokens: [['punct', '    </'], ['tag', 'h1'], ['punct', '>']] },
	{ node: 'lead', tokens: [['punct', '    <'], ['tag', 'p'], ['attr', ' class'], ['punct', '='], ['str', '"mt-4 text-lg text-muted-fg"'], ['punct', '>']] },
	{ node: 'lead', tokens: [['text', '      Roasted Monday. At your door by Wednesday.']] },
	{ node: 'lead', tokens: [['punct', '    </'], ['tag', 'p'], ['punct', '>']] },
	{ node: 'cta', tokens: [['punct', '    <'], ['tag', 'DomButton'], ['attr', ' size'], ['punct', '='], ['str', '"lg"'], ['punct', '>'], ['text', 'Start a subscription'], ['punct', '</'], ['tag', 'DomButton'], ['punct', '>']] },
	{ node: 'hero', tokens: [['punct', '  </'], ['tag', 'section'], ['punct', '>']] },
	{ node: 'plans', tokens: [['punct', '  <'], ['tag', 'section'], ['attr', ' class'], ['punct', '='], ['str', '"grid grid-cols-3 gap-4 px-10"'], ['punct', '>']] },
	{ node: 'plans', tokens: [['punct', '    <'], ['tag', 'PlanCard'], ['attr', ' v-for'], ['punct', '='], ['str', '"plan in plans"'], ['attr', ' v-bind'], ['punct', '='], ['str', '"plan"'], ['punct', ' />']] },
	{ node: 'plans', tokens: [['punct', '  </'], ['tag', 'section'], ['punct', '>']] },
	{ tokens: [['punct', '</'], ['tag', 'template'], ['punct', '>']] },
];
const layers = [
	{ id: 'header', label: 'SiteHeader', icon: '▭', depth: 0 },
	{ id: 'hero', label: 'section', icon: '▤', depth: 0 },
	{ id: 'title', label: 'h1', icon: 'T', depth: 1 },
	{ id: 'lead', label: 'p', icon: '¶', depth: 1 },
	{ id: 'cta', label: 'DomButton', icon: '◆', depth: 1 },
	{ id: 'plans', label: 'section · grid', icon: '▦', depth: 0 },
];
const plans = [{ name: 'Taster', price: '£9' }, { name: 'Regular', price: '£16' }, { name: 'Office', price: '£42' }];
const selected = ref('title');
const label = computed(() => layers.find((layer) => layer.id === selected.value)?.label);

/** @param {string} id Layer id. @returns {string} Selection outline classes for an artboard layer. */
function outline(id) {
	return selected.value === id ? 'outline-2 outline-offset-2 outline-ring' : 'hover:outline-1 hover:outline-offset-2 hover:outline-ring/60';
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
					<div class="mx-auto max-w-[34rem] overflow-hidden rounded-lg bg-canvas text-canvas-fg shadow-md">
						<div class="flex cursor-pointer items-center justify-between rounded px-5 py-3 text-[0.7rem]" :class="outline('header')" @click="select('header')">
							<span class="font-semibold">☕ Bean Club</span>
							<span class="flex gap-3 text-muted-fg"><span>Plans</span><span>Origins</span><span>Gifts</span></span>
						</div>
						<div class="cursor-pointer rounded px-6 pb-5 pt-6 text-center" :class="outline('hero')" @click.self="select('hero')">
							<h3 class="relative mx-auto inline-block cursor-pointer rounded text-2xl font-semibold tracking-tight sm:text-[1.75rem]" :class="outline('title')" @click="select('title')">
								Fresh coffee, delivered.
								<template v-if="selected === 'title'">
									<span v-for="corner in ['-left-2 -top-2', '-right-2 -top-2', '-left-2 -bottom-2', '-right-2 -bottom-2']" :key="corner" class="absolute size-2 border border-ring bg-canvas" :class="corner" aria-hidden="true"></span>
								</template>
							</h3>
							<p class="mx-auto mt-4 w-fit cursor-pointer rounded text-xs text-muted-fg" :class="outline('lead')" @click="select('lead')">Roasted Monday. At your door by Wednesday.</p>
							<span class="mt-4 inline-block cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-fg" :class="outline('cta')" @click="select('cta')">Start a subscription</span>
						</div>
						<div class="grid cursor-pointer grid-cols-3 gap-2 rounded px-5 pb-5" :class="outline('plans')" @click="select('plans')">
							<div v-for="plan in plans" :key="plan.name" class="rounded-md border border-border p-2.5 text-[0.65rem]">
								<div class="font-semibold">{{ plan.name }}</div>
								<div class="mt-1 text-muted-fg">{{ plan.price }} / month</div>
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
