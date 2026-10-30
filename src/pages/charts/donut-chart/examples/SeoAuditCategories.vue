<script setup>
import { DomDonutChart } from '@getdom/studio';

const categories = [
	{ label: 'Crawlability', score: 92 },
	{ label: 'Indexability', score: 80 },
	{ label: 'Metadata', score: 67 },
	{ label: 'Structured data', score: 42 },
].map(createCategory);

/**
 * Presents an application-provided category score using the audit rating bands.
 * @param {{label: string, score: number}} category Example audit category.
 * @returns {object} Labelled score and donut segments totalling 100.
 */
function createCategory(category) {
	const color = category.score >= 80 ? 'success' : category.score >= 50 ? 'warning' : 'destructive';
	const status = category.score >= 80 ? 'Good' : category.score >= 50 ? 'Needs improvement' : 'Poor';
	return {
		...category, color, status,
		rows: [
			{ label: 'Audit score', value: category.score, color },
			{ label: 'Remaining points', value: 100 - category.score, color: `color-mix(in oklab, var(--${color}) 14%, var(--canvas))` },
		],
	};
}
</script>

<template>
	<div class="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div v-for="category in categories" :key="category.label" class="min-w-0 rounded-xl border border-border p-4">
			<DomDonutChart :title="category.label" :rows="category.rows" :height="148" :arc-width="10" :legend="false" :show-table="false">
				<template #center>
					<div :style="{ color: `var(--${category.color})` }" role="img" :aria-label="`${category.score} out of 100. ${category.status}.`">
						<span class="block text-4xl font-medium tracking-tight tabular-nums" aria-hidden="true">{{ category.score }}</span>
						<span class="mt-1 block text-xs text-muted-fg" aria-hidden="true">out of 100</span>
					</div>
				</template>
			</DomDonutChart>
			<p class="mt-4 text-center text-xs font-medium" :style="{ color: `var(--${category.color})` }">{{ category.status }}</p>
		</div>
	</div>
</template>
