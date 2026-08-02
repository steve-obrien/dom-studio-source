<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CampaignComposer from './examples/CampaignComposer.vue';
import CampaignComposerSrc from './examples/CampaignComposer.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Campaign Operations Block"
			tagline="A Customer.io- and HubSpot-inspired campaign section with versioned drafts, server-calculated audiences, launch checks, test delivery, scheduling, provider progress, and post-send results."
			tag="API-backed"
			eyebrow="Blocks / Marketing"
		>
			<DocSection eyebrow="Working section" title="Campaign operations workspace">
				<Example
					:source="CampaignComposerSrc"
					filename="CampaignComposer.vue"
					presentation="iframe"
					frame-src="/blocks/marketing/campaign-composer/preview/CampaignComposer"
					description="Open a draft, edit content, choose a rich DOM Studio audience, save with optimistic revision control, send a test, run server-owned checks, schedule delivery, advance the worker, and inspect results. The same section reflows into focused mobile tabs inside its iframe."
					default-open
					:preview-lines="22"
				>
					<CampaignComposer />
				</Example>
			</DocSection>

			<DocSection eyebrow="Complete journey" title="What the example actually does">
				<div class="grid gap-px overflow-hidden rounded-lg border border-border bg-border text-sm leading-6 md:grid-cols-3">
					<div class="bg-canvas p-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">1 · Compose</p>
						<h3 class="mt-2 font-semibold text-canvas-fg">Revisioned campaign draft</h3>
						<p class="mt-2 text-muted-fg">Message, verified sender, audience, exclusions, channels, schedule, and holdout are validated and persisted through the repository-local API.</p>
					</div>
					<div class="bg-canvas p-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">2 · Prove</p>
						<h3 class="mt-2 font-semibold text-canvas-fg">Server-owned launch evidence</h3>
						<p class="mt-2 text-muted-fg">Audience math, consent, sender, content, and delivery-window checks are bound to the exact saved revision. Tests return provider-style receipts.</p>
					</div>
					<div class="bg-canvas p-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">3 · Deliver</p>
						<h3 class="mt-2 font-semibold text-canvas-fg">Traceable provider lifecycle</h3>
						<p class="mt-2 text-muted-fg">Acknowledged launches create immutable receipts, per-channel dispatches move through delivery states, and completed campaigns expose useful results.</p>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local endpoints">
				<CodeBlock lang="text" filename="campaign-composer-api.txt" :code="`GET   /api/block-demos/campaign-composer/campaigns
GET   /api/block-demos/campaign-composer/:campaignId
PATCH /api/block-demos/campaign-composer/:campaignId/draft
POST  /api/block-demos/campaign-composer/:campaignId/test
POST  /api/block-demos/campaign-composer/:campaignId/validate
POST  /api/block-demos/campaign-composer/:campaignId/launch
POST  /api/block-demos/campaign-composer/:campaignId/advance
POST  /api/block-demos/campaign-composer/:campaignId/reset`" />
			</DocSection>

			<DocSection eyebrow="Integration boundary" title="Moving this section into production">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The example is deliberately process-local and deterministic, so its complete journey works without credentials or customer data. A production implementation should preserve the UI contract while replacing the store with authenticated, organization-scoped persistence and real messaging infrastructure.
					</p>
					<ul class="grid gap-3 md:grid-cols-2">
						<li class="border-l-2 border-primary pl-4"><strong class="text-canvas-fg">Audience service:</strong> evaluate membership, consent, suppression, frequency caps, and holdout from a durable snapshot taken at launch.</li>
						<li class="border-l-2 border-primary pl-4"><strong class="text-canvas-fg">Delivery provider:</strong> render localized content, sign webhook callbacks, retry transient failures, and retain per-recipient evidence under an appropriate policy.</li>
						<li class="border-l-2 border-primary pl-4"><strong class="text-canvas-fg">Authorization:</strong> enforce workspace roles, verified sending domains, approval gates, and separate test-recipient permissions on the server.</li>
						<li class="border-l-2 border-primary pl-4"><strong class="text-canvas-fg">Observability:</strong> make idempotency keys, provider request IDs, worker attempts, immutable launch payloads, and attribution windows queryable.</li>
					</ul>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
