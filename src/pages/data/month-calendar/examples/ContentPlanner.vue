<script setup>
import { computed, ref } from 'vue';
import { DomMonthCalendar } from '../../../lib/vue';

const startDate = '2026-06-11';
const initialArticles = [
	{ date: '2026-06-11', type: 'Guide: Explainer', title: 'controlled components', volume: '170', difficulty: 14, cta: 'Visit Article' },
	{ date: '2026-06-12', type: 'Guide: How-to', title: 'tailwind css themes', volume: '390', difficulty: 24, cta: 'View Article' },
	{ date: '2026-06-13', type: 'List: Examples', title: 'examples of a sidebar', volume: '590', difficulty: 22 },
	{ date: '2026-06-14', type: 'List: Resources', title: 'tailwind css components', volume: '390', difficulty: 45 },
	{ date: '2026-06-15', type: 'Guide: How-to', title: 'component testing', volume: '480', difficulty: 26 },
	{ date: '2026-06-16', type: 'Guide: Explainer', title: 'border color in css', volume: '590', difficulty: 16 },
	{ date: '2026-06-17', type: 'Guide: How-to', title: 'switch button css', volume: '590', difficulty: 10 },
	{ date: '2026-06-18', type: 'Guide: Explainer', title: 'code splitting', volume: '210', difficulty: 30 },
	{ date: '2026-06-19', type: 'Guide: Explainer', title: 'component composition', volume: '50', difficulty: 18 },
	{ date: '2026-06-20', type: 'Guide: How-to', title: 'react loading bar', volume: '590', difficulty: 17 },
	{ date: '2026-06-21', type: 'Guide: Explainer', title: 'vue component library', volume: '320', difficulty: 30 },
	{ date: '2026-06-22', type: 'Guide: How-to', title: 'accessibility audit', volume: '150', difficulty: 26 },
	{ date: '2026-06-23', type: 'Guide: How-to', title: 'js progress bar', volume: '590', difficulty: 29 },
	{ date: '2026-06-24', type: 'Guide: Explainer', title: 'performance optimization', volume: '320', difficulty: 33 },
	{ date: '2026-06-25', type: 'Guide: Explainer', title: 'css variables', volume: '2,900', difficulty: 0 },
	{ date: '2026-06-26', type: 'List: Examples', title: 'component examples', volume: '390', difficulty: 39 },
	{ date: '2026-06-27', type: 'Guide: How-to', title: 'screen reader testing', volume: '260', difficulty: 18 },
	{ date: '2026-06-28', type: 'Guide: Explainer', title: 'high contrast mode', volume: '920', difficulty: 24 },
	{ date: '2026-06-29', type: 'Guide: How-to', title: 'accessible dropdown menu', volume: '70', difficulty: 15 },
	{ date: '2026-06-30', type: 'List: Resources', title: 'design system tools', volume: '210', difficulty: 24 },
	{ date: '2026-07-01', type: 'Guide: Explainer', title: 'menu component', volume: '70', difficulty: 38 },
	{ date: '2026-07-02', type: 'List: Resources', title: 'accessibility testing tools', volume: '50', difficulty: 40 },
	{ date: '2026-07-03', type: 'Guide: Explainer', title: 'color contrast accessibility', volume: '390', difficulty: 52 },
	{ date: '2026-07-04', type: 'Guide: Explainer', title: 'command palette', volume: '760', difficulty: 24 },
	{ date: '2026-07-05', type: 'Guide: Explainer', title: 'drawer component', volume: '140', difficulty: 30 },
];

const articles = ref(initialArticles.map((article, index) => ({
	id: `article-${index + 1}`,
	...article,
})));
const articleByDate = computed(() => Object.fromEntries(articles.value.map((article) => [article.date, article])));

function articleFor(value) {
	return articleByDate.value[value];
}

function dragDataFor(article) {
	return {
		id: article.id,
		title: article.title,
		sourceDate: article.date,
	};
}

function moveArticle({ data, sourceValue, targetValue }) {
	if (!data?.id || !targetValue || sourceValue === targetValue) return;
	const sourceArticle = articles.value.find((article) => article.id === data.id);
	if (!sourceArticle) return;
	const sourceDate = sourceValue || sourceArticle.date;
	const targetArticle = articleFor(targetValue);

	articles.value = articles.value.map((article) => {
		if (article.id === sourceArticle.id) {
			return {
				...article,
				date: targetValue,
			};
		}
		if (targetArticle && article.id === targetArticle.id) {
			return {
				...article,
				date: sourceDate,
			};
		}
		return article;
	});
}

function badgeClass(article) {
	return article.type.startsWith('List:')
		? 'border-amber-300 bg-amber-50 text-amber-800'
		: 'border-sky-300 bg-sky-50 text-sky-800';
}
</script>

<template>
	<div class="w-[78rem] max-w-full" data-testid="content-planner-example">
		<DomMonthCalendar
			:start-date="startDate"
			:months="2"
			:muted-before="startDate"
			drag-and-drop
			@day-drop="moveArticle"
		>
			<template #month-header>
				<span>Articles are generated and published at 7AM-9AM UTC.</span>
			</template>

			<template #default="{ cell, drag, dragAttrs }">
				<article
					v-for="article in cell.currentMonth && articleFor(cell.value) ? [articleFor(cell.value)] : []"
					:key="article.id"
					v-bind="dragAttrs(dragDataFor(article))"
					class="flex min-h-[7.4rem] cursor-grab flex-col rounded-lg border border-violet-200 bg-violet-50/35 p-3 text-sm shadow-xs transition active:cursor-grabbing"
					:class="drag.source && drag.data?.id === article.id && 'opacity-60 ring-2 ring-ring/40'"
				>
					<div
						class="mb-2 w-fit rounded-full border px-1.5 py-0.5 text-[11px] font-bold leading-none"
						:class="badgeClass(article)"
					>
						{{ article.type }}
					</div>

					<h3 class="text-sm font-bold leading-5 text-canvas-fg">
						{{ article.title }}
					</h3>

					<div class="mt-auto flex items-center justify-between border-t border-violet-100 pt-2 text-xs text-muted-fg">
						<span>Vol: <strong class="text-canvas-fg">{{ article.volume }}</strong></span>
						<span>Diff: <strong class="text-canvas-fg">{{ article.difficulty }}</strong></span>
					</div>

					<a
						v-if="article.cta"
						href="#"
						class="mt-2 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-bold text-primary-fg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						@click.prevent
					>
						{{ article.cta }}
					</a>
				</article>
			</template>
		</DomMonthCalendar>
	</div>
</template>
