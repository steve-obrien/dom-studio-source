<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import LocalizationReviewWorkbench from './examples/LocalizationReviewWorkbench.vue';
import LocalizationReviewWorkbenchSrc from './examples/LocalizationReviewWorkbench.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Localization Review Workbench Block"
			tagline="A Lokalise- and Phrase-inspired translation workbench with API-backed releases, focused string review, server-owned QA, glossary handoff, and receipt-backed locale publishing."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Localization" title="Localization review workbench">
				<Example
					:source="LocalizationReviewWorkbenchSrc"
					filename="LocalizationReviewWorkbench.vue"
					presentation="iframe"
					frame-src="/blocks/content-management/localization/localization-review-workbench/preview/LocalizationReviewWorkbench"
					description="Copy this complete app section into SaaS admin tools, CMS products, ecommerce back offices, developer portals, or release consoles where teams need to review and publish localized product strings."
					default-open
					:preview-lines="18"
				>
					<LocalizationReviewWorkbench />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when translated app strings need review, not just storage.
						The pattern pairs source copy with editable target copy, glossary context, locale progress, issue resolution, and a release payload that can sync to your translation-management service.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load release, locale, progress, translation, context, and activity state through <code>/api/block-demos/localization-review</code>.</li>
						<li>Save each string with an optimistic release revision, then rerun length, placeholder, and orthography checks on the server.</li>
						<li>Use translation-memory suggestions as drafts: reviewers explicitly apply, save, and approve them instead of silently replacing copy.</li>
						<li>Keep applied glossary terms and locale-level reviewer notes in a separate handoff mutation.</li>
						<li>Publish only after every server-owned gate passes and return an immutable bundle identifier, file list, timestamp, and SHA-256 checksum.</li>
						<li>The demo API is intentionally process-local. Production integrations should add authentication, authorization, durable storage, provider webhooks, and immutable audit events.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended localization release shape">
				<CodeBlock lang="js" filename="localization-release.js" :code="`{
\tbatchId: 'checkout-release-2026-06',
\tlocale: 'fr-FR',
\trevision: 8,
\tsegments: [
\t\t{
\t\t\tid: 'seg-002',
\t\t\tkey: 'checkout.retry.body',
\t\t\tarea: 'Checkout',
\t\t\tsource: 'We could not process this payment. Check the card details or try another method.',
\t\t\ttarget: 'Nous ne pouvons pas traiter ce paiement. Verifiez la carte ou essayez un autre moyen.',
\t\t\tcontext: 'Displayed after a failed authorization when the customer can recover.',
\t\t\tmaxLength: 112,
\t\t\tstatus: 'needs-review',
\t\t\treviewerId: 'usr_camille',
\t\t\tglossaryTerms: ['payment-attempt', 'retry'],
\t\t\tchecks: [
\t\t\t\t{
\t\t\t\t\tid: 'accent',
\t\t\t\t\ttype: 'orthography',
\t\t\t\t\tseverity: 'high',
\t\t\t\t\tdetail: 'Verifier should include approved accent marks.',
\t\t\t\t\tresolvable: false,
\t\t\t\t\tresolvedAt: null
\t\t\t\t}
\t\t\t],
\t\t\tversion: 7,
\t\t\tupdatedAt: '2026-06-12T08:54:00Z'
\t\t}
\t],
\tpublication: {
\t\tbundle: 'checkout.2026-08.1.fr-FR',
\t\tfiles: ['fr-FR.json', 'fr-FR.po'],
\t\tchecksum: '487307dd0d3710f...'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Review contract</h3>
						<p class="mt-2">Treat approval as an API transition with actor, timestamp, segment version, locale, release revision, and open QA count. Do not infer approval from non-empty text.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Vendor sync</h3>
						<p class="mt-2">Replace the process-local service with your database and vendor adapter while preserving the demonstrated REST shapes, readiness checks, and publication receipt.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include screenshot context, plural-form tabs, comment threads, translation-memory provider adapters, and reusable QA result primitives.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
