<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import AvailabilityPricingCalendar from './examples/AvailabilityPricingCalendar.vue';
import AvailabilityPricingCalendarSrc from './examples/AvailabilityPricingCalendar.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Availability Pricing Calendar Block"
			tagline="A copyable booking calendar for scanning demand, editing nightly prices, blocking dates, managing minimum stays, and publishing inventory updates."
			tag="Booking UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce / Booking" title="Availability pricing calendar">
				<Example
					:source="AvailabilityPricingCalendarSrc"
					filename="AvailabilityPricingCalendar.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/booking/availability-pricing-calendar/preview/AvailabilityPricingCalendar"
					description="Copy this into booking marketplaces, rental host tools, appointment inventory apps, event scheduling products, travel operations dashboards, or any product where users manage availability and revenue by date."
					default-open
					:preview-lines="18"
				>
					<AvailabilityPricingCalendar />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when calendar inventory is the product workflow, not just a reporting view.
						The pattern keeps demand signals, price controls, availability states, stay rules, and publish confirmation close to the date grid so hosts and operators can make confident revenue changes quickly.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>listings</code> and <code>calendarDays</code> with records from your availability, reservation, or inventory API.</li>
						<li>Persist date rules as ranges where possible. Store single-day overrides only when they differ from the listing baseline or seasonal policy.</li>
						<li>Send price, availability, minimum stay, and restriction tags through a server validation endpoint before publishing changes.</li>
						<li>Show demand signals from search volume, booking pace, local events, occupancy targets, or competitor-rate feeds when your product has that data.</li>
						<li>Keep external-channel sync separate from local save state so users understand whether the rule is saved, published, and distributed.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended availability payload">
				<CodeBlock lang="js" filename="availability-rule.js" :code="`{
\tlistingId: 'listing_river_loft',
\tdate: '2026-07-18',
\tstatus: 'available',
\tprice: {
\t\tamount: 219,
\t\tcurrency: 'GBP',
\t\tstrategy: 'event-weekend'
\t},
\tminimumStay: 3,
\trestrictions: ['no-check-in', 'manual-review'],
\tdemand: {
\t\tscore: 88,
\t\tlabel: 'Event demand',
\t\tsearches: 142,
\t\tbookedNearby: 18
\t},
\tchannelSync: [
\t\t{ channel: 'Direct', status: 'synced' },
\t\t{ channel: 'Marketplace', status: 'pending' }
\t],
\tlastPublishedAt: '2026-06-12T09:45:00Z',
\tupdatedBy: 'usr_lina'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Rule engine boundary</h3>
						<p class="mt-2">Let the server merge baseline rates, seasonal rules, reservations, holds, and manual overrides. The UI should display the resolved state plus editable overrides.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Bulk editing</h3>
						<p class="mt-2">For production, extend date selection to ranges and weekdays, then reuse the same editor payload for single-day and multi-day publishing.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include range drag selection, rate recommendations, channel conflict warnings, calendar import, and reusable demand-score chips.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
