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
\tgoal: 'activation',
\taccentColor: '#2563eb',
\taudience: {
\t\tsegments: ['trial-admins', 'no-connected-source'],
\t\tholdoutPercent: 8,
\t\tsuppressionRules: ['recently-dismissed-tour', 'converted-workspace']
\t},
\tschedule: {
\t\tlaunchDate: '2026-06-19',
\t\ttimezone: 'Europe/London'
\t},
\tsteps: [
\t\t{
\t\t\tid: 'step_connect_source',
\t\t\ttitle: 'Connect your source data',
\t\t\tbody: 'Start with the source your team already trusts.',
\t\t\tcta: 'Connect source',
\t\t\ttargetSelector: '[data-tour="connect-data"]',
\t\t\ttargetLabel: 'Connect data tile',
\t\t\tplacement: 'start-top',
\t\t\ttrigger: 'onboarding-home-loaded',
\t\t\tstatus: 'Ready'
\t\t}
\t],
\tchecks: [
\t\t{ id: 'selector-health', status: 'passed', detail: 'All targets exist in production routes.' },
\t\t{ id: 'audience-policy', status: 'warning', detail: 'Holdout is below recommended 10%.' }
\t]
}`;
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Product Tour Builder Block"
			tagline="A responsive product-tour authoring workspace with a live app canvas, target autocomplete, tooltip placement controls, audience rules, launch scheduling, and publish checks."
			tag="Activation UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Conversion / Product Tours" title="Product tour builder">
				<Example
					:source="ProductTourBuilderSrc"
					filename="ProductTourBuilder.vue"
					presentation="iframe"
					frame-src="/blocks/conversion/product-tours/product-tour-builder/preview/ProductTourBuilder"
					description="Copy this into onboarding tools, SaaS admin products, customer education surfaces, feature adoption platforms, or internal growth consoles where teams need to build in-app tours before release."
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
						<li>Hydrate <code>steps</code> from a tour draft endpoint with durable target selectors, placement tokens, copy, CTA labels, and status.</li>
						<li>Back <code>DomAutocomplete</code> with searchable product surfaces, route names, data attributes, or analytics events so builders choose valid targets.</li>
						<li>Store placement as the same token used by your popover or tour runtime. This block uses <code>DomPositionInput</code> so authors can tune collision-friendly positions visually.</li>
						<li>Keep audience rules, holdouts, suppression, and eligibility on the server. The client should preview reach and explain blockers, not become the source of truth.</li>
						<li>Publish tour drafts through a job with preview, scheduled, live, paused, archived, and rollback states so product teams can audit releases.</li>
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
						<p class="mt-2">Generate autocomplete options from route metadata, instrumented data attributes, or a crawler that verifies selectors against deploy previews.</p>
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
