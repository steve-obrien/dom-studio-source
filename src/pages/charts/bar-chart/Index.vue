<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomBarChart from './DomBarChart.vue';
import PlanRevenue from './examples/PlanRevenue.vue';
import PlanRevenueSource from './examples/PlanRevenue.vue?raw';
const doc = DomBarChart.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Data Visualisation">
			<DocSection title="Grouped, stacked, percentage, and horizontal bars">
				<Example :source="PlanRevenueSource" filename="PlanRevenue.vue"><PlanRevenue /></Example>
			</DocSection>
			<DocSection title="Working with your data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Records stay in your application. Select events return the original row and index. Use stable series keys and explicit colours when coordinating several charts.</p>
				<RouterLink to="/charts" class="text-sm font-medium underline underline-offset-4">Explore Data Visualisation</RouterLink>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomBarChart" /><ComponentEvents :component="DomBarChart" /><ComponentKeyboard :component="DomBarChart" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
