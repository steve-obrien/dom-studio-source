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
			tagline="A working repository change session with revisioned file editing, contextual agent proposals, reviewable diffs, focused tests, and rollback evidence."
			tag="AI IDE"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / AI Tools" title="Cursor workspace">
				<Example
					:source="CursorWorkspaceSrc"
					filename="CursorWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/cursor-workspace/preview/CursorWorkspace"
					description="A GitHub Codespaces- and Cursor-inspired developer section with responsive Files, Editor, Agent, and Review views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<CursorWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block now models a complete review-safe coding loop. File reads and writes, workspace revisions, agent runs,
						proposal diffs, explicit patch application, test evidence, settings, activity, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Browse and search repository files, open tabs, edit source, and save against an exact file revision.</li>
						<li>Select a rich model, agent mode, and repository context before creating a deterministic proposal.</li>
						<li>Review each proposed file through `DomTextDiff` and confirm the repository revision before applying it.</li>
						<li>Run focused checks independently or automatically after apply, then inspect immutable terminal evidence.</li>
						<li>Exercise stale-file, stale-workspace, validation, and already-applied conflict paths without browser-only state.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="cursor-workspace.routes" :code="`GET   /api/block-demos/cursor-workspace/bootstrap
GET   /api/block-demos/cursor-workspace/files/:fileId
PATCH /api/block-demos/cursor-workspace/files/:fileId
PATCH /api/block-demos/cursor-workspace/settings
POST  /api/block-demos/cursor-workspace/agent-runs
GET   /api/block-demos/cursor-workspace/proposals/:proposalId
POST  /api/block-demos/cursor-workspace/proposals/:proposalId/apply
POST  /api/block-demos/cursor-workspace/tests
POST  /api/block-demos/cursor-workspace/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Repository boundary</h3><p class="mt-2">The demo uses process-local files. Production should resolve every read and write through an isolated workspace, virtual filesystem, or short-lived checkout.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Agent boundary</h3><p class="mt-2">Keep proposals structured and immutable. Model output should never write directly to disk without authorization, exact revisions, and an application receipt.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Execution boundary</h3><p class="mt-2">Run tests and commands inside a constrained worker with allowlisted scripts, resource limits, redacted logs, and workspace-scoped access.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
