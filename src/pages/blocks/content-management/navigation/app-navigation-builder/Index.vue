<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import AppNavigationBuilder from './examples/AppNavigationBuilder.vue';
import AppNavigationBuilderSrc from './examples/AppNavigationBuilder.vue?raw';
import NavigationStatusPillSrc from './components/NavigationStatusPill.vue?raw';
import PreviewMenuItemSrc from './components/PreviewMenuItem.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="App Navigation Builder Block"
			tagline="A copyable tree-first workspace for editing product navigation, role-based visibility, destination metadata, and publish-ready menu payloads."
			tag="CMS UI"
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

			<DocSection eyebrow="Local components" title="Copy the preview helpers">
				<div class="grid gap-4 lg:grid-cols-2">
					<CodeBlock lang="vue" filename="components/NavigationStatusPill.vue" :code="NavigationStatusPillSrc" />
					<CodeBlock lang="vue" filename="components/PreviewMenuItem.vue" :code="PreviewMenuItemSrc" />
				</div>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when builders need to manage app navigation from a product surface instead of a hard-coded route file.
						It combines hierarchy editing, destination details, feature flags, audience rules, preview modes, and a publish confirmation workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load the tree from your navigation API and persist reorder events from <code>DomTreeView</code> as parent and sort-order updates.</li>
						<li>Keep route availability, feature flag state, and permission checks on the server; the client should only preview the rules.</li>
						<li>Map visibility options to product roles, plan gates, workspaces, regions, or custom policy expressions in your backend.</li>
						<li>Publish changes as a versioned navigation draft so customers can preview, roll back, and audit who changed important links.</li>
						<li>Use the live preview as a visual contract for desktop sidebar, mobile drawer, and customer-portal menus.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended navigation payload">
				<CodeBlock lang="js" filename="navigation-draft.js" :code="`{
\tdraftId: 'nav_draft_0924',
\tworkspaceId: 'wrk_2048',
\tversion: 17,
\tstatus: 'draft',
\tpreviewMode: 'desktop',
\titems: [
\t\t{
\t\t\tid: 'overview',
\t\t\tparentId: null,
\t\t\tlabel: 'Overview',
\t\t\turl: '/app',
\t\t\tvisibility: 'everyone',
\t\t\taudience: ['all-users'],
\t\t\tfeatureFlag: null,
\t\t\trequiresAuth: true,
\t\t\tsortOrder: 10
\t\t}
\t],
\tchanges: {
\t\tadded: ['automation'],
\t\tupdated: ['reports'],
\t\treordered: ['billing']
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Tree persistence</h3>
						<p class="mt-2">Use stable item IDs and store parent IDs plus sibling sort orders. Treat drag/drop as intent, then validate the move server-side.</p>
					</div>
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Audience rules</h3>
						<p class="mt-2">Do not rely on menu hiding for authorization. Hidden links improve UX, but protected routes and APIs still need policy enforcement.</p>
					</div>
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include icon pickers, scheduled publishes, localization, route health checks, bulk audience edits, and reusable navigation preview rows.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
