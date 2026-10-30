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
			tagline="A working host calendar with API-backed inventory, date drafts, partner holds, validation, and multi-channel publishing."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce / Booking" title="Availability pricing calendar">
				<Example
					:source="AvailabilityPricingCalendarSrc"
					filename="AvailabilityPricingCalendar.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/booking/availability-pricing-calendar/preview/AvailabilityPricingCalendar"
					description="Copy the responsive calendar, focused day inspector, and repository-local API contract into booking marketplaces, rental host tools, appointment inventory apps, or any product where teams manage availability and revenue by date."
					default-open
					:preview-lines="18"
					frame-flush-edges
				>
					<AvailabilityPricingCalendar />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when calendar inventory is the product workflow, not a decorative report.
						The Airbnb-style host-calendar hierarchy keeps the month canvas primary and gives one selected date a persistent inspector, without copying product branding or assets.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Use <code>GET /api/block-demos/availability-pricing-calendar/:listingId</code> to load resolved rates, holds, restrictions, drafts, channel state, and revision metadata.</li>
						<li>Save one date with <code>PATCH /api/block-demos/availability-pricing-calendar/:listingId/days/:date</code>, then publish or discard the accumulated drafts through focused mutation routes.</li>
						<li>Persist date rules as ranges where possible. Store single-day overrides only when they differ from the listing baseline or seasonal policy.</li>
						<li>The demo API validates price, availability, minimum stay, restrictions, loaded months, listing identity, and optimistic publish revisions.</li>
						<li>Show demand signals from search volume, booking pace, local events, occupancy targets, or competitor-rate feeds when your product has that data.</li>
						<li>Keep external-channel sync separate from local save state so users understand whether the rule is saved, published, and distributed.</li>
						<li>This example uses a process-local store so reloads preserve state while the dev server is running. Production should replace it with authenticated, authorized database writes and real channel integrations.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended availability payload">
				<CodeBlock lang="js" filename="availability-rule.js" :code="`{
\tlistingId: 'listing_river_loft',
\tdate: '2026-08-08',
\tstatus: 'available',
\tprice: 244,
\tcurrency: 'GBP',
\tminimumStay: 3,
\trestrictions: ['event-pricing'],
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
\trevision: 13,
\tupdatedBy: 'Lina Patel'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Rule engine boundary</h3>
						<p class="mt-2">The repository-local API already merges deterministic baseline rates, seasonal rules, holds, and manual overrides. Replace its process-local store with your database and authorization boundary.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Bulk editing</h3>
						<p class="mt-2">For production, extend date selection to ranges and weekdays, then reuse the same editor payload for single-day and multi-day publishing.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include range selection, real reservation conflicts, idempotent channel jobs, webhook reconciliation, and an audit record for every publish.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
