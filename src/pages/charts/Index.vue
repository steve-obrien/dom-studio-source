<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import Example from '../_layout/docs/Example.vue';
import AnalyticsOverview from './examples/AnalyticsOverview.vue';
import AnalyticsOverviewSource from './examples/AnalyticsOverview.vue?raw';

const components = [
	{ name: 'Line chart', tag: 'DomLineChart', slug: 'line-chart', description: 'Trends, comparisons, and targets. Category, time, and numeric axes.' },
	{ name: 'Area chart', tag: 'DomAreaChart', slug: 'area-chart', description: 'Volume over time, overlapping series, and stacked composition.' },
	{ name: 'Bar chart', tag: 'DomBarChart', slug: 'bar-chart', description: 'Grouped, stacked, percentage, and horizontal comparisons.' },
	{ name: 'Donut chart', tag: 'DomDonutChart', slug: 'donut-chart', description: 'Category shares, centre totals, and selectable legends.' },
	{ name: 'Sparkline', tag: 'DomSparkline', slug: 'sparkline', description: 'Compact trends inside cards, tables, and resource lists.' },
	{ name: 'Metric card', tag: 'DomMetricCard', slug: 'metric-card', description: 'Values, units, comparison periods, and optional sparklines.' },
	{ name: 'Date range picker', tag: 'DomDateRangePicker', slug: 'date-range-picker', description: 'Reporting presets, custom dates, and comparison periods.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Data Visualisation" eyebrow="DOM Studio" tag="Charts & reporting" tagline="Turn application data into clear charts. Consistent colours, useful defaults, and examples you can own and adapt.">
			<DocSection title="A complete reporting surface" eyebrow="Live example">
				<Example :source="AnalyticsOverviewSource" filename="AnalyticsOverview.vue" description="Choose a date range to update the traffic chart and its summary metrics. The lower cards show separate full-month reports."><AnalyticsOverview /></Example>
			</DocSection>
			<DocSection title="Charts and reporting components" eyebrow="Explore">
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<RouterLink v-for="item in components" :key="item.slug" :to="`/charts/${item.slug}`" class="block rounded-xl border border-border skin-card p-5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<h3 class="text-base font-semibold">{{ item.name }} <span class="float-right text-muted-fg" aria-hidden="true">↗</span></h3>
						<code class="mt-3 inline-block rounded-md bg-secondary px-2 py-1 text-xs text-muted-fg">{{ item.tag }}</code>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ item.description }}</p>
					</RouterLink>
				</div>
			</DocSection>
			<DocSection title="Finance" eyebrow="Application examples">
				<RouterLink to="/charts/finance" class="block rounded-xl border border-border skin-card p-6 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
					<h3 class="text-lg font-semibold">Finance & cashflow <span class="float-right text-muted-fg" aria-hidden="true">↗</span></h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">Investment portfolios, bank money in and out, cash projections, and a simulated transaction feed that updates the reports and charts.</p>
				</RouterLink>
			</DocSection>
			<DocSection title="One chart language" eyebrow="Working with data">
				<div class="grid gap-5 md:grid-cols-3">
					<div><h3 class="text-sm font-semibold">Your records, directly</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Pass rows, an xKey, and series definitions. Applications own fetching, aggregation, timezone policy, and comparisons. Missing measurements remain distinct from zero.</p></div>
					<div><h3 class="text-sm font-semibold">Styled with your theme</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Chart colours use --chart-1 through --chart-5. Axes, grid lines, tooltips, and legends use the surrounding theme. Assign explicit colours to coordinate multiple charts.</p></div>
					<div><h3 class="text-sm font-semibold">More than a picture</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Use the keyboard to inspect points, toggle legends, and open the original data table. Line, area, and bar charts emit the original record when a point is selected.</p></div>
				</div>
			</DocSection>
			<DocSection title="Built on Unovis" eyebrow="Custom compositions">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">The chart family uses Unovis 1.7. DOM Studio supplies the record mapping, theme integration, shared states, and reporting controls. Import DomChartContainer, DomChartLegend, and DomChartTooltip when composing a custom visualisation with Unovis. The standard charts load their drawing engine after mount; headings and data tables are available during server rendering.</p>
				<a href="https://unovis.dev/docs/intro" target="_blank" rel="noopener noreferrer" class="text-sm font-medium underline underline-offset-4">Unovis documentation</a>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
