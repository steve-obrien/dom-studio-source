<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CommandPaletteShell from './examples/CommandPaletteShell.vue';
import CommandPaletteShellSrc from './examples/CommandPaletteShell.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Command Palette Block"
			tagline="A responsive product shell pattern for global command search, quick navigation, recent work, and keyboard-first actions."
			tag="App Shell UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="App Shells" title="Command palette shell">
				<Example
					:source="CommandPaletteShellSrc"
					filename="CommandPaletteShell.vue"
					presentation="iframe"
					frame-src="/blocks/app-shells/command-palette/preview/CommandPaletteShell"
					description="Copy this into a SaaS app shell, internal tool, developer dashboard, productivity app, or admin console. Replace the sample command list with route, entity, and action records from your product."
					default-open
					:preview-lines="16"
				>
					<CommandPaletteShell />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when your app has more destinations and actions than fit comfortably in primary navigation.
						It gives users one predictable launcher for pages, records, creation flows, settings, and recent work.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Build <code>commands</code> from your router, permission model, recent entities, and feature flags.</li>
						<li>Handle <code>@select</code> by routing for navigation commands, opening drawers or dialogs for creation commands, and dispatching jobs for background actions.</li>
						<li>Keep destructive commands out of the palette unless they open a confirmation dialog with clear audit context.</li>
						<li>Add analytics for query, selected command, empty searches, and shortcut usage to learn what navigation should be promoted elsewhere.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended command shape">
				<CodeBlock lang="js" filename="command-palette-command.js" :code="`{
\tvalue: 'customer:northstar',
\tlabel: 'Open Northstar Labs',
\tdescription: 'Customer account / Health score 84 / Renewal review due',
\ttype: 'record',
\tsection: 'Customers',
\tkeywords: ['account', 'renewal', 'health'],
\tpermission: 'customers:read',
\taction: {
\t\tkind: 'route',
\t\tto: '/customers/northstar'
\t},
\tmeta: {
\t\trecent: true,
\t\tlastOpenedAt: '2026-06-10T14:28:00Z'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Command source</h3>
						<p class="mt-2">Merge static route commands with server-side records and recent entities, then filter by permissions before rendering.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Action routing</h3>
						<p class="mt-2">Normalize command actions into route, modal, drawer, copy, and async job handlers so selection remains predictable.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include grouped command sections, remote search loading states, command aliases, and admin-managed shortcuts.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
