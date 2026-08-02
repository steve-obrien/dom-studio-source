<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import StatusPageCenter from './examples/StatusPageCenter.vue';
import StatusPageCenterSrc from './examples/StatusPageCenter.vue?raw';

const endpoints = [
	['GET', '/bootstrap?region=:region', 'Read regional component health, active incidents, maintenance, history, and public catalogs.'],
	['GET', '/components/:id?region=:region', 'Load one component’s 30-day evidence and related customer events.'],
	['GET', '/feed', 'Expose incident updates as a JSON Feed-compatible public stream.'],
	['POST', '/subscription-preview', 'Validate email, region, components, and message types before sending anything.'],
	['POST', '/subscriptions', 'Commit an exact preview and retain provider delivery evidence for confirmation.'],
	['POST', '/subscriptions/:id/verify', 'Activate a pending subscription with version checks and an immutable receipt.'],
	['POST', '/reset', 'Restore the deterministic reliability demo state.'],
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Status Page Block"
			tagline="A complete public reliability section with regional health, customer-first incident updates, component evidence, planned maintenance, and verified subscriptions."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Reliability" title="Public status and subscriptions">
				<Example
					:source="StatusPageCenterSrc"
					filename="StatusPageCenter.vue"
					presentation="iframe"
					frame-src="/blocks/reliability/status-page/preview/StatusPageCenter"
					description="This is a working customer section rather than a monitoring screenshot: change region, inspect component evidence, read live incident updates, open the public JSON feed, preview a targeted subscription, deliver confirmation, verify it, reload persisted state, and exercise validation or exact-revision conflicts through HTTP endpoints."
					default-open
					:preview-lines="14"
				>
					<StatusPageCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Review" title="What changed in this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The earlier example compressed an internal three-column dashboard into a public page, placed summary counters before urgent customer impact, kept all data in local arrays, used <code>DomNativeSelect</code>, and treated subscription as an unverified toggle save.
						The reviewed version uses the impact-first communication model found in mature public status products while giving availability evidence a quieter, editorial layout.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>The overall status and latest customer update appear before internal-looking metrics, with clear affected capability and region details.</li>
						<li><code>DomSelect</code> provides descriptive region choices, while <code>DomStatusPill</code>, <code>DomAlert</code>, <code>DomDialog</code>, <code>DomCheckbox</code>, and <code>DomJsonViewer</code> carry reusable interaction and feedback contracts.</li>
						<li>Regional health is server-derived from component states, and each component opens lazy API evidence rather than relying on client-only arrays.</li>
						<li>The subscription flow validates scope, freezes an exact preview, retains delivery evidence, requires confirmation, rejects bad codes, and produces an immutable activation receipt.</li>
						<li>The page naturally reflows inside a desktop window, a narrow iframe, and a mobile viewport without turning into a scaled dashboard.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Working public reliability lifecycle">
				<div class="overflow-hidden border border-border text-sm">
					<div class="grid grid-cols-[7rem_minmax(0,1fr)] gap-px bg-border sm:grid-cols-[7rem_17rem_minmax(0,1fr)]">
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
					<div class="bg-canvas p-4"><h3 class="font-semibold text-canvas-fg">Customer language</h3><p class="mt-2">Describe visible impact, affected regions, data safety, and the next update. Keep internal service names and speculative root causes in the incident workspace.</p></div>
					<div class="bg-canvas p-4"><h3 class="font-semibold text-canvas-fg">Subscription ownership</h3><p class="mt-2">Confirmation, component preferences, unsubscribe tokens, rate limits, and delivery receipts belong on the server rather than in local UI state.</p></div>
					<div class="bg-canvas p-4"><h3 class="font-semibold text-canvas-fg">Production adapter</h3><p class="mt-2">The demo retains process-local state. Replace it with monitoring adapters, durable incident records, signed feeds, queued notifications, and database-backed subscriber preferences.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
