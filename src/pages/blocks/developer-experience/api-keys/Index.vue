<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ApiKeyManagementConsole from './examples/ApiKeyManagementConsole.vue';
import ApiKeyManagementConsoleSrc from './examples/ApiKeyManagementConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="API Keys Block"
			tagline="A working credential-management section with one-time secret delivery, least-privilege scopes, staged rotation, audit evidence, and optimistic conflict recovery."
			tag="Developer UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience" title="API key management console">
				<Example
					:source="ApiKeyManagementConsoleSrc"
					filename="ApiKeyManagementConsole.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/api-keys/preview/ApiKeyManagementConsole"
					description="A full-height, responsive developer-settings section backed by repository API routes. Create, copy, edit, rotate, complete, revoke, reload, and reset credentials without replacing local placeholder arrays."
					default-open
					:preview-lines="14"
				>
					<ApiKeyManagementConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when developers need to manage a credential through its complete lifecycle rather than inspect a generated dashboard.
						The inventory, policies, safe key details, audit events, validation errors, and one-time receipts all come from the included block-demo API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>POST /api/block-demos/api-keys/keys</code> validates policy, stores only a SHA-256 hash, and returns the full secret once.</li>
						<li>Permission, rotation, completion, and revocation routes require the loaded revision so stale writes recover from server state.</li>
						<li>Production credentials require HTTPS origins, and the critical key-administration scope requires separate acknowledgement.</li>
						<li>The full-height composition owns its scrolling and switches between focused keys, details, and security views inside narrow iframes.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Server response contract">
				<CodeBlock lang="js" filename="api-key-response.js" :code="`{
\tok: true,
\tmessage: 'API key created. Copy the secret now; it cannot be shown again.',
\tkey: {
\t\tid: 'key-844',
\t\tname: 'Production checkout',
\t\tprefix: 'dom_live_9f2a',
\t\tenvironment: 'production',
\t\tstatus: 'active',
\t\trevision: 1,
\t\tscopes: ['customers:read', 'checkout:write'],
\t\torigins: ['https://app.example.com'],
\t\tfingerprint: '91C3:40B1:7A29:E6DD'
\t},
\tsecretReceipt: {
\t\tid: 'secret-receipt-1223',
\t\tsecret: 'dom_live_...',
\t\tmessage: 'This secret is available in this response only.'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Secret handling</h3>
						<p class="mt-2">The server returns full secret material only in create and rotate receipts. Every later response contains a masked prefix and verification fingerprint.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Scope model</h3>
						<p class="mt-2">Scope, origin, lifetime, and acknowledgement rules are enforced in the API, then rendered through DOM Studio validation states.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production adaptation</h3>
						<p class="mt-2">Replace the process-local demo store with your credential vault, authentication, rate limits, and organization-level authorization while preserving the response boundary.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
