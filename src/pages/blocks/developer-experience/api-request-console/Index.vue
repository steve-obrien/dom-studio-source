<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ApiRequestConsole from './examples/ApiRequestConsole.vue';
import ApiRequestConsoleSrc from './examples/ApiRequestConsole.vue?raw';
import RequestTimelineItemSrc from './components/RequestTimelineItem.vue?raw';
import ResponseStatSrc from './components/ResponseStat.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="API Request Console Block"
			tagline="A copyable developer console for composing API calls, switching environments, validating JSON payloads, inspecting response diagnostics, and saving reusable request templates."
			tag="Developer UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / API Tools" title="API request console">
				<Example
					:source="ApiRequestConsoleSrc"
					filename="ApiRequestConsole.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/api-request-console/preview/ApiRequestConsole"
					description="Copy this into developer dashboards, admin command centers, integration setup flows, internal tools, or customer-facing API explorers that need a runnable request surface."
					default-open
					:preview-lines="18"
				>
					<ApiRequestConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Local components" title="Copy the response helpers">
				<div class="grid gap-4 lg:grid-cols-2">
					<CodeBlock lang="vue" filename="components/ResponseStat.vue" :code="ResponseStatSrc" />
					<CodeBlock lang="vue" filename="components/RequestTimelineItem.vue" :code="RequestTimelineItemSrc" />
				</div>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when builders need an embedded API playground, webhook tester, customer-support command runner,
						or internal platform console. The pattern keeps request setup, auth context, payload editing, send feedback,
						response metrics, and reusable templates in one copyable workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the sample environment, endpoint, scope, and timeline arrays with workspace-scoped API metadata from your backend.</li>
						<li>Send requests through a server-owned proxy so credentials, audit logging, rate limits, and allowlisted hosts stay protected.</li>
						<li>Validate JSON request bodies before dispatch and return structured field errors when the server rejects a payload.</li>
						<li>Persist saved templates with method, path, environment, scopes, headers, body, timeout, owner, and visibility.</li>
						<li>Store every run as an immutable attempt record so support, security, and developer-success teams can inspect what happened.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended request template shape">
				<CodeBlock lang="js" filename="api-request-template.js" :code="`{
\tid: 'reqtpl_create_invoice',
\tworkspaceId: 'wrk_platform_2048',
\tname: 'Create draft invoice',
\tvisibility: 'team',
\tmethod: 'POST',
\tenvironmentId: 'env_stage',
\tpath: '/v1/invoices',
\ttimeoutMs: 4500,
\tscopes: ['billing:write', 'customers:read'],
\theaders: [
\t\t{ name: 'Idempotency-Key', value: 'invoice-{{customer.id}}-{{date}}', secret: false },
\t\t{ name: 'Authorization', value: 'Bearer {{api_key}}', secret: true }
\t],
\tbody: {
\t\tcustomerId: 'cus_1842',
\t\tcollectionMethod: 'send_invoice',
\t\tlineItems: [{ priceId: 'price_growth', quantity: 3 }]
\t},
\tlastRun: {
\t\tstatus: 201,
\t\tlatencyMs: 286,
\t\trequestId: 'req_9H2kL6',
\t\tranAt: '2026-06-12T10:44:00Z'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Security boundary</h3>
						<p class="mt-2">Never run customer-entered requests directly from the browser with privileged credentials. Proxy and audit calls on your server, then redact secrets before returning logs.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Schema ownership</h3>
						<p class="mt-2">Drive available endpoints, required scopes, headers, examples, and validation messages from your API schema or command catalog.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include OpenAPI import, curl export, request diffing, signed replay links, secret variable pickers, and promotion of response metrics into a shared block component.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
