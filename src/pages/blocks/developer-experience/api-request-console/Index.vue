<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ApiRequestConsole from './examples/ApiRequestConsole.vue';
import ApiRequestConsoleSrc from './examples/ApiRequestConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="API Request Console Block"
			tagline="A working, server-proxied API console for composing safe calls, managing revisioned templates, and inspecting immutable request evidence."
			tag="Developer UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / API Tools" title="API request console">
				<Example
					:source="ApiRequestConsoleSrc"
					filename="ApiRequestConsole.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/api-request-console/preview/ApiRequestConsole"
					description="A Postman- and Insomnia-inspired application section with responsive library, request, response, and environment views backed by repository-local API routes."
					default-open
					:preview-lines="18"
				>
					<ApiRequestConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						This is a functioning repository demo rather than a timer-driven screenshot. The browser edits request drafts,
						while server routes own environment variables, credential injection, endpoint allowlisting, scope checks,
						production confirmation, template revisions, and immutable run evidence.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Send a registered request and inspect its response body, headers, rate-limit evidence, and proxy timeline.</li>
						<li>Exercise 401, 403, 404, and timeout responses by changing authorization, scopes, paths, or timeout budgets.</li>
						<li>Create reusable team or private templates and update them with optimistic revision protection.</li>
						<li>Replay an immutable history entry without exposing the original credential.</li>
						<li>Switch to production and confirm a write explicitly before the server accepts it.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="api-request-console.routes" :code="`GET   /api/block-demos/api-request-console/bootstrap
GET   /api/block-demos/api-request-console/templates/:templateId
POST  /api/block-demos/api-request-console/templates
PATCH /api/block-demos/api-request-console/templates/:templateId
POST  /api/block-demos/api-request-console/runs
GET   /api/block-demos/api-request-console/runs/:runId
POST  /api/block-demos/api-request-console/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4">
						<h3 class="font-semibold text-canvas-fg">Security boundary</h3>
						<p class="mt-2">The browser never receives the credential. The server injects authorization, redacts matching headers, and records safe request evidence.</p>
					</div>
					<div class="border-y border-border py-4">
						<h3 class="font-semibold text-canvas-fg">Demo persistence</h3>
						<p class="mt-2">The included store is process-local so the example works without setup. Replace it with workspace-scoped storage while preserving the route contract.</p>
					</div>
					<div class="border-y border-border py-4">
						<h3 class="font-semibold text-canvas-fg">Production connection</h3>
						<p class="mt-2">Replace the deterministic endpoint catalog with an allowlisted upstream client, then derive endpoints and scopes from OpenAPI or your command registry.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
