<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomLineChart from './DomLineChart.vue';
import MonthlyRevenue from './examples/MonthlyRevenue.vue';
import MonthlyRevenueSource from './examples/MonthlyRevenue.vue?raw';
import ChartStates from './examples/ChartStates.vue';
import ChartStatesSource from './examples/ChartStates.vue?raw';
const doc = DomLineChart.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Data Visualisation">
			<DocSection title="Revenue and a target">
				<Example :source="MonthlyRevenueSource" filename="MonthlyRevenue.vue"><MonthlyRevenue /></Example>
			</DocSection>
			<DocSection title="Loading, errors, missing data, and zero">
				<Example :source="ChartStatesSource" filename="ChartStates.vue"><ChartStates /></Example>
			</DocSection>
			<DocSection title="Working with your data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Records stay in your application. Select events return the original row and index. Use stable series keys and explicit colours when coordinating several charts.</p>
				<RouterLink to="/charts" class="text-sm font-medium underline underline-offset-4">Explore Data Visualisation</RouterLink>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomLineChart" /><ComponentEvents :component="DomLineChart" /><ComponentKeyboard :component="DomLineChart" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
