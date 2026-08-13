<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import DataComponentPreview from './DataComponentPreview.vue';

const componentTypes = [
	{
		name: 'Data grid',
		components: ['DomDataGrid'],
		description: 'Presents database-style resource rows with typed columns, filters, sorting, selection, pagination, and optional virtual rendering.',
		icon: 'M4 5h16v14H4zM4 9h16M9 5v14M15 5v14',
		preview: 'data-grid',
		to: '/data/data-grid',
	},
	{
		name: 'Filter bar',
		components: ['DomFilterBar'],
		description: 'Builds a controlled, transport-free query from free-text search and logical filter definitions for any resource view or store.',
		icon: 'M4 6h16M7 12h10M10 18h4M8 6v3M15 12v3M12 18v2',
		preview: 'filter-bar',
		to: '/data/filter-bar',
	},
	{
		name: 'Activity timeline',
		components: ['DomActivityTimeline'],
		description: 'Projects ordered application-owned rows into an accessible activity trail with logical field mappings, semantic status, and customizable slots.',
		icon: 'M6 5h.01M6 12h.01M6 19h.01M10 5h8M10 12h8M10 19h8M6 6v5M6 13v5',
		preview: 'activity-timeline',
		to: '/data/activity-timeline',
	},
	{
		name: 'Kanban',
		components: ['DomKanban'],
		description: 'Projects application-owned rows into ordered columns, with accessible card movement, custom renderers, and creation or persistence hooks.',
		icon: 'M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v12h-4z',
		preview: 'kanban',
		to: '/data/kanban',
	},
	{
		name: 'Month calendar',
		components: ['DomMonthCalendar'],
		description: 'Projects dated records into aligned month grids and continuous ranges, with custom day content and drag-and-drop intent events.',
		icon: 'M5 4v3M19 4v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12H4V7a1 1 0 0 1 1-1zM7 12h2M11 12h2M15 12h2M7 16h2M11 16h2',
		preview: 'month-calendar',
		to: '/data/month-calendar',
	},
	{
		name: 'Week planner',
		components: ['DomWeekPlanner'],
		description: 'Places timed records in fixed-width day lanes, with range selection, drag-and-drop helpers, and virtualized multi-week navigation.',
		icon: 'M5 4v3M19 4v3M4 9h16M8 9v11M12 9v11M16 9v11M4 6h16v14H4z',
		preview: 'week-planner',
		to: '/data/week-planner',
	},
	{
		name: 'Media browser',
		components: ['DomMediaBrowser'],
		description: 'Browses server-backed folders and files with selection, custom renderers, optimistic mutations, uploads, metadata, and picker workflows.',
		icon: 'M3.5 6.5h6l2 2h9v9h-17zM7 12h10M7 15h6',
		preview: 'media-browser',
		to: '/data/media-browser',
	},
	{
		name: 'Document editor',
		components: ['DomDocumentEditor'],
		description: 'Edits structured application content with tables, code, AI suggestion review, managed media, video, and optional collaboration adapters.',
		icon: 'M6 3h9l3 3v15H6zM15 3v4h4M9 11h6M9 15h6M9 18h4',
		preview: 'document-editor',
		to: '/data/document-editor',
	},
	{
		name: 'Agent chat shell',
		components: ['DomAgentChatShell'],
		description: 'Composes a resizable conversation sidebar, active thread, and contextual tool pane into a complete AI workspace surface.',
		icon: 'M5 5h14v11H9l-4 4zM9 9h6M9 12h4',
		preview: 'agent-chat-shell',
		to: '/data/agent-chat#dom-agent-chat-shell',
	},
	{
		name: 'Agent conversation',
		components: ['DomAgentConversation'],
		description: 'Renders a scroll-contained AI thread with streaming messages, reasoning summaries, tool calls, audio or text modes, and a fixed composer.',
		icon: 'M5 7h14M5 12h10M5 17h6M18 15l3 3-3 3',
		preview: 'agent-conversation',
		to: '/data/agent-chat#dom-agent-conversation',
	},
	{
		name: 'Agent conversation list',
		components: ['DomAgentConversationList'],
		description: 'Provides searchable AI conversation navigation with agent labels, unread counts, status pills, and active-thread selection.',
		icon: 'M5 6h14M5 12h14M5 18h8',
		preview: 'agent-conversation-list',
		to: '/data/agent-chat#dom-agent-conversation-list',
	},
];

const boundaries = [
	'Components own the reusable presentation, interaction states, accessibility, and events for a data-rich workflow.',
	'Applications own resource records, API clients, stores, permissions, query windows, validation, and persistence.',
	'Docs use server-shaped examples and emulated endpoints to demonstrate integration without coupling components to a transport.',
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Data"
			eyebrow="DOM Studio"
			tag="11 components · 9 workflows"
			tagline="Reusable components for presenting and manipulating application-owned records, files, documents, schedules, and conversations."
		>
			<DocSection eyebrow="Explore" title="Data components at a glance">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">
					Each preview shows the component's core interaction model. Open a card for live examples, integration patterns, API contracts, and the full component reference.
				</p>
				<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<RouterLink
						v-for="item in componentTypes"
						:key="item.to"
						:to="item.to"
						class="group block overflow-hidden rounded-xl border border-border skin-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<div class="overflow-hidden border-b border-border transition duration-300 group-hover:scale-[1.01]">
							<DataComponentPreview :type="item.preview" />
						</div>
						<div class="p-5">
							<div class="flex items-start gap-3">
								<div class="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-canvas-fg transition group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary">
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path :d="item.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between gap-4">
										<h3 class="text-base font-semibold text-canvas-fg">{{ item.name }}</h3>
										<span class="mt-0.5 shrink-0 text-muted-fg transition group-hover:translate-x-0.5 group-hover:text-canvas-fg" aria-hidden="true">-&gt;</span>
									</div>
									<div class="mt-2 flex flex-wrap gap-1.5">
										<code
											v-for="component in item.components"
											:key="component"
											class="rounded-md bg-secondary px-2 py-1 text-[11px] text-muted-fg ring-1 ring-border"
										>
											{{ component }}
										</code>
									</div>
								</div>
							</div>
							<p class="mt-4 text-sm leading-6 text-muted-fg">{{ item.description }}</p>
						</div>
					</RouterLink>
				</div>
			</DocSection>

			<DocSection eyebrow="Overview" title="Where data components fit">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Data components sit between local interface primitives and complete application blocks. They provide reusable query controls, views, and workflow shells for collections of application-owned data: resource rows, activity events, ordered boards, dated records, folders and files, structured documents, and AI conversations.
					</p>
					<p>
						The components do not replace an application's data layer. They accept records and controlled state, then emit changes and user intent. The application decides how to load, authorize, validate, and persist those changes. The docs pair them with server-shaped examples so loading, empty, error, mutation, pagination, and refresh behaviour can be evaluated in realistic flows.
					</p>
				</div>
			</DocSection>

			<DocSection eyebrow="Boundaries" title="What belongs here">
				<div class="grid gap-3 md:grid-cols-3">
					<div
						v-for="item in boundaries"
						:key="item"
						class="rounded-lg border border-border skin-card p-4 text-sm leading-6 text-muted-fg"
					>
						{{ item }}
					</div>
				</div>
			</DocSection>

		</DocPage>
	</DomStudioLayout>
</template>
