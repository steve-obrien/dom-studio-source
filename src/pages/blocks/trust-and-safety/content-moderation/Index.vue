<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ModerationReviewQueue from './examples/ModerationReviewQueue.vue';
import ModerationReviewQueueSrc from './examples/ModerationReviewQueue.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Content Moderation Block"
			tagline="An API-backed trust and safety review desk for claimed cases, contextual evidence, exact policy decisions, appeals, author delivery, and immutable audit receipts."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Trust and safety" title="Moderation review queue">
				<Example
					:source="ModerationReviewQueueSrc"
					filename="ModerationReviewQueue.vue"
					presentation="iframe"
					frame-src="/blocks/trust-and-safety/content-moderation/preview/ModerationReviewQueue"
					description="Copy this into marketplaces, communities, creator products, or internal safety consoles where reports need accountable ownership, reversible review, and auditable enforcement."
					default-open
					:preview-lines="20"
				>
					<ModerationReviewQueue />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product needs a clear review workflow for user-generated content, abuse reports, AI outputs, marketplace listings, or account safety events.
						The surface keeps queue priority, conversation context, reporter evidence, machine signals, exact decision effects, appeals, and activity history visible without shrinking a desktop dashboard into the iframe.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load compact queue summaries first, then fetch full content, context, reporter evidence, author history, and classifier signals from the lazy case endpoint.</li>
						<li>Claim work against exact workspace and case revisions so parallel reviewers receive a recoverable conflict instead of silently overwriting one another.</li>
						<li>Create an immutable preview before enforcement. The server validates action and policy compatibility, risk gates, rationale quality, author notification, and thread effects.</li>
						<li>Commit only the exact preview checksum after acknowledgement, then retain the decision, audit, and notification receipts with the case timeline.</li>
						<li>Review appeals as a second decision that preserves the original enforcement record while recording uphold, restore, or modified outcomes.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended moderation payload">
				<CodeBlock lang="js" filename="moderation-case.js" :code="`{
\tworkspace: { revision: 22, reviewerId: 'reviewer-ella' },
\tcase: {
\t\tid: 'case-harassment-1048',
\t\tversion: 8,
\t\tstatus: 'decided',
\t\tseverity: 'high',
\t\tassignment: { reviewerId: 'reviewer-ella' }
\t},
\tdecisionPreview: {
\t\tchecksum: 'sha256:demo-9e08ccd4',
\t\taction: 'remove_content',
\t\tpolicyId: 'harassment',
\t\teffects: ['Remove content', 'Preserve appeal evidence', 'Notify author']
\t},
\treceipt: {
\t\tdecisionId: 'decision-6106',
\t\tauditReceipt: 'audit:mod-6107',
\t\tdeliveryReceipt: 'notify:author-6108'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Decision safety</h3>
						<p class="mt-2">Require a policy, rationale, exact preview, and explicit acknowledgement for material enforcement. Preserve original decisions when an appeal creates a second review.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Policy modeling</h3>
						<p class="mt-2">Normalize reports and classifier signals as evidence, while keeping policy thresholds and action compatibility authoritative on the server.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Responsive composition</h3>
						<p class="mt-2">Desktop uses a dense queue, case, and decision desk. Embedded and mobile widths expose those same destinations through <code>DomAppBottomNav</code> instead of compressing all three columns.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
