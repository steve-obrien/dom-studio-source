<script setup>
import DocSection from '../../../../_layout/DocSection.vue';
import Example from '../../../../_layout/docs/Example.vue';
import CustomisableDaysCalendar from './CustomisableDaysCalendar.vue';
import CustomisableDaysCalendarSrc from './CustomisableDaysCalendar.vue?raw';
</script>

<template>
	<DocSection eyebrow="Demo" title="Customisable days">
		<Example
			:source="CustomisableDaysCalendarSrc"
			filename="CustomisableDaysCalendar.vue"
			description="Keep day artwork in app-owned state: apply image backgrounds, paint freehand strokes directly into a canvas on each date, and set an independent background colour for every event."
		>
			<CustomisableDaysCalendar />
		</Example>
	</DocSection>
</template>
