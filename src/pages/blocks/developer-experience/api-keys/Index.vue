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
			tagline="A responsive developer console for creating API credentials, tuning scopes, monitoring usage, and guiding safe key rotation."
			tag="Developer UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience" title="API key management console">
				<Example
					:source="ApiKeyManagementConsoleSrc"
					filename="ApiKeyManagementConsole.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/api-keys/preview/ApiKeyManagementConsole"
					description="Copy this into a developer dashboard, platform settings page, integration console, or admin surface. Replace the local arrays with credentials, usage, scope, and audit data from your API."
					default-open
					:preview-lines="14"
				>
					<ApiKeyManagementConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when builders need a practical credential surface that does more than list keys.
						It puts creation, permissions, rotation, usage limits, audit history, and environment context in one copyable UI.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>apiKeys</code> with masked credential records from your backend. Never send full secrets after creation.</li>
						<li>Connect the create panel to an endpoint that returns the one-time visible secret and stores only a hash server-side.</li>
						<li>Persist scope changes through a permission update endpoint, then refresh the selected key from the server response.</li>
						<li>Wire revoke, rotate, and copy actions to confirmation dialogs, audit events, and toast notifications in your app shell.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended API key shape">
				<CodeBlock lang="js" filename="api-key.js" :code="`{
\tid: 'key_live_checkout',
\tname: 'Production checkout',
\tprefix: 'dom_live_9f2a',
\tenvironment: 'Production',
\tstatus: 'Active',
\tcreatedAt: '2026-05-18',
\tlastUsedAt: '2 minutes ago',
\texpiresAt: 'Aug 18, 2026',
\towner: 'Maya Chen',
\tscopes: ['read:customers', 'write:checkout'],
\tusage: { requests: 48200, limit: 75000, errorRate: '0.04%' },
\tallowedOrigins: ['https://app.example.com'],
\tauditEvents: [
\t\t{ label: 'Scope updated', actor: 'Maya Chen', time: 'Today 09:42' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Secret handling</h3>
						<p class="mt-2">Show a full secret only once after creation. Use masked prefixes for every later render.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Scope model</h3>
						<p class="mt-2">Treat scopes as backend policy, not just UI state. Keep destructive scopes behind additional confirmation.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable secret reveal, IP allowlist editor, webhook tester, and key rotation dialogs.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
