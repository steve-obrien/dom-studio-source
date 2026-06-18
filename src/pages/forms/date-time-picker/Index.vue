<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import { DomDateTimePicker } from '../../lib/vue';

import AppointmentDateTime from './examples/AppointmentDateTime.vue';
import AppointmentDateTimeSrc from './examples/AppointmentDateTime.vue?raw';
import UsDateTime from './examples/UsDateTime.vue';
import UsDateTimeSrc from './examples/UsDateTime.vue?raw';

const doc = DomDateTimePicker.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomDateTimePicker"
					:initial="{
						label: 'Appointment',
						description: 'Type dd/mm/yyyy plus a time, or choose both from the popover.',
						modelValue: '2026-06-18T09:30',
						dateFormat: 'dd/mm/yyyy',
						timeFormat: '24h',
						minuteStep: 15,
						min: '2026-06-01T08:00',
						max: '2026-06-30T18:00',
						calendarProps: { min: '2026-06-01', max: '2026-06-30' },
					}"
					title="Date time picker playground"
					description="The input stores a local YYYY-MM-DDTHH:mm value. Calendar props configure the date grid; time props configure generated times."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Appointment date and time">
				<Example
					:source="AppointmentDateTimeSrc"
					filename="AppointmentDateTime.vue"
					description="Combine a calendar date with generated time slots, then store a local ISO-like date-time string."
				>
					<AppointmentDateTime />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="US date and 12-hour time">
				<Example
					:source="UsDateTimeSrc"
					filename="UsDateTime.vue"
					description="Use mm/dd/yyyy parsing and 12-hour time labels while keeping the stored value canonical."
				>
					<UsDateTime />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomDateTimePicker" />
				<ComponentEvents :component="DomDateTimePicker" />
				<ComponentKeyboard :component="DomDateTimePicker" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
