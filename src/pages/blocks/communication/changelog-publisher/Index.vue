<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ChangelogPublisher from './examples/ChangelogPublisher.vue';
import ChangelogPublisherSrc from './examples/ChangelogPublisher.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Changelog Publisher Block"
			tagline="A working release communication section with API-backed drafts, channel previews, publishing checks, reviewer approval, scheduling, delivery proof, and activity history."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Communication" title="Changelog publisher">
				<Example
					:source="ChangelogPublisherSrc"
					filename="ChangelogPublisher.vue"
					presentation="iframe"
					frame-src="/blocks/communication/changelog-publisher/preview/ChangelogPublisher"
					description="Copy this Linear- and GitHub-inspired release editor into a product operations, developer portal, or product marketing area. The responsive workflow uses repository-local APIs instead of prepared screenshot state."
					default-open
					:preview-lines="14"
					frame-flush-edges
				>
					<ChangelogPublisher />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product team needs to turn shipped work into a governed customer announcement.
						The focused editor keeps source copy, included release notes, targeting, channel previews, review, scheduling, and publication evidence in one responsive workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/changelog-publisher/releases</code> and <code>GET /api/block-demos/changelog-publisher/:releaseId</code> return the release train, editable draft, channel previews, readiness, reviewer state, publication proof, and activity.</li>
						<li><code>PATCH /api/block-demos/changelog-publisher/:releaseId/draft</code> validates a complete draft with optimistic revisions. Editing reviewed work resets its approval.</li>
						<li><code>POST .../request-review</code>, <code>POST .../approve</code>, and <code>POST .../publish</code> enforce the state machine instead of changing local presentation text.</li>
						<li>Breaking changes require both a public changelog channel and selected migration guidance. Stale revisions, incorrect reviewers, premature approvals, and incomplete publishing checks return actionable API errors.</li>
						<li>The demo store is process-local so saved drafts, approvals, schedules, publication proof, and activity survive reloads while the dev server is running.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended changelog payload">
				<CodeBlock lang="js" filename="changelog-entry.js" :code="`{
	id: 'workflow',
	status: 'in-review',
	revision: 14,
	headline: 'Workflow automation is now generally available',
	summary: 'Create approval paths, escalation rules, and follow-up tasks without writing scripts.',
	audience: 'scale-enterprise',
	reviewerId: 'mina',
	schedule: 'monday-1000',
	approvalRequired: true,
	channels: { in_app: true, email: true, public: true, community: false },
	notes: [
		{ id: 'builder', type: 'Feature', title: 'Visual automation builder', included: true },
		{ id: 'templates', type: 'Template', title: 'Approval and handoff templates', included: true }
	],
	checks: [
		{ key: 'copy', passed: true, detail: 'Headline and summary meet publishing guidance' },
		{ key: 'breaking', passed: true, detail: 'No breaking changes selected' }
	],
	reviewRequestedAt: 'Just now'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Channel adapters</h3>
						<p class="mt-2">The demo derives every preview from one structured entry. Production adapters should preserve that source while adding provider templates, localization, and delivery receipts.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable workflow</h3>
						<p class="mt-2">Replace the process-local store with authenticated release records, role-aware approvals, idempotent publication jobs, and an append-only audit trail.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include issue-tracker imports, translation review, provider webhooks, audience estimates, analytics attribution, retries, and rollback or correction notices.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
