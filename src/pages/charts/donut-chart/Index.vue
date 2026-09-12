<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import DomDonutChart from './DomDonutChart.vue';
import TrafficSources from './examples/TrafficSources.vue';
import TrafficSourcesSource from './examples/TrafficSources.vue?raw';
import SeoAuditScore from './examples/SeoAuditScore.vue';
import SeoAuditScoreSource from './examples/SeoAuditScore.vue?raw';
import SeoAuditCategories from './examples/SeoAuditCategories.vue';
import SeoAuditCategoriesSource from './examples/SeoAuditCategories.vue?raw';
const doc = DomDonutChart.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Data Visualisation">
			<DocSection title="Category shares and selection">
				<Example :source="TrafficSourcesSource" filename="TrafficSources.vue"><TrafficSources /></Example>
			</DocSection>
			<DocSection title="Overall technical SEO score" id="seo-audit-score">
				<Example :source="SeoAuditScoreSource" filename="SeoAuditScore.vue" description="A score out of 100 with a thin ring and a matching centre label. Adjust the example score to preview the rating bands."><SeoAuditScore /></Example>
			</DocSection>
			<DocSection title="SEO audit category scores">
				<Example :source="SeoAuditCategoriesSource" filename="SeoAuditCategories.vue" description="Compact scores for the main areas of a technical audit. Green begins at 80, amber at 50, and red covers scores below 50."><SeoAuditCategories /></Example>
			</DocSection>
			<DocSection title="Working with your data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Supply one row per category. Values must be non-negative. Zero values remain in the data table without creating artificial slices. Missing values appear as a dash; the centre total includes visible finite values.</p>
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">For score rings, supply the score and its remainder to 100, then use the centre slot to show the score. These examples use application-defined SEO bands: 80–100 good, 50–79 needs improvement, and 0–49 poor. The audit service owns the scoring calculation; category scores are not necessarily equally weighted.</p>
				<RouterLink to="/charts" class="text-sm font-medium underline underline-offset-4">Explore Data Visualisation</RouterLink>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomDonutChart" /><ComponentSlots :component="DomDonutChart" /><ComponentEvents :component="DomDonutChart" /><ComponentKeyboard :component="DomDonutChart" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
