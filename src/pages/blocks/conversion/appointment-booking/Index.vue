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
			tagline="A complete scheduling section with rolling availability, timezone-aware slots, server holds, attendee validation, confirmation proof, and cancellation."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Conversion" title="Appointment booking flow">
				<Example
					:source="AppointmentBookingFlowSrc"
					filename="AppointmentBookingFlow.vue"
					presentation="iframe"
					frame-src="/blocks/conversion/appointment-booking/preview/AppointmentBookingFlow"
					description="Copy this into a sales site, onboarding flow, services marketplace, clinic portal, or customer-success app that needs a complete booking journey rather than a static calendar mock."
					default-open
					:preview-lines="14"
				>
					<AppointmentBookingFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How the working section fits together">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when booking belongs inside the product rather than behind an outbound scheduling link. The example keeps appointment choice, live availability, slot contention, attendee details, confirmation, and cancellation in one API-backed journey.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/appointment-booking/bootstrap</code> returns rolling bookable dates, meeting types, timezone choices, policy, and attendee defaults.</li>
						<li>The availability route resolves open, host-busy, held, and booked slots for the selected meeting type, date, and timezone.</li>
						<li>The hold route requires the current availability revision and returns <code>409</code> when another visitor claims a stale time.</li>
						<li>The booking route validates the attendee and consent server-side, consumes the hold, and issues immutable confirmation proof.</li>
						<li>Confirmed appointments can be read and cancelled through dedicated routes; cancellation releases the slot and changes the receipt checksum.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="API-backed booking receipt">
				<CodeBlock lang="js" filename="booking-receipt.js" :code="`{
	id: 'receipt-nst-902',
	reference: 'NST-902',
	status: 'confirmed',
	issuedAt: '2026-08-01T16:18:12.000Z',
	checksum: 'd3fcd4b40b504814',
	calendarDelivery: 'queued',
	booking: {
		meetingTypeId: 'implementation',
		startsAt: '2026-08-03T08:30:00.000Z',
		durationMinutes: 45,
		timezone: 'Europe/London',
		attendee: { name: 'Alex Morgan', email: 'alex@northstar.tools' }
	}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provider adapter</h3>
						<p class="mt-2">Replace the process-local schedule with Google Calendar, Microsoft Graph, Cal.com, or an application-owned availability service while preserving the response contract.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Contention</h3>
						<p class="mt-2">Keep the optimistic revision and expiring hold even when the calendar provider offers its own booking token; they make recovery explicit to the attendee.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production boundary</h3>
						<p class="mt-2">Add rate limits, durable holds, calendar delivery jobs, authenticated management links, reminder policy, and immutable audit storage before production use.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
