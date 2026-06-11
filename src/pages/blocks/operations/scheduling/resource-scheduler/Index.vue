<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import ResourceScheduleBoard from './examples/ResourceScheduleBoard.vue';
import ResourceScheduleBoardSrc from './examples/ResourceScheduleBoard.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Resource Scheduler Block"
			tagline="A copyable calendar-style scheduling surface for appointment booking, capacity balancing, conflict review, and service team dispatch."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Resource schedule board">
				<Example
					:source="ResourceScheduleBoardSrc"
					filename="ResourceScheduleBoard.vue"
					presentation="iframe"
					frame-src="/blocks/operations/scheduling/resource-scheduler/preview/ResourceScheduleBoard"
					description="Copy this into service marketplaces, clinics, salons, repair, coaching, rentals, field operations, or B2B scheduling apps that need a dense but readable appointment board."
					default-open
					:preview-lines="20"
				>
					<ResourceScheduleBoard />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when operators need to understand who is booked, where capacity is tight, and which appointments need intervention.
						The block keeps resource lanes, appointment status, conflict warnings, customer context, and booking readiness in one reusable scheduling surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load resources from your staff, room, vehicle, or equipment API, including working hours, location coverage, buffer rules, and utilization targets.</li>
						<li>Normalize appointments into start/end times, resource ownership, customer or account context, service type, status, risk flags, and payment or intake readiness.</li>
						<li>Keep conflict detection server-owned. The UI can highlight overlaps and missing requirements, but the backend should validate working hours, travel buffers, lead times, and double-booking rules.</li>
						<li>Connect status changes to your booking workflow so operators can move an appointment through requested, confirmed, checked in, in progress, completed, cancelled, or no-show states.</li>
						<li>For realtime teams, subscribe to appointment updates by location and date range, then optimistically update selected cards while preserving backend validation errors.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended schedule payload">
				<CodeBlock lang="js" filename="resource-schedule.js" :code="`{
\tdateRange: {
\t\tstartsOn: '2026-06-11',
\t\tendsOn: '2026-06-15',
\t\ttimezone: 'Europe/London'
\t},
\tresources: [
\t\t{
\t\t\tid: 'res_maya',
\t\t\tname: 'Maya Chen',
\t\t\trole: 'Senior consultant',
\t\t\tlocationIds: ['loc_soho'],
\t\t\tworkingMinutes: { start: 540, end: 1020 },
\t\t\tutilizationTarget: 0.82
\t\t}
\t],
\tappointments: [
\t\t{
\t\t\tid: 'apt_2048',
\t\t\tresourceId: 'res_maya',
\t\t\tstartsAt: '2026-06-11T10:30:00+01:00',
\t\t\tendsAt: '2026-06-11T11:45:00+01:00',
\t\t\tstatus: 'confirmed',
\t\t\tservice: 'Implementation call',
\t\t\tcustomer: { id: 'cus_118', name: 'Northstar Labs' },
\t\t\trequirements: ['intake_complete', 'deposit_paid'],
\t\t\trisks: [{ key: 'travel_buffer', severity: 'warning' }]
\t\t}
\t],
\tavailabilityRules: {
\t\tminimumNoticeMinutes: 120,
\t\tdefaultBufferMinutes: 15,
\t\tallowWaitlist: true
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Calendar math</h3>
						<p class="mt-2">Use a date library for timezone conversion, daylight saving changes, resource working hours, and appointment collision checks. Keep pixel placement derived from normalized minutes.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Booking ownership</h3>
						<p class="mt-2">Treat rescheduling, cancellation, and status transitions as commands with backend validation. This prevents double-booking when multiple dispatchers are active.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Drag-to-reschedule, waitlist suggestions, travel-time routing, recurring appointments, public booking links, and calendar provider sync would make this block stronger.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
