<script setup>
import { RouterLink } from 'vue-router';
import { computed, ref } from 'vue';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import { getBlockCategories, getBlockRecords } from './blockRegistry.js';

const blockRecords = getBlockRecords();
const blockCategories = getBlockCategories();
const searchQuery = ref('');

const filteredBlockRecords = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	if (!query) return blockRecords;

	return blockRecords.filter((block) => blockSearchText(block).includes(query));
});

function blockSearchText(block) {
	return [
		block.label,
		block.categoryLabel,
		block.summary,
		block.tag,
		block.sourcePath,
	].join(' ').toLowerCase();
}
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Blocks"
			eyebrow="DOM Studio"
			:tag="`${blockRecords.length} auto-discovered`"
			tagline="Production-shaped interface sections built from DOM Studio primitives: app shells, communication surfaces, conversion flows, and form-led product moments."
		>
			<DocSection eyebrow="Catalog" title="Block categories">
				<div class="grid gap-3 sm:grid-cols-2">
					<section
						v-for="category in blockCategories"
						:key="category.name"
						:id="category.id"
						class="scroll-mt-24 rounded-lg border border-border skin-card p-4"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<h2 class="text-base font-semibold text-canvas-fg">{{ category.name }}</h2>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ category.description }}</p>
							</div>
							<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">
								{{ category.count }}
							</span>
						</div>
						<div class="mt-4 flex flex-wrap gap-2">
							<RouterLink
								v-for="block in category.records"
								:key="block.id"
								:to="block.route"
								class="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-muted-fg transition hover:border-primary/40 hover:text-canvas-fg"
							>
								<svg viewBox="0 0 24 24" class="size-3.5 shrink-0" fill="none" aria-hidden="true">
									<path :d="block.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								{{ block.label }}
							</RouterLink>
						</div>
					</section>
				</div>
			</DocSection>

			<DocSection eyebrow="Library" title="All blocks">
				<div class="flex flex-col gap-3 rounded-lg border border-border bg-canvas p-3 sm:flex-row sm:items-center sm:justify-between">
					<label class="block min-w-0 flex-1">
						<span class="sr-only">Search blocks</span>
						<input
							v-model="searchQuery"
							type="search"
							placeholder="Search blocks..."
							class="h-10 w-full rounded-md border border-border bg-canvas px-3 text-sm text-canvas-fg outline-none transition placeholder:text-muted-fg focus:border-primary/50 focus:ring-2 focus:ring-ring/25"
						>
					</label>
					<p class="text-sm text-muted-fg">
						{{ filteredBlockRecords.length }} of {{ blockRecords.length }}
					</p>
				</div>

				<div class="grid gap-3">
					<RouterLink
						v-for="block in filteredBlockRecords"
						:key="block.id"
						:to="block.route"
						class="group rounded-lg border border-border skin-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
					>
						<div class="flex items-start gap-3">
							<div class="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-canvas-fg">
								<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
									<path :d="block.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h2 class="text-base font-semibold text-canvas-fg">{{ block.label }}</h2>
									<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">
										{{ block.categoryLabel }}
									</span>
								</div>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ block.summary }}</p>
								<p class="mt-3 text-xs font-medium text-muted-fg">
									{{ block.exampleCount }} {{ block.exampleCount === 1 ? 'example' : 'examples' }}
									<span aria-hidden="true"> / </span>
									<code>{{ block.sourcePath }}</code>
								</p>
							</div>
							<span class="mt-1 text-muted-fg transition group-hover:translate-x-0.5 group-hover:text-canvas-fg" aria-hidden="true">
								-&gt;
							</span>
						</div>
					</RouterLink>

					<div v-if="!filteredBlockRecords.length" class="rounded-lg border border-dashed border-border p-6 text-center">
						<p class="text-sm font-medium text-canvas-fg">No blocks found</p>
						<p class="mt-1 text-sm text-muted-fg">Try a category, workflow, tag, or source path.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
