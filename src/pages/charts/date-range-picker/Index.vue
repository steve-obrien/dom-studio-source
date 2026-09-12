<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomDateRangePicker from './DomDateRangePicker.vue';
import ReportingPeriod from './examples/ReportingPeriod.vue';
import ReportingPeriodSource from './examples/ReportingPeriod.vue?raw';
const doc = DomDateRangePicker.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Data Visualisation">
			<DocSection title="Reporting dates and comparison periods">
				<Example :source="ReportingPeriodSource" filename="ReportingPeriod.vue"><ReportingPeriod /></Example>
			</DocSection>
			<DocSection title="Working with your data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Ranges are inclusive calendar dates. Apply emits one complete query choice; Cancel keeps the existing value. Supply anchorDate from the reporting timezone when presets must match a server-owned business date. Comparisons may fall outside the primary min/max bounds.</p>
				<RouterLink to="/charts" class="text-sm font-medium underline underline-offset-4">Explore Data Visualisation</RouterLink>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomDateRangePicker" /><ComponentEvents :component="DomDateRangePicker" /><ComponentKeyboard :component="DomDateRangePicker" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
