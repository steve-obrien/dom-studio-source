<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import Example from '../../../../_layout/docs/Example.vue';
import ReferralProgram from './examples/ReferralProgram.vue';
import ReferralProgramSrc from './examples/ReferralProgram.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Referral Program Block"
			tagline="A complete referral wallet with tracked invites, lifecycle webhooks, qualification policy, milestone bonuses, and a redeemable reward ledger."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Marketing" title="Referral wallet">
				<Example
					:source="ReferralProgramSrc"
					filename="ReferralProgram.vue"
					presentation="iframe"
					frame-src="/blocks/marketing/growth/referral-program/preview/ReferralProgram"
					description="Use this Wise- and Dropbox-inspired section inside a customer account area where invite attribution, referred-account progress, policy evidence, and earned rewards need to remain understandable and actionable."
					default-open
					:preview-lines="18"
				>
					<ReferralProgram />
				</Example>
			</DocSection>

			<DocSection eyebrow="Journey" title="Working referral lifecycle">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-2 xl:grid-cols-4">
					<div class="border-t border-border pt-4"><p class="font-semibold text-canvas-fg">1. Invite or share</p><p class="mt-1">The API validates duplicate and self-referrals, accepts a channel, and returns provider and attribution receipts.</p></div>
					<div class="border-t border-border pt-4"><p class="font-semibold text-canvas-fg">2. Track progress</p><p class="mt-1">Deterministic webhook actions move the referral through opened, trial, paid invoice, account checks, and qualification.</p></div>
					<div class="border-t border-border pt-4"><p class="font-semibold text-canvas-fg">3. Credit rewards</p><p class="mt-1">The server calculates the base credit and adds milestone bonuses to a durable customer-visible ledger.</p></div>
					<div class="border-t border-border pt-4"><p class="font-semibold text-canvas-fg">4. Redeem balance</p><p class="mt-1">An acknowledgement-gated billing action applies the full balance and returns immutable redemption evidence.</p></div>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local endpoints">
				<div class="overflow-hidden border-y border-border text-sm">
					<div class="grid gap-1 border-b border-border py-3 sm:grid-cols-[14rem_minmax(0,1fr)]"><code class="font-semibold text-canvas-fg">GET /bootstrap</code><p class="text-muted-fg">Member, policy, server totals, referral funnel, ledger, activity, and current evidence.</p></div>
					<div class="grid gap-1 border-b border-border py-3 sm:grid-cols-[14rem_minmax(0,1fr)]"><code class="font-semibold text-canvas-fg">PATCH /preferences</code><p class="text-muted-fg">Exact-revision reward and reminder preferences.</p></div>
					<div class="grid gap-1 border-b border-border py-3 sm:grid-cols-[14rem_minmax(0,1fr)]"><code class="font-semibold text-canvas-fg">POST /invites</code><p class="text-muted-fg">Validated invite creation with provider and attribution receipts.</p></div>
					<div class="grid gap-1 border-b border-border py-3 sm:grid-cols-[14rem_minmax(0,1fr)]"><code class="font-semibold text-canvas-fg">POST /shares</code><p class="text-muted-fg">Signed campaign links bound to the active terms version.</p></div>
					<div class="grid gap-1 border-b border-border py-3 sm:grid-cols-[14rem_minmax(0,1fr)]"><code class="font-semibold text-canvas-fg">POST /referrals/:id/advance</code><p class="text-muted-fg">Provider lifecycle events, qualification checks, and reward posting.</p></div>
					<div class="grid gap-1 py-3 sm:grid-cols-[14rem_minmax(0,1fr)]"><code class="font-semibold text-canvas-fg">POST /rewards/redeem</code><p class="text-muted-fg">Acknowledged billing-ledger redemption with immutable evidence.</p></div>
				</div>
			</DocSection>

			<DocSection eyebrow="Production boundary" title="What the host application still owns">
				<p class="max-w-4xl text-sm leading-7 text-muted-fg">The repository-local API keeps this example deterministic and fully exercisable. A production integration should replace the in-memory state with authenticated member records, signed attribution tokens, provider webhooks, fraud and household policy, a transactional reward ledger, billing or payout execution, idempotency keys, and jurisdiction-specific terms while keeping the same UI contract.</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
