<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import ReferralProgram from './examples/ReferralProgram.vue';
import ReferralProgramSrc from './examples/ReferralProgram.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Referral Program Block"
			tagline="A copyable customer-facing growth loop with invite sharing, reward selection, milestone progress, pending referrals, and referral activity."
			tag="Growth UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Marketing" title="Referral program">
				<Example
					:source="ReferralProgramSrc"
					filename="ReferralProgram.vue"
					presentation="iframe"
					frame-src="/blocks/marketing/growth/referral-program/preview/ReferralProgram"
					description="Copy this into account dashboards, ecommerce loyalty pages, SaaS workspaces, creator portals, or marketplace profiles where customers invite others and track reward progress."
					default-open
					:preview-lines="16"
				>
					<ReferralProgram />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product needs a visible invite loop rather than a buried referral settings page.
						The layout makes the invite link, reward choice, milestone progress, pending friends, and next reward understandable at a glance.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>referrals</code> with records from your growth, billing, or CRM service, including invitee identity, lifecycle status, qualification rules, and reward outcome.</li>
						<li>Connect the copy and invite actions to your referral API so each share includes a signed customer code, attribution source, expiry, campaign, and fraud controls.</li>
						<li>Calculate rewards server-side after the referred account satisfies your rule, such as trial activation, first purchase, paid conversion, or retention through a billing period.</li>
						<li>Keep reward settings explicit so teams can offer account credit, free months, gift cards, marketplace balance, or product perks without changing the UI structure.</li>
						<li>Send referral events to analytics with source, channel, milestone, reward type, and qualified revenue so marketing can measure loop quality.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended referral payload">
				<CodeBlock lang="js" filename="referral-program.js" :code="`{
\tmember: {
\t\tid: 'mem_118',
\t\tname: 'Alex Morgan',
\t\treferralCode: 'ALEX-2048',
\t\tinviteUrl: 'https://app.example.com/join?ref=ALEX-2048'
\t},
\tcampaign: {
\t\tid: 'spring-growth-2026',
\t\trewardType: 'account_credit',
\t\trewardAmount: 25,
\t\tcurrency: 'GBP',
\t\tqualificationRule: 'referred_account_pays_first_invoice'
\t},
\tstats: {
\t\tqualified: 3,
\t\tpending: 2,
\t\tnextMilestone: 5,
\t\tlifetimeCredit: 75
\t},
\treferrals: [
\t\t{ id: 'ref_101', name: 'Maya Chen', email: 'maya@example.com', status: 'qualified', channel: 'Email', reward: 25 },
\t\t{ id: 'ref_102', name: 'Nora Lee', email: 'nora@example.com', status: 'pending', channel: 'Link', reward: 0 }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Reward rules</h3>
						<p class="mt-2">Keep qualification windows, duplicate-account checks, refund clawbacks, and payout timing in backend policy so customers see clear but enforceable progress.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Share tracking</h3>
						<p class="mt-2">Store channel, campaign, UTM values, referral code version, and invite source with each share so growth teams can measure what actually converts.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include fraud review states, leaderboard variants, reward payout history, multi-sided marketplace rewards, and lifecycle email previews.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
