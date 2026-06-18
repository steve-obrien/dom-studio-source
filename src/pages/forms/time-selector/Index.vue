<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import { DomTimeSelector } from '../../lib/vue';

import MeetingTime from './examples/MeetingTime.vue';
import MeetingTimeSrc from './examples/MeetingTime.vue?raw';
import TwelveHourTime from './examples/TwelveHourTime.vue';
import TwelveHourTimeSrc from './examples/TwelveHourTime.vue?raw';

const doc = DomTimeSelector.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomTimeSelector"
					:initial="{
						label: 'Meeting time',
						description: 'Type a time or choose one from the generated list.',
						modelValue: '09:30',
						timeFormat: '24h',
						minuteStep: 15,
						min: '08:00',
						max: '18:00',
					}"
					title="Time selector playground"
					description="The input stores HH:mm by default. Use timeFormat for 12-hour labels, minuteStep for generated options, and min/max to constrain selection."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Generated business hours">
				<Example
					:source="MeetingTimeSrc"
					filename="MeetingTime.vue"
					description="Generate a selectable list from min, max, and minuteStep while still accepting typed times."
				>
					<MeetingTime />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="12-hour labels">
				<Example
					:source="TwelveHourTimeSrc"
					filename="TwelveHourTime.vue"
					description="Display 12-hour labels with AM and PM while storing the canonical HH:mm value."
				>
					<TwelveHourTime />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomTimeSelector" />
				<ComponentEvents :component="DomTimeSelector" />
				<ComponentKeyboard :component="DomTimeSelector" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
