<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CursorWorkspace from './examples/CursorWorkspace.vue';
import CursorWorkspaceSrc from './examples/CursorWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Cursor Workspace Block"
			tagline="A copyable AI coding workspace with headless navigation, resizing, tabs, menus, drawers, command search, editable files, and agent-driven review."
			tag="AI IDE"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / AI Tools" title="Cursor workspace">
				<Example
					:source="CursorWorkspaceSrc"
					filename="CursorWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/cursor-workspace/preview/CursorWorkspace"
					description="Copy this into AI developer tools, internal IDEs, web coding sandboxes, documentation playgrounds, or agent review surfaces where teams need file context, editing, and conversational code changes in one app shell."
					default-open
					:preview-lines="16"
				>
					<CursorWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product needs to demonstrate an AI-assisted coding loop with realistic workspace density.
						The example keeps file navigation, editable source, command search, agent planning, review diffs, model controls, and terminal feedback in one surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the local files array with project files from your sandbox, repo service, template registry, or virtual file system.</li>
						<li>Route agent messages to your backend and store draft patches as structured operations before applying them to the editor model.</li>
						<li>Use the drawer for patch review, test output, trace details, or codebase context that should not permanently occupy the editor canvas.</li>
						<li>Keep command palette actions small and reversible: open files, toggle panes, run tests, stage changes, and launch agent modes.</li>
						<li>Preserve the headless primitives for keyboard navigation, focus management, popover placement, drawer trapping, tab roving, and split resizing.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended workspace state">
				<CodeBlock lang="js" filename="ai-workspace-state.js" :code="`{
\tworkspace: {
\t\tid: 'wrk_acme_dashboard',
\t\tbranch: 'feature/mission-control',
\t\tagentMode: 'composer',
\t\tmodel: 'Composer 2.5'
\t},
\tfiles: [
\t\t{
\t\t\tid: 'dashboard-page',
\t\t\tpath: 'src/app/dashboard/page.tsx',
\t\t\tlanguage: 'tsx',
\t\t\tstatus: 'modified',
\t\t\tcontent: 'export default function Dashboard() { ... }'
\t\t}
\t],
\tpatches: [
\t\t{
\t\t\tid: 'patch_agent_layout',
\t\t\tfileId: 'dashboard-page',
\t\t\tstatus: 'proposed',
\t\t\toperations: [{ type: 'insert', line: 18, text: '<MissionControl />' }]
\t\t}
\t],
\tagentMessages: [
\t\t{
\t\t\trole: 'assistant',
\t\t\tbody: 'I found the dashboard shell and can add a task rail.',
\t\t\tcitations: ['src/app/dashboard/page.tsx']
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Editor model</h3>
						<p class="mt-2">Swap the textarea for Monaco, CodeMirror, or your in-house editor once you need syntax tokens, selections, diagnostics, and multi-file edits.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Patch safety</h3>
						<p class="mt-2">Keep agent changes reviewable. Store proposed diffs, affected files, test commands, and rollback metadata before writing to a project.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include diagnostics gutters, inline completions, streaming terminal output, branch comparison, and a real virtual file system adapter.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
