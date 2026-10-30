<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import PlanEntitlementMatrix from './examples/PlanEntitlementMatrix.vue';
import PlanEntitlementMatrixSrc from './examples/PlanEntitlementMatrix.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Plan Entitlement Matrix Block"
			tagline="A working packaging control plane for editing plans and entitlements, proving checkout mappings, and publishing one versioned contract to billing and runtime enforcement."
			tag="API-backed packaging"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Packaging" title="Plan entitlement matrix">
				<Example
					:source="PlanEntitlementMatrixSrc"
					filename="PlanEntitlementMatrix.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/packaging/entitlement-matrix/preview/PlanEntitlementMatrix"
					description="Use this Stripe- and LaunchDarkly-inspired control plane in pricing operations, billing administration, and entitlement-management tools that need an auditable path from package edit to runtime rollout."
					default-open
					:preview-lines="18"
				>
					<PlanEntitlementMatrix />
				</Example>
			</DocSection>

			<DocSection eyebrow="Working journey" title="What this example proves">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The example is a complete repository-local application section, not a client-only pricing mock. It loads one server-owned package workspace and preserves the exact package revision through editing, impact analysis, release checks, provider checkout proof, publication, and rollout.
					</p>
					<ol class="list-decimal space-y-2 pl-5">
						<li>Edit commercial plan fields or one stable entitlement across every plan and save with optimistic revision protection.</li>
						<li>Compare the saved draft with live version 3 to calculate changed cells, affected customers, breaking changes, and migration jobs.</li>
						<li>Run server-owned checks for billing price IDs, unique runtime keys, usage-meter coverage, and current impact evidence.</li>
						<li>Create a provider-style checkout receipt that binds cadence, seats, add-ons, price ID, and invoice totals to the current revision.</li>
						<li>Acknowledge the customer impact, publish an immutable release receipt, and advance billing, runtime gates, and usage enforcement to version 4.</li>
					</ol>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local contract">
				<CodeBlock lang="txt" filename="entitlement-matrix-endpoints.txt" :code="`GET   /api/block-demos/entitlement-matrix/bootstrap
PATCH /api/block-demos/entitlement-matrix/settings
PATCH /api/block-demos/entitlement-matrix/plans/:planId
PATCH /api/block-demos/entitlement-matrix/entitlements/:entitlementKey
POST  /api/block-demos/entitlement-matrix/impact
POST  /api/block-demos/entitlement-matrix/validate
POST  /api/block-demos/entitlement-matrix/checkout
POST  /api/block-demos/entitlement-matrix/publish
POST  /api/block-demos/entitlement-matrix/advance
POST  /api/block-demos/entitlement-matrix/reset`" />
			</DocSection>

			<DocSection eyebrow="Production boundary" title="What to replace in a real application">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable storage</h3>
						<p class="mt-2">The demo store is process-local and deterministic. Replace it with transactional package versions, audit events, authorization, and persisted optimistic revisions.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provider authority</h3>
						<p class="mt-2">Replace the deterministic checkout receipt with your billing provider's product, price, tax, discount, and session APIs. Keep provider IDs server-owned.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Runtime rollout</h3>
						<p class="mt-2">Replace the deterministic worker steps with queued propagation and reconciliation across billing, feature gates, API authorization, usage meters, and rollback tooling.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
