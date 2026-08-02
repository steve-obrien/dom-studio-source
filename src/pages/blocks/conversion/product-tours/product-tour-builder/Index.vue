<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import ProductTourBuilder from './examples/ProductTourBuilder.vue';
import ProductTourBuilderSrc from './examples/ProductTourBuilder.vue?raw';

const productTourDraftCode = `{
\tid: 'tour_activation_v4',
\tname: 'Trial activation tour',
\tstatus: 'draft',
\trevision: 28,
\tgoal: 'activation',
\taudience: {
\t\tsegment: 'trial_admins',
\t\tbehavior: 'no_connected_source',
\t\tholdoutPercent: 10
\t},
\tschedule: {
\t\tlaunchDate: '2026-08-06',
\t\ttimezone: 'Europe/London'
\t},
\tsteps: [
\t\t{
\t\t\tid: 'step-connect',
\t\t\ttitle: 'Connect source data',
\t\t\tbody: 'Point teams to the source that unlocks dashboards and automations.',
\t\t\tcta: 'Connect source',
\t\t\ttargetId: 'connect-data',
\t\t\ttargetSelector: '[data-tour="connect-data"]',
\t\t\tplacement: 'start',
\t\t\tstatus: 'review_required'
\t\t}
\t],
\tlastValidation: null,
\trelease: null
}`;
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Product Tour Builder Block"
			tagline="An API-backed product-tour studio with a live app canvas, registered targets, responsive authoring modes, optimistic revisions, preview sessions, launch checks, and signed publication receipts."
			tag="Activation UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Conversion / Product Tours" title="Product tour builder">
				<Example
					:source="ProductTourBuilderSrc"
					filename="ProductTourBuilder.vue"
					presentation="iframe"
					frame-src="/blocks/conversion/product-tours/product-tour-builder/preview/ProductTourBuilder"
					description="An Appcues- and Pendo-inspired authoring section that pairs a real interactive product canvas with revisioned drafts, DOM Studio controls, server validation, preview proof, and a complete scheduling workflow."
					default-open
					:preview-lines="18"
				>
					<ProductTourBuilder />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product team needs to author onboarding moments inside the app context, not in a disconnected form.
						The pattern keeps step sequence, live target preview, tooltip placement, audience targeting, schedule, and launch checks visible without falling into a dense admin console.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Hydrate <code>steps</code> from the bootstrap API, then send every mutation with the current revision so stale browser tabs receive a recoverable conflict.</li>
						<li>Back rich searchable <code>DomSelect</code> options with product surfaces, route names, data attributes, and device support so builders choose registered targets.</li>
						<li>Store placement as the same token used by your popover or tour runtime. This block uses <code>DomPositionInput</code> so authors can tune collision-friendly positions visually.</li>
						<li>Keep audience rules, reach, holdouts, selector health, and schedule validation on the server. The client explains blockers without becoming the source of truth.</li>
						<li>Create short-lived preview sessions and require passing validation for the exact revision before publication. The returned receipt provides immutable release proof.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended product tour shape">
				<CodeBlock lang="js" filename="product-tour-draft.js" :code="productTourDraftCode" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Target registry</h3>
						<p class="mt-2">Generate rich select options from route metadata, instrumented data attributes, or a crawler that verifies selectors against deploy previews.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Runtime contract</h3>
						<p class="mt-2">Use the same placement, trigger, audience, and dismiss-state model in the builder and in-app tour runtime so previews do not drift from production behavior.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include selector health scanning, localized step variants, branching tours, analytics goal mapping, reusable tour tooltip previews, and screenshot-backed QA.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
