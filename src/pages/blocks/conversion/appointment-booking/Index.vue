<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import AppointmentBookingFlow from './examples/AppointmentBookingFlow.vue';
import AppointmentBookingFlowSrc from './examples/AppointmentBookingFlow.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Appointment Booking Block"
			tagline="A reusable stepped scheduling flow for selecting a meeting type, comparing free and busy slots, collecting attendee details, and confirming a booking."
			tag="Conversion UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Conversion" title="Appointment booking flow">
				<Example
					:source="AppointmentBookingFlowSrc"
					filename="AppointmentBookingFlow.vue"
					presentation="iframe"
					frame-src="/blocks/conversion/appointment-booking/preview/AppointmentBookingFlow"
					description="Copy this into a sales site, product onboarding flow, services marketplace, clinic portal, or customer success app. Replace the local appointment types and availability maps with data from your scheduling provider."
					default-open
					:preview-lines="14"
				>
					<AppointmentBookingFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when your app needs booking inside the product instead of sending users to a separate scheduler.
						It keeps appointment type, day and slot selection, attendee collection, and final confirmation in a guarded step sequence.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>meetingTypes</code> with the services, calls, or appointment types your product supports.</li>
						<li>Load <code>availabilityByType</code> from your calendar provider after the user picks a meeting type, date, and timezone.</li>
						<li>Pass only days with at least one free slot into <code>DomCalendar</code> through <code>enabledDates</code>.</li>
						<li>Keep unavailable slots in the response with a busy status so the UI can show why a time cannot be selected.</li>
						<li>Submit only after the selected slot is available and the attendee fields pass validation, then create the calendar event.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended booking payload">
				<CodeBlock lang="js" filename="booking-request.js" :code="`{
\tmeetingTypeId: 'implementation',
\thostId: 'user_elliot_grant',
\tstartsAt: '2026-06-16T10:30:00+01:00',
\tdurationMinutes: 45,
\ttimezone: 'Europe/London',
\tattendee: {
\t\tname: 'Alex Morgan',
\t\temail: 'alex@example.com',
\t\tcompany: 'Northstar Labs',
\t\tnotes: 'We want to understand launch timing for a team workspace.'
\t},
\tstatus: 'confirmed',
\tsource: 'product_onboarding'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Availability</h3>
						<p class="mt-2">Fetch free and busy slots after type, date, and timezone change. Cache per day to keep the flow fast.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Confirmation</h3>
						<p class="mt-2">Create a temporary hold before final submit if appointments can be claimed by multiple visitors at once.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Reuse</h3>
						<p class="mt-2">Keep the data shape stable so product, sales, support, and services teams can share the same booking surface.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
