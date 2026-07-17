<script setup>
import { RouterLink } from 'vue-router';
import { computed, ref } from 'vue';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import { getBlockCategories, getBlockRecords } from './blockRegistry.js';
import { getBlockReview } from './blockReviewStatus.js';

const blockRecords = getBlockRecords().map((block) => ({
	...block,
	review: getBlockReview(block.blockPath),
}));
const blockCategories = getBlockCategories();
const searchQuery = ref('');
const reviewFilter = ref('all');
const reviewedBlockRecords = blockRecords.filter((block) => block.review);
const remainingBlockRecords = blockRecords.filter((block) => !block.review);
const reviewProgress = Math.round((reviewedBlockRecords.length / blockRecords.length) * 100);

const filteredBlockRecords = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	return blockRecords.filter((block) => {
		const matchesQuery = !query || blockSearchText(block).includes(query);
		const matchesReview = reviewFilter.value === 'all'
			|| (reviewFilter.value === 'reviewed' && block.review)
			|| (reviewFilter.value === 'remaining' && !block.review);

		return matchesQuery && matchesReview;
	});
});

/**
 * Creates a normalized search string from the public block catalog fields.
 *
 * @param {object} block Auto-discovered block catalog record.
 * @returns {string} Lowercase searchable text.
 */
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
			<DocSection eyebrow="Quality" title="Block review progress">
				<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
					<section class="rounded-xl border border-border skin-card p-5">
						<div class="flex items-end justify-between gap-4">
							<div>
								<p class="text-3xl font-semibold tracking-tight tabular-nums">{{ reviewedBlockRecords.length }} / {{ blockRecords.length }}</p>
								<p class="mt-1 text-sm text-muted-fg">blocks reviewed and reimplemented where needed</p>
							</div>
							<p class="text-sm font-semibold tabular-nums text-canvas-fg">{{ reviewProgress }}%</p>
						</div>
						<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Block review progress" :aria-valuenow="reviewProgress" aria-valuemin="0" aria-valuemax="100">
							<div class="h-full rounded-full bg-primary transition-[width]" :style="{ width: `${reviewProgress}%` }"></div>
						</div>
						<p class="mt-4 text-sm leading-6 text-muted-fg">A completed review checks visual hierarchy, iframe responsiveness, full-screen composition, accessibility basics, and meaningful use of DOM Studio components. The reusable instructions and complete checkbox queue live in <code>src/pages/blocks/REVIEW.md</code>.</p>
					</section>

					<section class="rounded-xl border border-border skin-card p-5">
						<h3 class="text-sm font-semibold">Reviewed</h3>
						<ul class="mt-3 space-y-2">
							<li v-for="block in reviewedBlockRecords" :key="block.id">
								<RouterLink :to="block.route" class="group flex items-start justify-between gap-3 rounded-lg bg-secondary/60 px-3 py-2.5 transition hover:bg-secondary">
									<span>
										<span class="block text-sm font-semibold">{{ block.label }}</span>
										<span class="mt-0.5 block text-xs text-muted-fg">Reviewed {{ block.review.reviewedAt }}</span>
										<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ block.review.components.join(', ') }}</span>
									</span>
									<span class="text-muted-fg transition group-hover:translate-x-0.5" aria-hidden="true">-&gt;</span>
								</RouterLink>
							</li>
						</ul>
						<details class="mt-4 border-t border-border pt-4">
							<summary class="cursor-pointer text-sm font-semibold text-muted-fg transition hover:text-canvas-fg">{{ remainingBlockRecords.length }} remaining to review</summary>
							<ul class="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
								<li v-for="block in remainingBlockRecords" :key="block.id">
									<RouterLink :to="block.route" class="block rounded-md px-2 py-1.5 text-sm text-muted-fg transition hover:bg-secondary hover:text-canvas-fg">{{ block.label }}</RouterLink>
								</li>
							</ul>
						</details>
					</section>
				</div>
			</DocSection>

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
				<div class="flex flex-col gap-3 rounded-lg border border-border bg-canvas p-3 lg:flex-row lg:items-center lg:justify-between">
					<label class="block min-w-0 flex-1">
						<span class="sr-only">Search blocks</span>
						<input
							v-model="searchQuery"
							type="search"
							placeholder="Search blocks..."
							class="h-10 w-full rounded-md border border-border bg-canvas px-3 text-sm text-canvas-fg outline-none transition placeholder:text-muted-fg focus:border-primary/50 focus:ring-2 focus:ring-ring/25"
						>
					</label>
					<div class="flex flex-wrap items-center gap-2">
						<div class="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5" role="toolbar" aria-label="Filter blocks by review status">
							<button
								v-for="filter in [{ label: 'All', value: 'all' }, { label: 'Reviewed', value: 'reviewed' }, { label: 'Needs review', value: 'remaining' }]"
								:key="filter.value"
								type="button"
								class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-muted-fg transition hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
								:class="reviewFilter === filter.value && 'bg-canvas text-canvas-fg shadow-sm'"
								:aria-pressed="reviewFilter === filter.value ? 'true' : 'false'"
								@click="reviewFilter = filter.value"
							>
								{{ filter.label }}
							</button>
						</div>
						<p class="text-sm text-muted-fg">{{ filteredBlockRecords.length }} of {{ blockRecords.length }}</p>
					</div>
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
									<span
										class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
										:class="block.review ? 'bg-success/15 text-success' : 'bg-secondary text-muted-fg'"
									>
										{{ block.review ? 'Reviewed' : 'Needs review' }}
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
