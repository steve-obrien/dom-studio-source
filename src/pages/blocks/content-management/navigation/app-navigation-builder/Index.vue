<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import AppNavigationBuilder from './examples/AppNavigationBuilder.vue';
import AppNavigationBuilderSrc from './examples/AppNavigationBuilder.vue?raw';
import NavigationInspectorSrc from './components/NavigationInspector.vue?raw';
import NavigationTreePanelSrc from './components/NavigationTreePanel.vue?raw';
import PreviewMenuItemSrc from './components/PreviewMenuItem.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="App Navigation Builder Block"
			tagline="A complete navigation operations section for editing hierarchy, checking real routes and policies, previewing audiences, and publishing immutable app-shell versions."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Navigation" title="App navigation builder">
				<Example
					:source="AppNavigationBuilderSrc"
					filename="AppNavigationBuilder.vue"
					presentation="iframe"
					frame-src="/blocks/content-management/navigation/app-navigation-builder/preview/AppNavigationBuilder"
					description="Copy this into admin settings, CMS tooling, customer portals, app builders, or internal platforms that let teams manage nested product navigation."
					default-open
					:preview-lines="16"
				>
					<AppNavigationBuilder />
				</Example>
			</DocSection>

			<DocSection eyebrow="Local components" title="Copy the editor helpers">
				<div class="grid gap-4 xl:grid-cols-3">
					<CodeBlock lang="vue" filename="components/NavigationTreePanel.vue" :code="NavigationTreePanelSrc" />
					<CodeBlock lang="vue" filename="components/NavigationInspector.vue" :code="NavigationInspectorSrc" />
					<CodeBlock lang="vue" filename="components/PreviewMenuItem.vue" :code="PreviewMenuItemSrc" />
				</div>
			</DocSection>

			<DocSection eyebrow="Integration" title="How the working section fits together">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when builders need to manage application navigation as versioned product data instead of a hard-coded route file.
						It combines a draggable hierarchy, focused metadata editing, server-filtered audience previews, route health checks, and deployment proof.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/app-navigation-builder/bootstrap</code> returns the draft, hierarchy, editor options, and server validation report.</li>
						<li>Item create, patch, archive, and reorder routes require the current draft revision and return <code>409</code> for stale writes.</li>
						<li>The preview route resolves representative audience entitlements on the server before returning visible menu items.</li>
						<li>The validation route checks registered routes, feature flags, audience rules, and hierarchy depth before publishing.</li>
						<li>Publishing creates a new immutable version with a timestamped checksum receipt suitable for audit history.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="API-backed publish receipt">
				<CodeBlock lang="js" filename="navigation-publish-receipt.js" :code="`{
\tid: 'nav-publish-801',
\tversion: 19,
\treleaseNote: 'Fix operations destination and refresh audience navigation.',
\tpublishedBy: 'Maya Chen',
\titemCount: 9,
\tchecksum: '3d9002616b46f1db'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Tree persistence</h3>
						<p class="mt-2">The demo persists the complete nested identifier tree, validates uniqueness and depth, then recomputes parent IDs and sibling sort orders server-side.</p>
					</div>
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Audience rules</h3>
						<p class="mt-2">Audience previews make visibility understandable, while the example keeps route authorization explicitly separate from hiding navigation links.</p>
					</div>
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production boundary</h3>
						<p class="mt-2">The included API is process-local. Production should add authentication, authorization, durable versions, route discovery, deploy orchestration, and immutable audit storage.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
