<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import SubscriptionSettings from './examples/SubscriptionSettings.vue';
import SubscriptionSettingsSrc from './examples/SubscriptionSettings.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Organization Billing Block"
			tagline="A production-minded organization billing console for payment methods, invoice history, legal details, purchase orders, billing contacts, addresses, and business tax IDs."
			tag="Billing UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Organization Settings" title="Billing console">
				<Example
					:source="SubscriptionSettingsSrc"
					filename="SubscriptionSettings.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/billing/preview/SubscriptionSettings"
					description="Copy this into an organization settings area, then connect the payment methods, invoice documents, billing roles, legal profile, and tax identifiers to your billing service."
					default-open
					:preview-lines="16"
				>
					<SubscriptionSettings />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block for organization-owned billing rather than a personal account payment screen. The selected
						organization should resolve to one durable billing customer, while owner and billing-viewer permissions
						control which tabs and actions the server returns.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Create and update payment methods through Stripe Elements or a short-lived Stripe Customer Portal session. Never collect raw card details in application fields.</li>
						<li>Use a SetupIntent to attach a reusable payment method, then update the Stripe Customer or subscription default only after server-side authorization.</li>
						<li>Load invoices, receipts, credit notes, payment status, and hosted download URLs from a server-owned billing endpoint. Do not expose unrestricted Stripe list APIs to the browser.</li>
						<li>Persist company name, purchase order, billing email, address, and tax preferences against the organization, then synchronize the supported fields to the Stripe Customer.</li>
						<li>Model purchase orders as an application preference and copy the value into invoice custom fields or metadata before invoice finalization.</li>
						<li>Explain that profile and tax ID changes affect future invoices. Previously finalized invoices should keep their original legal and tax details.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended organization payload">
				<CodeBlock lang="js" filename="organization-billing.js" :code="`{
\torganization: {
\t\tid: 'org_northstar_7f29',
\t\tname: 'Northstar Research',
\t\tbillingRole: 'owner',
\t\tstripeCustomerId: 'cus_••••••••',
\t\tplan: { name: 'Business', seats: 84, interval: 'month' }
\t},
\tpaymentMethods: [
\t\t{
\t\t\tid: 'pm_••••••••',
\t\t\tbrand: 'visa',
\t\t\tlast4: '4242',
\t\t\texpires: { month: 8, year: 2028 },
\t\t\tprimary: true
\t\t}
\t],
\tbillingProfile: {
\t\tcompanyName: 'Northstar Research Ltd',
\t\tpurchaseOrder: 'PO-2026-041',
\t\tbillingEmail: 'accounts-payable@northstar.example',
\t\taddress: {
\t\t\tline1: '41 Worship Street',
\t\t\tline2: 'Floor 6',
\t\t\tcity: 'London',
\t\t\tregion: 'Greater London',
\t\t\tpostalCode: 'EC2A 2DX',
\t\t\tcountry: 'GB'
\t\t},
\t\ttaxIds: [
\t\t\t{ id: 'txi_••••••••', type: 'gb_vat', maskedValue: 'GB ••• •••• 89', status: 'verified' }
\t\t]
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Stripe service boundaries">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provider-safe collection</h3>
						<p class="mt-2">Render Stripe Elements for the card fields or redirect to a Customer Portal session. The sample card surface marks the provider-owned boundary; replace it rather than submitting those display values.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Organization authorization</h3>
						<p class="mt-2">Resolve billing records from the authenticated organization ID, not from a customer ID supplied by the browser. Recheck owner access for every mutation.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Webhook reconciliation</h3>
						<p class="mt-2">Reconcile customer, tax ID, invoice, credit-note, and payment events into durable application state so the UI remains accurate after provider-side changes.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
