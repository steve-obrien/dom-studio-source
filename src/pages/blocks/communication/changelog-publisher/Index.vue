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
			tagline="A responsive release communication workspace for drafting updates, choosing audience and channels, previewing variants, and satisfying publish checks."
			tag="Communication UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Release communication" title="Changelog publisher workspace">
				<Example
					:source="ChangelogPublisherSrc"
					filename="ChangelogPublisher.vue"
					presentation="iframe"
					frame-src="/blocks/communication/changelog-publisher/preview/ChangelogPublisher"
					description="Copy this into SaaS admin tools, product marketing surfaces, developer portals, customer success workspaces, or internal release consoles. Replace the sample releases, channels, audience rules, and audit events with your release data."
					default-open
					:preview-lines="14"
				>
					<ChangelogPublisher />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when product and growth teams need one place to turn shipped work into customer-facing communication.
						It combines release selection, copy editing, channel targeting, preview review, safety checks, and activity history without forcing users across docs, email tools, in-app messaging, and changelog CMS screens.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>releases</code> with shipped features from your release train, issue tracker, deployment system, or changelog CMS.</li>
						<li>Persist <code>headline</code>, <code>summary</code>, selected notes, audience, channels, schedule, and approval state through a changelog draft endpoint.</li>
						<li>Render channel previews from the same structured payload you publish to your public changelog, email service, in-app feed, and customer success digest.</li>
						<li>Keep publish checks server-backed for compliance-sensitive releases, beta flags, breaking changes, customer segmentation, and translated copies.</li>
						<li>Write activity events when a draft is saved, scheduled, approved, published, rolled back, or edited after publication.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended changelog payload">
				<CodeBlock lang="js" filename="changelog-entry.js" :code="`{
\tid: 'rel_workflow_automation',
\tstatus: 'draft',
\theadline: 'Workflow automation is now generally available',
\tsummary: 'Create approval paths, escalation rules, and follow-up tasks without writing scripts.',
\treleaseDate: '2026-06-12T09:00:00Z',
\taudience: {
\t\tsegment: 'all_workspaces',
\t\tplanGate: ['Scale', 'Enterprise'],
\t\tlocales: ['en-GB', 'en-US']
\t},
\tchannels: [
\t\t{ id: 'in_app', enabled: true, owner: 'Product marketing' },
\t\t{ id: 'email', enabled: true, owner: 'Lifecycle' },
\t\t{ id: 'public_changelog', enabled: true, owner: 'Docs' }
\t],
\tnotes: [
\t\t{ id: 'builder', type: 'Feature', title: 'Visual automation builder', included: true },
\t\t{ id: 'templates', type: 'Template', title: 'Approval and handoff templates', included: true }
\t],
\tchecks: {
\t\tcopyReviewed: true,
\t\townerAssigned: true,
\t\tsupportBriefed: false,
\t\tanalyticsTagged: true
\t},
\tactivity: [
\t\t{ actor: 'Mina Cook', action: 'Updated email preview', at: '2026-06-10T14:30:00Z' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Channel rendering</h3>
						<p class="mt-2">Derive email, in-app, and public changelog previews from the same structured entry so copy changes do not drift across surfaces.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Release governance</h3>
						<p class="mt-2">Block publish actions when legal, docs, support, analytics, localization, or beta-access checks are required but incomplete.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable channel preview components, translation review, feature-to-changelog sync, announcement analytics, and rollback controls.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
