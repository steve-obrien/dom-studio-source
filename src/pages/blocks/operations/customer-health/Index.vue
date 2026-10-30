<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CustomerHealthWorkspace from './examples/CustomerHealthWorkspace.vue';
import CustomerHealthWorkspaceSrc from './examples/CustomerHealthWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Customer Health Block"
			tagline="A complete customer recovery section with sourced health evidence, success plans, accountable tasks, CRM synchronization, and an official account timeline."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Customer success" title="Account recovery desk">
				<Example
					:source="CustomerHealthWorkspaceSrc"
					filename="CustomerHealthWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/operations/customer-health/preview/CustomerHealthWorkspace"
					description="Copy a working portfolio-to-recovery workflow into a customer success product. The repository-local API owns revisions, plan previews, task completion, timeline entries, CRM receipts, and intervention-based health recalculation."
					default-open
					:preview-lines="14"
				>
					<CustomerHealthWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Workflow" title="What is fully working">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border p-4">
						<h3 class="font-semibold text-canvas-fg">Explainable health</h3>
						<p class="mt-2">Every measure exposes its weight, score, trend, source freshness, contribution, score history, and accountable risk owner.</p>
					</div>
					<div class="rounded-lg border border-border p-4">
						<h3 class="font-semibold text-canvas-fg">Controlled recovery</h3>
						<p class="mt-2">A rich playbook and owner selection creates an immutable preview, runs server checks, and requires acknowledgement before launch.</p>
					</div>
					<div class="rounded-lg border border-border p-4">
						<h3 class="font-semibold text-canvas-fg">Provider evidence</h3>
						<p class="mt-2">Task notes, CRM synchronization, customer activity, health refreshes, revisions, and receipts survive reloads and recover from stale writes.</p>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local endpoints">
				<CodeBlock lang="text" filename="customer-health-api.txt" :code="`GET  /api/block-demos/customer-health/bootstrap
POST /api/block-demos/customer-health/reset
POST /api/block-demos/customer-health/accounts/select
POST /api/block-demos/customer-health/plans/preview
POST /api/block-demos/customer-health/plans
POST /api/block-demos/customer-health/plans/:planId/tasks/:taskId
POST /api/block-demos/customer-health/plans/:planId/sync
POST /api/block-demos/customer-health/activities
POST /api/block-demos/customer-health/health/refresh`" />
			</DocSection>

			<DocSection eyebrow="Integration" title="Production boundaries">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The demo API deliberately keeps deterministic in-memory state so the entire journey is reproducible. A production implementation should keep the UI contract while replacing the following boundaries.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Persist accounts, health checkpoints, risks, success plans, tasks, activities, and receipts in durable storage with tenant isolation.</li>
						<li>Resolve the current operator, account ownership, plan permissions, and field-level access from server-owned identity and policy services.</li>
						<li>Connect CRM, billing, support, and product-analytics providers through queued, retryable connector jobs instead of deterministic demo receipts.</li>
						<li>Run score calculation and playbook automation in an auditable health engine with source timestamps, model versions, and historical checkpoints.</li>
						<li>Retain optimistic revisions, immutable previews, acknowledgements, conflict responses, and append-only activity evidence at the API boundary.</li>
					</ul>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
