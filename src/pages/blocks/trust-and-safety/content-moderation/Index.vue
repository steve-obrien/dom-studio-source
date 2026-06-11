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
			tagline="A copyable trust and safety workspace for reviewing reported posts, comparing policy signals, making decisions, and preserving an audit trail."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Trust and safety" title="Moderation review queue">
				<Example
					:source="ModerationReviewQueueSrc"
					filename="ModerationReviewQueue.vue"
					presentation="iframe"
					frame-src="/blocks/trust-and-safety/content-moderation/preview/ModerationReviewQueue"
					description="Copy this into marketplaces, communities, education products, AI apps, creator tools, or internal operations consoles where reported content needs structured review."
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
						The surface keeps queue priority, content evidence, reporter context, policy checks, decision controls, and activity history visible without forcing moderators through separate screens.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load queue items from your moderation API with status, severity, report count, content preview, author history, policy signals, and evidence attachments.</li>
						<li>Persist every decision with the moderator id, policy reason, action, note, timestamp, and previous state so appeals and audits have complete context.</li>
						<li>Keep high-risk policy rules server-owned. Let the UI show matched policies and decision options, then validate actions against your backend before applying them.</li>
						<li>Connect the activity timeline to reports, automated classifiers, moderator decisions, author appeals, and customer support escalations.</li>
						<li>Use role-based permissions for destructive actions such as account suspension, content removal, or sensitive evidence access.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended moderation payload">
				<CodeBlock lang="js" filename="moderation-case.js" :code="`{
\tcase: {
\t\tid: 'mod_1048',
\t\tstatus: 'Needs review',
\t\tseverity: 'High',
\t\tqueue: 'Community reports',
\t\treportCount: 12,
\t\tcreatedAt: '2026-06-10T09:40:00Z'
\t},
\tcontent: {
\t\ttype: 'Post',
\t\ttext: 'Sample reported content preview',
\t\tauthorId: 'usr_291',
\t\tworkspaceId: 'wrk_88',
\t\turl: '/posts/checkout-rollout'
\t},
\tpolicySignals: [
\t\t{ key: 'harassment', label: 'Harassment', confidence: 0.86, matched: true },
\t\t{ key: 'spam', label: 'Spam pattern', confidence: 0.24, matched: false }
\t],
\tdecision: {
\t\taction: 'remove_content',
\t\treason: 'Harassment policy',
\t\tnote: 'Repeated targeted language toward another member.'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Decision safety</h3>
						<p class="mt-2">Require a reason and note for removals, suspensions, and escalations. Store immutable audit events rather than overwriting the original case state.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Policy modeling</h3>
						<p class="mt-2">Normalize policy signals from reports, classifiers, and manual flags so moderators can compare confidence, severity, and evidence in one place.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Reusable evidence viewers, appeal review panels, macro replies, duplicate report grouping, and reviewer workload metrics would make this block stronger.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
