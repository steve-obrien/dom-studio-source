<script setup>
defineProps({
	type: { type: String, required: true },
});

const gridRows = [
	{ name: 'Atlas Labs', detail: 'Enterprise', value: '$82k', status: 'Active', tone: 'bg-success' },
	{ name: 'Northstar', detail: 'Growth', value: '$46k', status: 'Trial', tone: 'bg-warning' },
	{ name: 'Daybreak', detail: 'Starter', value: '$18k', status: 'Active', tone: 'bg-success' },
];

const filterPills = [
	{ label: 'Status', value: 'Active' },
	{ label: 'Owner', value: 'Maya' },
];

const timelineRows = [
	{ title: 'Rollout completed', meta: '11:08', tone: 'bg-success' },
	{ title: 'Approval recorded', meta: '10:41', tone: 'bg-primary' },
	{ title: 'Evidence retained', meta: '10:39', tone: 'bg-warning' },
	{ title: 'Candidate created', meta: '09:52', tone: 'bg-muted-fg/60' },
];

const kanbanColumns = [
	{ name: 'Backlog', dot: 'bg-muted-fg/45', cards: ['Review empty states', 'Plan import flow'] },
	{ name: 'In progress', dot: 'bg-warning', cards: ['Usage alert emails', 'Mobile navigation'] },
	{ name: 'Complete', dot: 'bg-success', cards: ['Release notes'] },
];

const calendarDays = [
	28, 29, 30, 1, 2, 3, 4,
	5, 6, 7, 8, 9, 10, 11,
	12, 13, 14, 15, 16, 17, 18,
	19, 20, 21, 22, 23, 24, 25,
	26, 27, 28, 29, 30, 31, 1,
];

const mediaItems = [
	{ name: 'Campaign', type: 'folder', class: 'bg-warning/15 text-warning' },
	{ name: 'Dashboard', type: 'image', class: 'bg-primary/15 text-primary' },
	{ name: 'Research.pdf', type: 'pdf', class: 'bg-destructive/15 text-destructive' },
	{ name: 'Brand kit', type: 'folder', class: 'bg-warning/15 text-warning' },
];

const conversations = ['Launch planning', 'Weekly report', 'Customer research'];
</script>

<template>
	<div class="h-52 overflow-hidden bg-secondary/30 p-3 text-canvas-fg" aria-hidden="true">
		<div v-if="type === 'data-grid'" class="h-full overflow-hidden rounded-lg border border-border bg-canvas shadow-sm">
			<div class="flex h-9 items-center justify-between border-b border-border px-3">
				<div class="flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-primary"></span>
					<span class="h-2 w-16 rounded-full bg-secondary"></span>
				</div>
				<div class="h-5 w-20 rounded-md border border-border bg-secondary/50"></div>
			</div>
			<div class="grid grid-cols-[1.5fr_0.8fr_0.7fr] border-b border-border bg-secondary/45 px-3 py-2 text-[8px] font-semibold uppercase tracking-wider text-muted-fg">
				<span>Account</span>
				<span>Status</span>
				<span class="text-right">ARR</span>
			</div>
			<div
				v-for="row in gridRows"
				:key="row.name"
				class="grid grid-cols-[1.5fr_0.8fr_0.7fr] items-center border-b border-border/70 px-3 py-2 last:border-0"
			>
				<div class="min-w-0">
					<p class="truncate text-[10px] font-semibold">{{ row.name }}</p>
					<p class="mt-0.5 text-[8px] text-muted-fg">{{ row.detail }}</p>
				</div>
				<span class="flex items-center gap-1 text-[9px] text-muted-fg">
					<span class="size-1.5 rounded-full" :class="row.tone"></span>
					{{ row.status }}
				</span>
				<span class="text-right text-[10px] font-semibold">{{ row.value }}</span>
			</div>
		</div>

		<div v-else-if="type === 'filter-bar'" class="h-full overflow-hidden rounded-lg border border-border bg-canvas p-3 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[10px] font-semibold">Project query</p>
					<p class="mt-0.5 text-[8px] text-muted-fg">24 matching records</p>
				</div>
				<span class="rounded-md border border-border bg-secondary/45 px-2 py-1 text-[7px] font-semibold text-muted-fg">Clear</span>
			</div>
			<div class="mt-3 grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-2">
				<div class="flex h-8 items-center rounded-md border border-border bg-secondary/25 px-2 text-[8px] text-muted-fg">
					<svg viewBox="0 0 24 24" class="mr-1.5 size-3" fill="none"><circle cx="10" cy="10" r="5" stroke="currentColor" stroke-width="1.7" /><path d="m14 14 5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
					Search projects
				</div>
				<div class="flex h-8 items-center justify-between rounded-md border border-border px-2 text-[8px]"><span>Status</span><span class="text-muted-fg">⌄</span></div>
				<div class="flex h-8 items-center justify-between rounded-md border border-border px-2 text-[8px]"><span>Owner</span><span class="text-muted-fg">⌄</span></div>
			</div>
			<div class="mt-3 flex gap-1.5 border-t border-border pt-3">
				<span v-for="pill in filterPills" :key="pill.label" class="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[8px] font-semibold text-primary">{{ pill.label }}: {{ pill.value }} ×</span>
			</div>
			<div class="mt-4 grid grid-cols-3 gap-2">
				<div v-for="index in 3" :key="index" class="rounded-md border border-border p-2">
					<span class="block h-1.5 rounded-full bg-canvas-fg/15" :class="index === 2 ? 'w-3/5' : 'w-4/5'"></span>
					<span class="mt-2 block h-1.5 w-1/2 rounded-full bg-secondary"></span>
				</div>
			</div>
		</div>

		<div v-else-if="type === 'activity-timeline'" class="h-full overflow-hidden rounded-lg border border-border bg-canvas p-4 shadow-sm">
			<div class="mb-3 flex items-center justify-between">
				<div>
					<p class="text-[10px] font-semibold">Release activity</p>
					<p class="mt-0.5 text-[8px] text-muted-fg">Newest first</p>
				</div>
				<span class="rounded-full border border-border bg-secondary/45 px-2 py-1 text-[7px] font-semibold text-muted-fg">4 events</span>
			</div>
			<div>
				<div v-for="(row, index) in timelineRows" :key="row.title" class="grid grid-cols-[1rem_minmax(0,1fr)_2.5rem] gap-2">
					<div class="relative flex justify-center">
						<span v-if="index < timelineRows.length - 1" class="absolute top-3 -bottom-1 w-px bg-border"></span>
						<span class="relative mt-1 size-2.5 rounded-full border-2 border-canvas" :class="row.tone"></span>
					</div>
					<div class="pb-3">
						<p class="truncate text-[9px] font-semibold">{{ row.title }}</p>
						<div class="mt-1 h-1.5 rounded-full bg-secondary" :class="index % 2 ? 'w-3/5' : 'w-4/5'"></div>
					</div>
					<span class="pt-0.5 text-right text-[7px] text-muted-fg">{{ row.meta }}</span>
				</div>
			</div>
		</div>

		<div v-else-if="type === 'kanban'" class="flex h-full gap-2 overflow-hidden rounded-lg border border-border bg-canvas p-2 shadow-sm">
			<div v-for="column in kanbanColumns" :key="column.name" class="min-w-0 flex-1 rounded-md bg-secondary/55 p-2">
				<div class="mb-2 flex items-center justify-between gap-1">
					<span class="flex min-w-0 items-center gap-1 text-[9px] font-semibold">
						<span class="size-1.5 shrink-0 rounded-full" :class="column.dot"></span>
						<span class="truncate">{{ column.name }}</span>
					</span>
					<span class="text-[8px] text-muted-fg">{{ column.cards.length }}</span>
				</div>
				<div class="space-y-1.5">
					<div v-for="(card, index) in column.cards" :key="card" class="rounded-md border border-border bg-canvas p-2 shadow-xs">
						<p class="text-[9px] font-medium leading-3">{{ card }}</p>
						<div class="mt-2 flex items-center justify-between">
							<span class="h-1.5 w-8 rounded-full bg-secondary"></span>
							<span class="grid size-4 place-items-center rounded-full bg-primary/15 text-[7px] font-bold text-primary">{{ index + 1 }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div v-else-if="type === 'month-calendar'" class="h-full overflow-hidden rounded-lg border border-border bg-canvas p-2.5 shadow-sm">
			<div class="mb-2 flex items-center justify-between">
				<div>
					<p class="text-[10px] font-semibold">August 2026</p>
					<p class="text-[8px] text-muted-fg">Content schedule</p>
				</div>
				<div class="flex gap-1">
					<span class="size-5 rounded-md border border-border bg-secondary/40"></span>
					<span class="size-5 rounded-md border border-border bg-secondary/40"></span>
				</div>
			</div>
			<div class="grid grid-cols-7 text-center text-[7px] font-semibold uppercase text-muted-fg">
				<span v-for="(day, index) in ['M', 'T', 'W', 'T', 'F', 'S', 'S']" :key="index">{{ day }}</span>
			</div>
			<div class="mt-1 grid h-[8.5rem] grid-cols-7 grid-rows-5 overflow-hidden rounded-md border border-border">
				<div
					v-for="(day, index) in calendarDays"
					:key="index"
					class="relative border-b border-r border-border/70 p-1 text-[8px] last:border-r-0"
					:class="index < 3 ? 'bg-secondary/35 text-muted-fg' : ''"
				>
					{{ day }}
					<span v-if="[7, 12, 18, 24].includes(index)" class="absolute inset-x-1 bottom-1 h-1.5 rounded-full bg-primary/65"></span>
					<span v-if="index === 20" class="absolute inset-x-1 bottom-1 h-1.5 rounded-full bg-success/70"></span>
				</div>
			</div>
		</div>

		<div v-else-if="type === 'week-planner'" class="h-full overflow-hidden rounded-lg border border-border bg-canvas shadow-sm">
			<div class="grid h-8 grid-cols-[2rem_repeat(4,1fr)] border-b border-border bg-secondary/40 text-center text-[8px] font-semibold">
				<span></span>
				<span class="border-l border-border py-2">MON 10</span>
				<span class="border-l border-border py-2">TUE 11</span>
				<span class="border-l border-border py-2">WED 12</span>
				<span class="border-l border-border py-2">THU 13</span>
			</div>
			<div class="relative grid h-[9.7rem] grid-cols-[2rem_repeat(4,1fr)]">
				<div class="flex flex-col justify-around py-1 text-right text-[7px] text-muted-fg">
					<span>9</span><span>10</span><span>11</span><span>12</span><span>1</span>
				</div>
				<div v-for="column in 4" :key="column" class="relative border-l border-border bg-[linear-gradient(to_bottom,transparent_calc(20%-1px),var(--border)_20%)] bg-[length:100%_20%]">
					<div v-if="column === 1" class="absolute inset-x-1 top-3 h-10 rounded-md border border-primary/25 bg-primary/15 p-1 text-[8px] font-medium text-primary">Stand-up</div>
					<div v-if="column === 2" class="absolute inset-x-1 top-14 h-14 rounded-md border border-warning/25 bg-warning/15 p-1 text-[8px] font-medium text-warning">Research</div>
					<div v-if="column === 3" class="absolute inset-x-1 top-8 h-16 rounded-md border border-success/25 bg-success/15 p-1 text-[8px] font-medium text-success">Design review</div>
					<div v-if="column === 4" class="absolute inset-x-1 top-24 h-9 rounded-md border border-primary/25 bg-primary/15 p-1 text-[8px] font-medium text-primary">Launch</div>
				</div>
			</div>
		</div>

		<div v-else-if="type === 'media-browser'" class="flex h-full overflow-hidden rounded-lg border border-border bg-canvas shadow-sm">
			<aside class="w-20 shrink-0 border-r border-border bg-secondary/35 p-2">
				<div class="mb-3 flex items-center gap-1.5">
					<span class="grid size-5 place-items-center rounded-md bg-primary text-[8px] font-bold text-primary-fg">M</span>
					<span class="h-2 w-8 rounded-full bg-canvas-fg/15"></span>
				</div>
				<div class="space-y-1 text-[8px] text-muted-fg">
					<p class="rounded bg-primary/10 px-1.5 py-1 font-semibold text-primary">Library</p>
					<p class="px-1.5 py-1">Recent</p>
					<p class="px-1.5 py-1">Shared</p>
				</div>
			</aside>
			<div class="min-w-0 flex-1 p-2.5">
				<div class="mb-2.5 flex items-center justify-between">
					<div>
						<p class="text-[10px] font-semibold">Product media</p>
						<p class="text-[8px] text-muted-fg">12 items</p>
					</div>
					<span class="rounded-md bg-primary px-2 py-1 text-[8px] font-semibold text-primary-fg">Upload</span>
				</div>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<div v-for="item in mediaItems" :key="item.name" class="min-w-0 overflow-hidden rounded-md border border-border bg-secondary/35">
						<div class="grid h-16 place-items-center" :class="item.class">
							<svg v-if="item.type === 'folder'" viewBox="0 0 24 24" class="size-7" fill="none">
								<path d="M3.5 6.5h6l2 2h9v9h-17z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
							</svg>
							<svg v-else-if="item.type === 'image'" viewBox="0 0 24 24" class="size-7" fill="none">
								<rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5" />
								<path d="m6.5 16 3.5-4 2.5 3 2-2 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							<span v-else class="text-[10px] font-bold">PDF</span>
						</div>
						<p class="truncate px-1.5 py-1.5 text-[8px] font-medium">{{ item.name }}</p>
					</div>
				</div>
			</div>
		</div>

		<div v-else-if="type === 'document-editor'" class="h-full overflow-hidden rounded-lg border border-border bg-canvas shadow-sm">
			<div class="flex h-9 items-center gap-1 border-b border-border bg-secondary/35 px-2">
				<span v-for="tool in 8" :key="tool" class="grid size-5 place-items-center rounded text-[8px] font-bold text-muted-fg" :class="tool === 4 ? 'bg-canvas shadow-xs text-canvas-fg' : ''">{{ ['↶', '↷', 'H', 'B', 'I', '•', '↗', '+'][tool - 1] }}</span>
				<span class="ml-auto rounded-full bg-success/15 px-2 py-1 text-[7px] font-semibold text-success">Saved</span>
			</div>
			<div class="grid h-[10.5rem] grid-cols-[1fr_5rem]">
				<div class="overflow-hidden p-4">
					<p class="text-[13px] font-bold tracking-tight">Customer launch note</p>
					<p class="mt-2 max-w-xs text-[9px] leading-4 text-muted-fg">The August release gives teams one place to draft product copy, review suggestions, and keep content structured.</p>
					<div class="mt-3 rounded-md border-l-2 border-primary bg-primary/10 px-2.5 py-2">
						<p class="text-[8px] font-semibold text-primary">AI suggestion</p>
						<p class="mt-1 text-[8px] leading-3 text-muted-fg">Make the introduction warmer and more direct.</p>
					</div>
					<div class="mt-3 h-1.5 w-4/5 rounded-full bg-secondary"></div>
					<div class="mt-1.5 h-1.5 w-3/5 rounded-full bg-secondary"></div>
				</div>
				<aside class="border-l border-border bg-secondary/25 p-2">
					<p class="text-[8px] font-semibold">Outline</p>
					<div class="mt-3 space-y-2">
						<span class="block h-1.5 w-full rounded bg-primary/35"></span>
						<span class="block h-1.5 w-4/5 rounded bg-canvas-fg/10"></span>
						<span class="block h-1.5 w-3/5 rounded bg-canvas-fg/10"></span>
					</div>
				</aside>
			</div>
		</div>

		<div v-else-if="type === 'agent-chat-shell'" class="flex h-full overflow-hidden rounded-lg border border-border bg-canvas shadow-sm">
			<aside class="w-24 shrink-0 border-r border-border bg-secondary/35 p-2">
				<div class="flex items-center justify-between">
					<span class="text-[9px] font-semibold">Chats</span>
					<span class="grid size-4 place-items-center rounded bg-primary text-[10px] text-primary-fg">+</span>
				</div>
				<div class="mt-2 space-y-1">
					<div v-for="(conversation, index) in conversations" :key="conversation" class="rounded-md px-1.5 py-2" :class="index === 0 ? 'bg-canvas shadow-xs' : ''">
						<p class="truncate text-[8px] font-medium">{{ conversation }}</p>
						<p class="mt-0.5 text-[7px] text-muted-fg">{{ index + 2 }} messages</p>
					</div>
				</div>
			</aside>
			<div class="flex min-w-0 flex-1 flex-col">
				<div class="flex h-9 items-center justify-between border-b border-border px-3">
					<div class="flex items-center gap-1.5">
						<span class="grid size-5 place-items-center rounded-full bg-primary/15 text-[8px] font-bold text-primary">A</span>
						<span class="text-[9px] font-semibold">Launch assistant</span>
					</div>
					<span class="size-2 rounded-full bg-success"></span>
				</div>
				<div class="flex-1 space-y-2 overflow-hidden p-3">
					<div class="ml-auto max-w-[75%] rounded-lg rounded-br-sm bg-primary px-2.5 py-2 text-[8px] leading-3 text-primary-fg">Build a launch plan from the current research.</div>
					<div class="max-w-[82%] rounded-lg rounded-bl-sm bg-secondary px-2.5 py-2 text-[8px] leading-3 text-muted-fg">I found three strong themes. I’ll turn them into a sequenced plan.</div>
					<div class="max-w-[82%] rounded-md border border-border p-2">
						<div class="flex items-center justify-between text-[8px] font-semibold"><span>Research tool</span><span class="text-success">Complete</span></div>
						<div class="mt-1.5 h-1.5 w-4/5 rounded-full bg-secondary"></div>
					</div>
				</div>
				<div class="m-2 mt-0 flex h-8 items-center rounded-md border border-border bg-canvas px-2 text-[8px] text-muted-fg shadow-xs">Ask a follow-up… <span class="ml-auto grid size-5 place-items-center rounded bg-primary text-primary-fg">↑</span></div>
			</div>
		</div>

		<div v-else-if="type === 'agent-conversation'" class="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-canvas shadow-sm">
			<div class="flex h-10 items-center justify-between border-b border-border px-3">
				<div class="flex items-center gap-2">
					<span class="grid size-6 place-items-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">A</span>
					<div>
						<p class="text-[9px] font-semibold">Launch assistant</p>
						<p class="text-[7px] text-muted-fg">Planning agent</p>
					</div>
				</div>
				<span class="rounded-full bg-success/15 px-2 py-1 text-[7px] font-semibold text-success">Ready</span>
			</div>
			<div class="flex-1 space-y-2 overflow-hidden p-3">
				<div class="ml-auto max-w-[70%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-[8px] leading-3 text-primary-fg">Turn the current research into a launch plan.</div>
				<div class="max-w-[78%] rounded-lg rounded-bl-sm bg-secondary px-3 py-2 text-[8px] leading-3 text-muted-fg">I found three strong themes and grouped them by launch phase.</div>
				<div class="max-w-[78%] rounded-md border border-border p-2">
					<div class="flex items-center justify-between text-[8px] font-semibold"><span>Research summary</span><span class="text-success">Complete</span></div>
					<div class="mt-2 space-y-1">
						<span class="block h-1.5 w-full rounded-full bg-secondary"></span>
						<span class="block h-1.5 w-3/4 rounded-full bg-secondary"></span>
					</div>
				</div>
			</div>
			<div class="m-2 mt-0 flex h-9 items-center rounded-md border border-border bg-canvas px-2.5 text-[8px] text-muted-fg shadow-xs">Ask a follow-up… <span class="ml-auto grid size-5 place-items-center rounded bg-primary text-primary-fg">↑</span></div>
		</div>

		<div v-else-if="type === 'agent-conversation-list'" class="h-full overflow-hidden rounded-lg border border-border bg-canvas p-2.5 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[10px] font-semibold">Conversations</p>
					<p class="text-[8px] text-muted-fg">Agent workspace</p>
				</div>
				<span class="grid size-6 place-items-center rounded-md bg-primary text-[12px] text-primary-fg">+</span>
			</div>
			<div class="mt-2 flex h-7 items-center rounded-md border border-border bg-secondary/35 px-2 text-[8px] text-muted-fg">
				<svg viewBox="0 0 24 24" class="mr-1.5 size-3" fill="none"><circle cx="10" cy="10" r="5" stroke="currentColor" stroke-width="1.7" /><path d="m14 14 5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
				Search conversations
			</div>
			<div class="mt-2 space-y-1">
				<div v-for="(conversation, index) in conversations" :key="conversation" class="flex items-center gap-2 rounded-md border px-2 py-2" :class="index === 0 ? 'border-primary/25 bg-primary/10' : 'border-transparent'">
					<span class="grid size-6 shrink-0 place-items-center rounded-full text-[8px] font-bold" :class="index === 0 ? 'bg-primary text-primary-fg' : 'bg-secondary text-muted-fg'">{{ index + 1 }}</span>
					<div class="min-w-0 flex-1">
						<div class="flex items-center justify-between gap-2">
							<p class="truncate text-[9px] font-semibold">{{ conversation }}</p>
							<span v-if="index === 1" class="grid size-4 shrink-0 place-items-center rounded-full bg-primary text-[7px] font-bold text-primary-fg">2</span>
						</div>
						<p class="mt-0.5 truncate text-[7px] text-muted-fg">Updated {{ index + 2 }}m ago · Launch agent</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
