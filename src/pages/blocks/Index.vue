<script setup>
import { RouterLink } from 'vue-router';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import { getBlockCategories, getBlockRecords } from './blockRegistry.js';

const blockRecords = getBlockRecords();
const blockCategories = getBlockCategories();
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
						class="rounded-lg border border-border skin-raised p-4"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<h2 class="text-base font-semibold text-fg">{{ category.name }}</h2>
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
								class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-fg transition hover:border-primary/40 hover:text-fg"
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
				<div class="grid gap-3">
					<RouterLink
						v-for="block in blockRecords"
						:key="block.id"
						:to="block.route"
						class="group rounded-lg border border-border skin-raised p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
					>
						<div class="flex items-start gap-3">
							<div class="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-fg">
								<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
									<path :d="block.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h2 class="text-base font-semibold text-fg">{{ block.label }}</h2>
									<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">
										{{ block.category }}
									</span>
								</div>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ block.summary }}</p>
								<p class="mt-3 text-xs font-medium text-muted-fg">
									{{ block.exampleCount }} {{ block.exampleCount === 1 ? 'example' : 'examples' }}
									<span aria-hidden="true"> / </span>
									<code>{{ block.sourcePath }}</code>
								</p>
							</div>
							<span class="mt-1 text-muted-fg transition group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden="true">
								-&gt;
							</span>
						</div>
					</RouterLink>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
