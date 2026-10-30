<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomMetricCard from './DomMetricCard.vue';
import ReportingMetrics from './examples/ReportingMetrics.vue';
import ReportingMetricsSource from './examples/ReportingMetrics.vue?raw';
const doc = DomMetricCard.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Data Visualisation">
			<DocSection title="Revenue, churn, and zero values">
				<Example :source="ReportingMetricsSource" filename="ReportingMetrics.vue"><ReportingMetrics /></Example>
			</DocSection>
			<DocSection title="Working with your data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Records stay in your application. Select events return the original row and index. Use stable series keys and explicit colours when coordinating several charts.</p>
				<RouterLink to="/charts" class="text-sm font-medium underline underline-offset-4">Explore Data Visualisation</RouterLink>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomMetricCard" /><ComponentEvents :component="DomMetricCard" /><ComponentKeyboard :component="DomMetricCard" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
