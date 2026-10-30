<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import FeedbackBoardWorkspace from './examples/FeedbackBoardWorkspace.vue';
import FeedbackBoardWorkspaceSrc from './examples/FeedbackBoardWorkspace.vue?raw';

const endpoints = [
	['GET', '/bootstrap', 'Read ideas, customer evidence, decisions, catalogs, activity, and board summary.'],
	['POST', '/insights', 'Validate and capture feedback against an idea or create a new idea.'],
	['PATCH', '/ideas/:id', 'Persist compatible internal and public status, priority, owner, and rationale at exact revisions.'],
	['POST', '/ideas/:id/responses', 'Retain an internal note or publish a customer response with delivery evidence.'],
	['POST', '/ideas/:id/merge-preview', 'Lock both records and calculate the exact duplicate merge impact.'],
	['POST', '/ideas/:id/merge', 'Commit an acknowledged merge or return a stale-preview conflict.'],
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Feedback Board Block"
			tagline="A complete product-feedback section with customer evidence, product decisions, public responses, duplicate merging, and an optimistic API contract."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Product management" title="Feedback operations workspace">
				<Example
					:source="FeedbackBoardWorkspaceSrc"
					filename="FeedbackBoardWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/product-management/feedback-board/preview/FeedbackBoardWorkspace"
					description="This is a working app section rather than a simulated screenshot: capture a customer insight, update a product decision, notify contacts, merge a duplicate, reload the page, and exercise exact-revision conflicts through the repository-local API."
					default-open
					:preview-lines="14"
				>
					<FeedbackBoardWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Review" title="What changed in this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The earlier example was a wide three-column dashboard made from static arrays. It became a long stacked page in a narrow iframe, used native selects, and presented buttons that did not perform real work.
						The reviewed version is a viewport-owned feedback section inspired by the dense evidence workflow in Linear Customer Requests and the public/internal feedback loop in Canny.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>DomAppShell</code>, content-owned scrolling, and focused mobile destinations make the section fit the expanded viewer, embedded iframe, and phone viewport.</li>
						<li><code>DomSelect</code> replaces native dropdowns and exposes rich option descriptions for status, priority, owner, source, visibility, and merge selection.</li>
						<li>Customer quotes remain the primary evidence; customer count, important signals, and unique-account revenue support the decision without replacing it.</li>
						<li>Internal workflow and public status are separate fields with server-owned compatibility rules.</li>
						<li>Capture, decision, response, notification, merge preview, merge commit, reload, reset, validation, and conflict states all use real HTTP endpoints.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Working feedback lifecycle">
				<div class="overflow-hidden border border-border text-sm">
					<div class="grid grid-cols-[7rem_minmax(0,1fr)] gap-px bg-border sm:grid-cols-[7rem_15rem_minmax(0,1fr)]">
						<div class="bg-secondary p-3 font-semibold">Method</div>
						<div class="hidden bg-secondary p-3 font-semibold sm:block">Endpoint</div>
						<div class="bg-secondary p-3 font-semibold">Responsibility</div>
						<template v-for="endpoint in endpoints" :key="endpoint[1]">
							<div class="bg-canvas p-3 font-mono text-xs">{{ endpoint[0] }}</div>
							<div class="hidden bg-canvas p-3 font-mono text-xs sm:block">{{ endpoint[1] }}</div>
							<div class="bg-canvas p-3 leading-6 text-muted-fg">{{ endpoint[2] }}</div>
						</template>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-px overflow-hidden border border-border bg-border text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Demand quality</h3>
						<p class="mt-2">Retain the raw quote, source, contact, tier, importance, and account value. Derived totals should never erase the customer’s actual problem.</p>
					</div>
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Roadmap hygiene</h3>
						<p class="mt-2">Treat status changes as versioned decisions with an owner, rationale, compatible public state, and an immutable receipt.</p>
					</div>
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Production adapter</h3>
						<p class="mt-2">The demo keeps process-local state. Replace the server module with database models, authenticated actors, CRM sync, background delivery, and your issue tracker adapter.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
