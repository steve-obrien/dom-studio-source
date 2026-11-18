<script setup>
import { ref } from 'vue';
import { DomSplitterPanel } from '../../../lib/vue';

const listWidth = ref(260);
</script>

<template>
	<div class="w-full overflow-x-auto">
		<DomSplitterPanel
			v-model:start-size="listWidth"
			class="h-[320px] overflow-hidden rounded-xl border border-border bg-canvas text-sm shadow-sm"
			:min-start="160"
			:min-main="140"
			:handle-size="12"
			start-collapsible
		>
			<template #start>
				<aside class="h-full overflow-y-auto border-r border-border skin-card">
					<header class="border-b border-border px-4 py-3">
						<p class="font-semibold text-canvas-fg">Conversations</p>
					</header>
					<div class="divide-y divide-border">
						<button class="block w-full bg-secondary px-4 py-3 text-left">
							<span class="block font-medium text-canvas-fg">Design review</span>
							<span class="mt-1 block truncate text-xs text-muted-fg">Hero component feedback and launch copy.</span>
						</button>
						<button class="block w-full px-4 py-3 text-left hover:bg-secondary/70">
							<span class="block font-medium text-canvas-fg">Build notes</span>
							<span class="mt-1 block truncate text-xs text-muted-fg">Template editor syncing checklist.</span>
						</button>
						<button class="block w-full px-4 py-3 text-left hover:bg-secondary/70">
							<span class="block font-medium text-canvas-fg">Release plan</span>
							<span class="mt-1 block truncate text-xs text-muted-fg">Tasks to close before the demo.</span>
						</button>
					</div>
				</aside>
			</template>

			<article class="h-full min-w-0 overflow-y-auto p-3 sm:p-6">
				<p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Design review</p>
				<h3 class="mt-2 text-lg font-semibold tracking-tight text-canvas-fg sm:text-2xl">Template editor feedback</h3>
				<p class="mt-3 leading-7 text-muted-fg">
					Two-pane splitters are useful when the primary content should stay dominant, but a navigation or list panel still needs manual control.
				</p>
			</article>
		</DomSplitterPanel>
	</div>
</template>
