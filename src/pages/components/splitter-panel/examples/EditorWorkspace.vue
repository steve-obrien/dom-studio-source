<script setup>
import { ref } from 'vue';
import { DomSplitterPanel } from '../../../lib/vue';

const left = ref(220);
const right = ref(260);
</script>

<template>
	<div class="w-full overflow-x-auto">
		<DomSplitterPanel
			v-model:start-size="left"
			v-model:end-size="right"
			class="h-[360px] min-w-[860px] overflow-hidden rounded-xl border border-border bg-canvas text-sm shadow-sm"
			:min-start="180"
			:min-main="260"
			:min-end="220"
		>
			<template #start>
				<aside class="flex h-full flex-col skin-card">
					<header class="border-b border-border px-4 py-3">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Files</p>
					</header>
					<nav class="space-y-1 p-3">
						<button class="flex w-full items-center rounded-md bg-secondary px-3 py-2 text-left font-medium text-secondary-fg">ProjectDashboard.vue</button>
						<button class="flex w-full items-center rounded-md px-3 py-2 text-left text-muted-fg hover:bg-secondary">HeroPanel.vue</button>
						<button class="flex w-full items-center rounded-md px-3 py-2 text-left text-muted-fg hover:bg-secondary">TaskList.vue</button>
					</nav>
				</aside>
			</template>

			<main class="h-full min-w-0 bg-secondary/30 p-5">
				<div class="mx-auto h-full max-w-xl rounded-xl border border-border bg-canvas p-6 shadow-sm">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Stage</p>
					<h3 class="mt-3 text-2xl font-semibold tracking-tight text-canvas-fg">Visual component preview</h3>
					<p class="mt-2 text-muted-fg">The center panel stays fluid while the surrounding tools resize.</p>
					<div class="mt-6 grid grid-cols-3 gap-3">
						<div class="rounded-lg border border-border skin-card p-3">
							<p class="text-xs text-muted-fg">Tasks</p>
							<strong class="mt-2 block text-xl text-canvas-fg">38</strong>
						</div>
						<div class="rounded-lg border border-border skin-card p-3">
							<p class="text-xs text-muted-fg">Risks</p>
							<strong class="mt-2 block text-xl text-canvas-fg">4</strong>
						</div>
						<div class="rounded-lg border border-border skin-card p-3">
							<p class="text-xs text-muted-fg">Ready</p>
							<strong class="mt-2 block text-xl text-canvas-fg">82%</strong>
						</div>
					</div>
				</div>
			</main>

			<template #end>
				<aside class="h-full skin-card p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Inspector</p>
					<label class="mt-4 block text-xs font-medium text-muted-fg">Class</label>
					<div class="mt-2 rounded-md border border-border bg-canvas px-3 py-2 font-mono text-xs text-canvas-fg">grid gap-4 p-6</div>
					<label class="mt-4 block text-xs font-medium text-muted-fg">Props</label>
					<div class="mt-2 space-y-2">
						<div class="rounded-md border border-border bg-canvas px-3 py-2 text-muted-fg">title: Dashboard</div>
						<div class="rounded-md border border-border bg-canvas px-3 py-2 text-muted-fg">status: Prototype</div>
					</div>
				</aside>
			</template>
		</DomSplitterPanel>
	</div>
</template>
