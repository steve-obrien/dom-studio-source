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
			tagline="A responsive translation review workspace with locale progress, source context, editable target strings, glossary guidance, QA checks, and publish readiness."
			tag="Content UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Localization" title="Localization review workbench">
				<Example
					:source="LocalizationReviewWorkbenchSrc"
					filename="LocalizationReviewWorkbench.vue"
					presentation="iframe"
					frame-src="/blocks/content-management/localization/localization-review-workbench/preview/LocalizationReviewWorkbench"
					description="Copy this into SaaS admin tools, CMS products, ecommerce back offices, developer portals, or internal release consoles where teams need to localize product strings before publishing."
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
						<li>Hydrate <code>segments</code> from your i18n catalog, CMS, translation memory, or localization vendor with durable keys and source-context notes.</li>
						<li>Store translations by locale and segment key. Keep approval state, QA state, reviewer, and published version separate from the raw translated string.</li>
						<li>Connect glossary and translation-memory tags to the same terminology service used by your translators, support copy, marketing site, and billing flows.</li>
						<li>Run length, placeholder, punctuation, blocked-word, tone, and glossary checks on the server when publishing; the client should preview and resolve them.</li>
						<li>Use the publish dialog as a final review gate before syncing to Lokalise, Phrase, Crowdin, Transifex, GitHub, or your own translation bundle pipeline.</li>
						<li>Keep the locale progress rail above the editor so reviewers can move between markets without losing the current segment context.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended localization segment shape">
				<CodeBlock lang="js" filename="localization-segment.js" :code="`{
\tbatchId: 'checkout-release-2026-06',
\tlocale: 'fr-FR',
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
\t\t\tqaChecks: [
\t\t\t\t{
\t\t\t\t\tid: 'accent',
\t\t\t\t\ttype: 'orthography',
\t\t\t\t\tseverity: 'high',
\t\t\t\t\tdetail: 'Verifier should include approved accent marks.',
\t\t\t\t\tresolvedAt: null
\t\t\t\t}
\t\t\t],
\t\t\tversion: 7,
\t\t\tupdatedAt: '2026-06-12T08:54:00Z'
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Review contract</h3>
						<p class="mt-2">Treat approval as a state transition with actor, timestamp, segment version, locale, and open QA count. Do not infer approval from non-empty translated text.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Vendor sync</h3>
						<p class="mt-2">Map segment keys, locale codes, glossary terms, reviewer notes, and publish status to your localization vendor so imports and exports stay reversible.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include placeholder validation, side-by-side screenshot previews, plural-form tabs, machine translation suggestions, and a reusable QA check item primitive.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
