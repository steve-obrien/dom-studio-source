<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import PlanEntitlementMatrix from './examples/PlanEntitlementMatrix.vue';
import PlanEntitlementMatrixSrc from './examples/PlanEntitlementMatrix.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Plan Entitlement Matrix Block"
			tagline="A copyable SaaS monetization surface for comparing plan packages, reviewing gated features, and mapping checkout-ready entitlements."
			tag="Monetization UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Packaging" title="Plan entitlement matrix">
				<Example
					:source="PlanEntitlementMatrixSrc"
					filename="PlanEntitlementMatrix.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/packaging/entitlement-matrix/preview/PlanEntitlementMatrix"
					description="Copy this into billing portals, pricing operations tools, founder dashboards, product-led growth admin screens, or customer success upgrade workflows that need clear entitlement comparison."
					default-open
					:preview-lines="18"
				>
					<PlanEntitlementMatrix />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when your app has multiple paid packages and teams need to understand exactly which limits, features, and service levels belong to each plan.
						The matrix keeps pricing, package fit, entitlement rows, checkout mappings, and readiness checks in one reusable surface without turning into a marketing page.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>plans</code> with records from your billing provider or product catalog, including price IDs, billing cadence, and package status.</li>
						<li>Replace <code>featureGroups</code> with server-owned entitlement definitions so the UI displays the same limits enforced by your API gateway and feature flags.</li>
						<li>Use stable entitlement keys for authorization checks. Labels can change for positioning, but keys should remain durable for billing, analytics, and support.</li>
						<li>Connect the checkout preview to your billing session endpoint so selected plan, cadence, add-ons, and segment intent are validated on the server before payment.</li>
						<li>Keep mobile users on the stacked plan-card view. Wide matrices work best on desktop, but account owners often review upgrades from small screens.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended entitlement shape">
				<CodeBlock lang="js" filename="plan-entitlements.js" :code="`{
\tsegment: 'growth_teams',
\tbillingCadence: 'annual',
\tplans: [
\t\t{
\t\t\tid: 'growth',
\t\t\tname: 'Growth',
\t\t\tpriceId: 'price_growth_annual',
\t\t\tmonthlyPrice: 49,
\t\t\tannualPrice: 39,
\t\t\tincludedSeats: 12,
\t\t\tcheckoutEnabled: true,
\t\t\tupgradePath: ['starter', 'growth', 'scale']
\t\t}
\t],
\tentitlements: [
\t\t{
\t\t\tkey: 'automation.runs',
\t\t\tgroup: 'Automation',
\t\t\tlabel: 'Workflow runs',
\t\t\tvalueType: 'limit',
\t\t\tvalues: {
\t\t\t\tstarter: 5000,
\t\t\t\tgrowth: 50000,
\t\t\t\tscale: 250000
\t\t\t},
\t\t\tmetered: true
\t\t},
\t\t{
\t\t\tkey: 'support.priority',
\t\t\tgroup: 'Service',
\t\t\tlabel: 'Priority support',
\t\t\tvalueType: 'boolean',
\t\t\tvalues: {
\t\t\t\tstarter: false,
\t\t\t\tgrowth: true,
\t\t\t\tscale: true
\t\t\t}
\t\t}
\t],
\taddOns: [
\t\t{ id: 'extra-seats', unitPrice: 8, enabled: true }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Billing source</h3>
						<p class="mt-2">Treat prices, SKU IDs, trial policy, tax behavior, and discount eligibility as billing-provider data. The block should preview the order, not calculate final billing authority.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Runtime gating</h3>
						<p class="mt-2">Use the same entitlement keys in server middleware, feature flags, usage meters, and UI copy so upgrades and disabled states stay consistent across the app.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include editable entitlement rows, plan version history, migration previews, discount testing, usage forecast overlays, and sales-assisted quote states.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
