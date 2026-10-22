<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const people = [
	{ initials: 'You', color: 'var(--chart-1)' },
	{ initials: 'AK', color: 'var(--chart-2)' },
	{ initials: 'SO', color: 'var(--chart-4)' },
];
const phrase = ' and every customer gets a migration call.';
const typed = ref(phrase);
let timer;
let index = 0;

/** Types Aisha's sentence one character at a time, then starts again after a pause. @returns {void} */
function tick() {
	index = index >= phrase.length + 24 ? 0 : index + 1;
	typed.value = phrase.slice(0, Math.min(index, phrase.length));
}

/** Starts the typing loop unless the visitor prefers reduced motion. @returns {void} */
function start() {
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
	index = 0;
	timer = setInterval(tick, 90);
}

onMounted(start);
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2 text-xs">
			<span v-for="tool in ['H1', 'H2', 'B', 'I', 'U', '❝', '</>', '▦', '🖼']" :key="tool" class="grid h-7 min-w-7 place-items-center rounded px-1.5 font-semibold text-muted-fg" :class="tool === 'B' && 'bg-secondary text-canvas-fg'">{{ tool }}</span>
			<span class="ml-auto flex items-center gap-2">
				<span class="flex -space-x-1.5">
					<span v-for="person in people" :key="person.initials" class="grid size-6 place-items-center rounded-full border-2 border-canvas text-[0.5rem] font-semibold text-canvas" :style="{ background: person.color }">{{ person.initials }}</span>
				</span>
				<span class="hidden text-muted-fg sm:inline"><span class="inline-block size-1.5 rounded-full bg-success align-middle"></span> 3 editing live</span>
			</span>
		</div>
		<div class="relative px-6 py-7 text-[0.92rem] leading-7 sm:px-10">
			<h3 class="text-2xl font-semibold tracking-tight">Q4 platform launch</h3>
			<p class="mt-1 text-xs text-muted-fg">Product brief · edited just now</p>
			<p class="mt-5">
				We move every workspace to the new billing engine on <strong>18 November</strong>. Admins see the change a week early,<span>{{ typed }}</span><span class="relative inline-block h-5 w-0.5 translate-y-1 bg-[var(--chart-2)]"><span class="absolute -top-5 left-0 whitespace-nowrap rounded rounded-bl-none bg-[var(--chart-2)] px-1.5 text-[0.6rem] font-semibold leading-5 text-canvas">Aisha</span></span>
			</p>
			<p class="mt-4">
				Support will publish a
				<span class="relative rounded-sm bg-[color-mix(in_oklab,var(--chart-4)_28%,transparent)] box-decoration-clone">step-by-step guide with screenshots<span class="absolute -top-5 right-0 whitespace-nowrap rounded rounded-br-none bg-[var(--chart-4)] px-1.5 text-[0.6rem] font-semibold leading-5 text-canvas">Sam</span></span>
				and a short video for each plan.
			</p>
			<div class="mt-6 rounded-xl border border-border bg-secondary/30 p-4 text-sm shadow-sm">
				<div class="flex items-center gap-2 text-xs font-medium">
					<span class="shrink-0 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-primary-fg">✦ AI · Simplify</span>
					<span class="text-muted-fg">Suggested rewrite of paragraph 3</span>
				</div>
				<p class="mt-3 leading-6">
					<span class="text-destructive line-through decoration-destructive/60">Legacy invoices remain accessible for the purposes of reconciliation for a period of no less than</span>{{ ' ' }}
					<span class="rounded-sm bg-success/15 text-success">Old invoices stay available for</span> 24 months.
				</p>
				<div class="mt-3 flex gap-2 text-xs font-medium">
					<span class="rounded-md bg-primary px-2.5 py-1.5 text-primary-fg">Accept</span>
					<span class="rounded-md border border-border px-2.5 py-1.5">Reject</span>
				</div>
			</div>
		</div>
	</div>
</template>
