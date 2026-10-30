<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import FeatureFlagConsole from './examples/FeatureFlagConsole.vue';
import FeatureFlagConsoleSrc from './examples/FeatureFlagConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Feature Flags Block"
			tagline="A complete release-control section with exact configuration previews, independent approval, deterministic evaluation, guarded publication, and rollback evidence."
			tag="Application section"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Release operations" title="Feature release control room">
				<Example
					:source="FeatureFlagConsoleSrc"
					filename="FeatureFlagConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/feature-flags/preview/FeatureFlagConsole"
					description="Use this as a complete feature-release section: choose a flag and environment, edit targeting, evaluate a customer context, request an independent approval, publish an immutable configuration, monitor its guardrails, and roll back to a known restore point."
					default-open
					:preview-lines="18"
				>
					<FeatureFlagConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Working journey" title="What this section proves">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block is an API-backed app section, not a generated screenshot. It composes flag discovery, environment configuration, targeting, deterministic evaluation, approvals, release checks, guardrail monitoring, and rollback into one responsive workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Select flags and environments with rich <code>DomSelect</code> controls, or use the dense desktop rail and focused mobile Flags view.</li>
						<li>Edit the rollout, segment, normalized targeting rule, and release reason with DOM Studio inputs, then preview the exact immutable configuration version.</li>
						<li>Evaluate a realistic workspace context against live or preview state and retain its stable bucket, targeting explanation, and receipt.</li>
						<li>Request an independent reviewer, record a structured decision, acknowledge the release checks, and publish the approved checksum.</li>
						<li>Advance deterministic monitoring, inspect guardrails and provider-style stream evidence, then preview and execute a restore-point rollback.</li>
						<li>Reload to prove process persistence, or reset the deterministic demo for another complete journey.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API contract" title="Repository-local routes">
				<CodeBlock lang="txt" filename="feature-release-api.txt" :code="`GET  /api/block-demos/feature-flags/bootstrap
POST /api/block-demos/feature-flags/select
POST /api/block-demos/feature-flags/flags
POST /api/block-demos/feature-flags/changes/preview
POST /api/block-demos/feature-flags/approvals
POST /api/block-demos/feature-flags/approvals/:approvalId/decision
POST /api/block-demos/feature-flags/publish
POST /api/block-demos/feature-flags/monitoring/advance
POST /api/block-demos/feature-flags/evaluations
POST /api/block-demos/feature-flags/rollbacks/preview
POST /api/block-demos/feature-flags/rollbacks
POST /api/block-demos/feature-flags/reset`" />
			</DocSection>

			<DocSection eyebrow="Design references" title="Why this composition is different">
				<div class="grid gap-px overflow-hidden border border-border bg-border text-sm leading-6 md:grid-cols-3">
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">LaunchDarkly-style targeting</h3>
						<p class="mt-2">Environment state, ordered targeting, percentage rollout, restore points, approvals, and monitoring read as one versioned release instead of unrelated dashboard cards.</p>
					</div>
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">PostHog-style evaluation</h3>
						<p class="mt-2">Operators can test a concrete context against a preview and see the stable rollout bucket and server-owned reason before customer traffic changes.</p>
					</div>
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Focused responsive app</h3>
						<p class="mt-2">The embedded viewer uses a dense control room, while narrow windows switch to explicit Flags, Targeting, and Release destinations without shrinking a desktop screenshot.</p>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Production boundary" title="Adopt the contract, replace the demo storage">
				<p class="text-sm leading-7 text-muted-fg">
					The demo API intentionally uses deterministic process memory. A production integration should add tenant-scoped persistence, identity and permission enforcement, transactional revision checks, idempotent publication, a real evaluation SDK, queued event delivery, observability ingestion, retention policy, and operational telemetry while preserving the preview, approval, receipt, monitoring, and restore-point contracts shown here.
				</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
