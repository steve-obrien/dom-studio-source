<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import FunnelAnalyticsExplorer from './examples/FunnelAnalyticsExplorer.vue';
import FunnelAnalyticsExplorerSrc from './examples/FunnelAnalyticsExplorer.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Funnel Analytics Block"
			tagline="A responsive product analytics workspace for building funnels, comparing segments, finding drop-off, and saving insights."
			tag="Product analytics"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Analytics" title="Funnel analytics explorer">
				<Example
					:source="FunnelAnalyticsExplorerSrc"
					filename="FunnelAnalyticsExplorer.vue"
					presentation="iframe"
					frame-src="/blocks/analytics/funnel-analytics/preview/FunnelAnalyticsExplorer"
					description="Copy this into product analytics, growth, lifecycle, onboarding, or revenue workspaces. Replace the local funnel model with your event catalog, query API, segment definitions, and saved insight endpoints."
					default-open
					:preview-lines="14"
				>
					<FunnelAnalyticsExplorer />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when teams need to understand where users drop out of a key journey, such as signup, activation, checkout, upgrade, or invite flows.
						It is shaped like the funnel tooling users expect from products such as Amplitude, Mixpanel, PostHog, and Stripe analytics, while staying copy-pasteable for a product UI.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>funnelSteps</code> with event definitions from your event catalog, including event names, readable labels, and required properties.</li>
						<li>Wire range, segment, attribution, and conversion-window controls to a funnel query endpoint that returns step counts, conversion rates, drop-off, and comparison deltas.</li>
						<li>Persist saved insights with the funnel definition, active filters, chosen segments, notes, owner, workspace visibility, and chart/table preferences.</li>
						<li>Gate export, cohort creation, and audience sync actions behind permissions because funnel results often expose sensitive customer behavior.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended funnel payload">
				<CodeBlock lang="js" filename="funnel-definition.js" :code="`{
\tid: 'fun_activation_to_invite',
\tname: 'Activation to teammate invite',
\tdateRange: 'last_30_days',
\tconversionWindow: '7 days',
\tattribution: 'first_touch',
\tsegments: ['All users', 'Paid workspace', 'Invited user'],
\tsteps: [
\t\t{ event: 'account_created', label: 'Account created', count: 18420 },
\t\t{ event: 'workspace_created', label: 'Workspace created', count: 13980 },
\t\t{ event: 'project_created', label: 'First project created', count: 8240 },
\t\t{ event: 'teammate_invited', label: 'Teammate invited', count: 3910 }
\t],
\tfilters: [
\t\t{ field: 'workspace_plan', operator: 'not_equals', value: 'internal' },
\t\t{ field: 'country', operator: 'in', value: ['US', 'GB', 'CA'] }
\t],
\tinsights: [
\t\t{ type: 'dropoff', step: 'project_created', message: 'Project setup has the largest loss.' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Event catalog</h3>
						<p class="mt-2">Keep event labels, property types, deprecated events, and compatible filters server-owned so teams cannot create broken funnel definitions.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Query behavior</h3>
						<p class="mt-2">Return sampled results quickly, include freshness and sampling warnings, then let heavier cohort exports run as asynchronous jobs.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include reusable event pickers, cohort builders, annotation overlays, query warnings, and audience sync job monitors.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
