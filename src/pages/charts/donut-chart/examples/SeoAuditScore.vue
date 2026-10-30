<script setup>
import { computed, ref } from 'vue';
import { DomDonutChart } from '@getdom/studio';

const score = ref(86);
const rating = computed(getRating);
const rows = computed(getRows);

/** @returns {object} Application-defined rating for the current example score. */
function getRating() {
	if (score.value >= 80) return { label: 'Good', color: 'success', heading: 'Strong technical foundations', description: 'Keep resolving the remaining audit findings and monitor changes as the site grows.' };
	if (score.value >= 50) return { label: 'Needs improvement', color: 'warning', heading: 'Room for improvement', description: 'Review the highest-impact findings first, then work through the remaining technical issues.' };
	return { label: 'Poor', color: 'destructive', heading: 'Technical issues need attention', description: 'Start with findings that affect crawling and indexing, then rerun the audit after fixes.' };
}

/** @returns {Array<object>} Earned points and a muted remainder, always totalling 100. */
function getRows() {
	return [
		{ label: 'Audit score', value: score.value, color: rating.value.color },
		{ label: 'Remaining points', value: 100 - score.value, color: `color-mix(in oklab, var(--${rating.value.color}) 14%, var(--canvas))` },
	];
}
</script>

<template>
	<div class="w-full space-y-7">
		<div class="grid items-center gap-8 sm:grid-cols-[14rem_1fr]">
			<DomDonutChart title="Technical SEO score" class="mx-auto max-w-56" :rows="rows" :height="192" :arc-width="12" :legend="false" :show-table="false">
				<template #center>
					<div :style="{ color: `var(--${rating.color})` }" role="img" :aria-label="`${score} out of 100. ${rating.label}.`">
						<span class="block text-6xl font-medium tracking-tight tabular-nums" aria-hidden="true">{{ score }}</span>
						<span class="mt-2 block text-xs text-muted-fg" aria-hidden="true">out of 100</span>
					</div>
				</template>
			</DomDonutChart>
			<div class="space-y-3">
				<p class="text-xs font-medium uppercase tracking-wider text-muted-fg">Overall audit · Example report</p>
				<p class="inline-flex items-center gap-2 text-sm font-semibold" :style="{ color: `var(--${rating.color})` }"><span class="size-2 rounded-full bg-current" aria-hidden="true" />{{ rating.label }}</p>
				<h3 class="text-xl font-semibold tracking-tight">{{ rating.heading }}</h3>
				<p class="max-w-lg text-sm leading-6 text-muted-fg">{{ rating.description }}</p>
			</div>
		</div>
		<div class="space-y-4 border-t border-border pt-5">
			<label class="flex flex-wrap items-center gap-4 text-sm">
				<span class="font-medium">Preview score</span>
				<input v-model.number="score" type="range" min="0" max="100" step="1" class="min-w-32 flex-1 cursor-pointer accent-primary" />
				<output class="w-14 text-right text-xs tabular-nums text-muted-fg">{{ score }} / 100</output>
			</label>
			<div class="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-fg">
				<span class="inline-flex items-center gap-2"><span class="size-2 rounded-full bg-destructive" aria-hidden="true" />0–49 Poor</span>
				<span class="inline-flex items-center gap-2"><span class="size-2 rounded-full bg-warning" aria-hidden="true" />50–79 Needs improvement</span>
				<span class="inline-flex items-center gap-2"><span class="size-2 rounded-full bg-success" aria-hidden="true" />80–100 Good</span>
			</div>
		</div>
	</div>
</template>
