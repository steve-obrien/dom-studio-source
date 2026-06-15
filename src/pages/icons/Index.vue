<script setup>
import { computed, ref } from 'vue';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import { getIconInventory } from './iconInventory.js';

const searchIconPath = 'M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21';
const icons = getIconInventory();
const query = ref('');
const activeGroup = ref('All');
const copiedId = ref('');
let copiedTimer = null;

const groupOptions = computed(() => [
	'All',
	...Array.from(new Set(icons.map((icon) => icon.group))).sort((a, b) => a.localeCompare(b)),
]);

const filteredIcons = computed(() => {
	const term = query.value.trim().toLowerCase();
	return icons.filter((icon) => {
		const matchesGroup = activeGroup.value === 'All' || icon.group === activeGroup.value;
		const matchesSearch = !term || icon.searchText.includes(term);
		return matchesGroup && matchesSearch;
	});
});

async function copyIcon(icon) {
	const copied = await copyText(icon.svg);
	if (!copied) return;

	copiedId.value = icon.id;
	window.clearTimeout(copiedTimer);
	copiedTimer = window.setTimeout(() => {
		copiedId.value = '';
	}, 1600);
}

async function copyText(text) {
	if (typeof navigator !== 'undefined' && navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall through to the selection-based copy path for restricted browser contexts.
		}
	}

	if (typeof document === 'undefined' || !document.body) return false;

	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.left = '-9999px';
	textarea.style.top = '0';
	document.body.appendChild(textarea);
	textarea.select();

	let copied = false;
	try {
		copied = document.execCommand('copy');
	} catch {
		copied = false;
	}

	textarea.remove();
	return copied;
}
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Icons"
			tagline="Auto-generated SVG path icons collected from DOM Studio navigation, component metadata, block metadata, and source files."
			tag="copyable SVG"
			eyebrow="Tooling"
		>
			<DocSection title="Library">
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
						<label class="relative block w-full lg:max-w-md">
							<span class="sr-only">Search icons</span>
							<svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path :d="searchIconPath" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							<input
								v-model="query"
								type="search"
								class="skin-input h-10 w-full pl-9"
								placeholder="Search icons, routes, or source files"
							/>
						</label>

						<div class="flex flex-wrap gap-2">
							<button
								v-for="group in groupOptions"
								:key="group"
								type="button"
								class="rounded-md px-3 py-1.5 text-sm font-medium transition"
								:class="activeGroup === group ? 'bg-secondary text-canvas-fg ring-1 ring-border' : 'text-muted-fg hover:bg-secondary hover:text-canvas-fg'"
								@click="activeGroup = group"
							>
								{{ group }}
							</button>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-3 text-sm text-muted-fg">
						<span><strong class="font-semibold text-canvas-fg">{{ filteredIcons.length }}</strong> shown</span>
						<span><strong class="font-semibold text-canvas-fg">{{ icons.length }}</strong> total</span>
					</div>

					<ul class="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
						<li
							v-for="icon in filteredIcons"
							:key="icon.key"
							class="min-w-0 bg-canvas"
						>
							<button
								type="button"
								class="group relative flex h-28 w-full flex-col items-center justify-center gap-2 p-3 text-center outline-none transition hover:bg-secondary/70 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/70 sm:h-32"
								:aria-label="`Copy ${icon.name} SVG`"
								:title="`Copy ${icon.name} SVG`"
								@click="copyIcon(icon)"
							>
								<span
									v-if="copiedId === icon.id"
									class="absolute right-2 top-2 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success"
								>
									Copied
								</span>
								<span class="grid size-10 place-items-center text-canvas-fg transition group-hover:scale-105 group-hover:text-primary">
									<svg :viewBox="icon.viewBox" class="size-6" fill="none" aria-hidden="true">
										<path :d="icon.path" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
								<span class="max-w-full truncate text-xs font-medium text-canvas-fg sm:text-sm">{{ icon.name }}</span>
							</button>
						</li>
					</ul>

					<p v-if="!filteredIcons.length" class="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-fg">
						No icons match the current filters.
					</p>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
