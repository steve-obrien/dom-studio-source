<script setup>
import { ref } from 'vue';
import { DomSplitterPanel } from '../../../lib/vue';

const files = ref(200);
const inspector = ref(240);
const preview = ref(250);
</script>

<template>
	<div class="w-full overflow-x-auto">
		<DomSplitterPanel
			v-model:start-size="files"
			v-model:end-size="inspector"
			class="h-[420px] min-w-[860px] overflow-hidden rounded-xl border border-border bg-canvas text-sm shadow-sm"
			:min-start="180"
			:min-main="320"
			:min-end="220"
			handle-class="transition hover:bg-border/70 focus-visible:bg-ring/35 data-[dragging=true]:bg-ring/30"
		>
			<template #start>
				<aside class="flex h-full flex-col skin-card">
					<header class="border-b border-border px-4 py-3">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Workspace</p>
					</header>
					<nav class="space-y-1 p-3">
						<button class="w-full rounded-md bg-secondary px-3 py-2 text-left font-medium text-secondary-fg">Canvas.vue</button>
						<button class="w-full rounded-md px-3 py-2 text-left text-muted-fg hover:bg-secondary">Inspector.vue</button>
						<button class="w-full rounded-md px-3 py-2 text-left text-muted-fg hover:bg-secondary">Timeline.vue</button>
					</nav>
				</aside>
			</template>

			<DomSplitterPanel
				v-model:start-size="preview"
				orientation="vertical"
				class="h-full min-w-0 bg-secondary/20"
				:min-start="170"
				:min-main="120"
				:handle-size="10"
				handle-class="transition hover:bg-border/70 focus-visible:bg-ring/35 data-[dragging=true]:bg-ring/30"
			>
				<template #start>
					<main class="h-full min-w-0 overflow-auto p-5">
						<div class="h-full rounded-lg border border-border bg-canvas p-5 shadow-sm">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Preview</p>
							<h3 class="mt-3 text-xl font-semibold text-canvas-fg">Nested splitters</h3>
							<p class="mt-2 max-w-md leading-6 text-muted-fg">
								The center workspace uses a vertical splitter while the surrounding shell keeps horizontal resize handles.
							</p>
							<div class="mt-5 grid grid-cols-2 gap-3">
								<div class="rounded-md border border-border skin-card p-3">
									<p class="text-xs text-muted-fg">Viewport</p>
									<strong class="mt-1 block text-canvas-fg">Desktop</strong>
								</div>
								<div class="rounded-md border border-border skin-card p-3">
									<p class="text-xs text-muted-fg">State</p>
									<strong class="mt-1 block text-canvas-fg">Draft</strong>
								</div>
							</div>
						</div>
					</main>
				</template>

				<section class="h-full overflow-auto border-t border-border bg-canvas p-4 font-mono text-xs leading-6 text-muted-fg">
					<p class="text-canvas-fg">build: preview updated</p>
					<p>layout: vertical splitter resized</p>
					<p>sync: persisted panel sizes</p>
					<p>status: ready</p>
				</section>
			</DomSplitterPanel>

			<template #end>
				<aside class="h-full overflow-auto skin-card p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Inspector</p>
					<div class="mt-4 space-y-3">
						<label class="block text-xs font-medium text-muted-fg">Width</label>
						<div class="rounded-md border border-border bg-canvas px-3 py-2 text-canvas-fg">fluid</div>
						<label class="block text-xs font-medium text-muted-fg">Height</label>
						<div class="rounded-md border border-border bg-canvas px-3 py-2 text-canvas-fg">split</div>
						<label class="block text-xs font-medium text-muted-fg">Handle</label>
						<div class="rounded-md border border-border bg-canvas px-3 py-2 text-canvas-fg">transparent</div>
					</div>
				</aside>
			</template>
		</DomSplitterPanel>
	</div>
</template>
