<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import ScreenAnnotationReview from './examples/ScreenAnnotationReview.vue';
import ScreenAnnotationReviewSrc from './examples/ScreenAnnotationReview.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Screen Annotation Review Block"
			tagline="A copyable collaborative review surface with spatial comment pins, thread triage, reply drafting, and resolve or reopen actions."
			tag="Collaboration UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Review" title="Screen annotation review">
				<Example
					:source="ScreenAnnotationReviewSrc"
					filename="ScreenAnnotationReview.vue"
					presentation="iframe"
					frame-src="/blocks/collaboration/review/screen-annotation-review/preview/ScreenAnnotationReview"
					description="Copy this into product QA, design review, content approval, customer implementation, internal tooling, or support escalation flows where teams need comments anchored to a visual surface."
					default-open
					:preview-lines="18"
				>
					<ScreenAnnotationReview />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when feedback needs to stay attached to the exact part of a screen, document, dashboard, creative asset, or implementation preview.
						The layout keeps the review target, annotation pins, thread context, comments, and resolution controls together without turning feedback into a detached ticket list.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>annotations</code> with records from your review API, including target id, normalized pin coordinates, status, priority, author, assignee, comments, and audit events.</li>
						<li>Persist coordinates as percentages relative to the reviewed asset so pins survive responsive resizing, zoom, and thumbnail generation.</li>
						<li>Connect resolve and reopen actions to immutable review events so product, QA, compliance, or client teams can audit who accepted each change.</li>
						<li>Use thread filters as API query params for large review spaces, then lazy-load comment bodies when a pin or thread is selected.</li>
						<li>When the reviewed asset changes version, preserve old pins against the original revision and add a migration step before copying unresolved items forward.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended annotation payload">
				<CodeBlock lang="js" filename="screen-annotation.js" :code="`{
\treviewId: 'rev_checkout_redesign',
\ttarget: {
\t\tid: 'screen_checkout_summary',
\t\ttype: 'screen',
\t\tversion: 7,
\t\twidth: 1440,
\t\theight: 960
\t},
\tannotations: [
\t\t{
\t\t\tid: 'ann_payment-copy',
\t\t\tx: 69,
\t\t\ty: 36,
\t\t\tstatus: 'open',
\t\t\tpriority: 'high',
\t\t\ttitle: 'Clarify saved-card copy',
\t\t\tauthorId: 'usr_maya',
\t\t\tassigneeId: 'usr_oscar',
\t\t\tcomments: [
\t\t\t\t{ id: 'c1', body: 'Can we make the card state clearer?', createdAt: '2026-06-11T09:42:00Z' }
\t\t\t],
\t\t\tevents: [
\t\t\t\t{ type: 'created', actorId: 'usr_maya', createdAt: '2026-06-11T09:42:00Z' }
\t\t\t]
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Coordinate model</h3>
						<p class="mt-2">Store pin coordinates against the reviewed asset bounds, not the viewport. Convert to pixels only when rendering the current preview size.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Review lifecycle</h3>
						<p class="mt-2">Treat replies, assignments, resolves, reopens, and version migrations as append-only events so feedback history remains trustworthy.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include draw-to-pin creation, screenshot upload states, zoom controls, keyboard navigation, version diffing, and exportable review summaries.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
