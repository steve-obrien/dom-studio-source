<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import CardControlCenter from './examples/CardControlCenter.vue';
import CardControlCenterSrc from './examples/CardControlCenter.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Card Control Center Block"
			tagline="A mobile-first fintech control surface for freezing cards, changing spend limits, managing authorization controls, and launching sensitive actions from a bottom sheet."
			tag="Fintech UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Cards" title="Card control center">
				<Example
					:source="CardControlCenterSrc"
					filename="CardControlCenter.vue"
					presentation="iframe"
					frame-src="/blocks/financial-services/cards/card-control-center/preview/CardControlCenter"
					description="Copy this into banking, wallet, expense management, marketplace payout, creator finance, or employee-card apps where users need immediate card self-service with clear policy context."
					default-open
					:preview-lines="18"
				>
					<CardControlCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when cardholders or admins need to control issued cards without entering a generic settings console.
						The pattern keeps the active card, limits, security toggles, and sensitive actions inside a one-handed mobile shell while still giving desktop implementers the integration packet they need.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Hydrate <code>cards</code> from your issuing processor or card ledger with stable card ids, status, owner, last four, expiry, allowed controls, and current policy.</li>
						<li>Keep freeze, unfreeze, replacement, card-detail reveal, and travel notices server-authorized. The UI should reflect capabilities returned by policy and risk services.</li>
						<li>Persist limit changes as policy revisions with actor, previous value, next value, cadence, merchant category constraints, and approval state.</li>
						<li>Use step-up authentication before revealing PAN, expiry, CVC, or provisioning tokens. Never store sensitive card details in client state longer than the reveal window.</li>
						<li>Emit audit events for every card control change so support, compliance, and fraud teams can reconstruct customer-visible decisions.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended card control payload">
				<CodeBlock lang="js" filename="card-control.js" :code="`{
	id: 'card_2048',
	accountId: 'acct_aster_business',
	cardholderId: 'usr_maya',
	name: 'Founder card',
	type: 'virtual',
	last4: '2048',
	expiry: '2029-08',
	status: 'active',
	policy: {
		spendLimit: 3200,
		currency: 'GBP',
		cadence: 'monthly',
		merchantPolicy: 'SaaS and travel',
		onlinePayments: true,
		atmWithdrawals: false,
		internationalPayments: true,
		walletTokenEnabled: true
	},
	availableActions: ['freeze', 'reveal_details', 'travel_notice', 'replace'],
	audit: [
		{ type: 'limit.updated', actorId: 'usr_maya', createdAt: '2026-06-12T08:15:00Z' }
	]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Authorization layer</h3>
						<p class="mt-2">Return permitted controls by card, user role, risk score, country, and processor state. Disable or hide controls the user cannot perform.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Sensitive actions</h3>
						<p class="mt-2">Treat reveal, replace, and unfreeze as sensitive actions. Pair the bottom sheet with step-up auth, biometric confirmation, or server challenge flows.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include merchant-category pickers, travel-date calendars, physical card shipment tracking, biometric re-auth, and reusable card art previews.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
