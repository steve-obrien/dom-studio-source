<script setup>
import { ref } from 'vue';
import {
	DomButton,
	DomCard,
	DomDropdown,
	DomSelect,
	DomStatusPill,
} from '@getdom/studio/vue';

const accountItems = [
	{ label: 'Account settings', value: 'settings' },
	{ label: 'Billing', value: 'billing' },
	{ separator: true },
	{ label: 'Sign out', value: 'sign-out', tone: 'danger' },
];

const navItems = [
	{ label: 'Overview', path: 'M4 5h7v6H4V5Zm9 0h7v4h-7V5ZM4 13h7v6H4v-6Zm9-2h7v8h-7v-8Z', active: true },
	{ label: 'Customers', path: 'M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0' },
	{ label: 'Revenue', path: 'M4 17l5-5 4 4 7-8M4 21h16' },
	{ label: 'Reports', path: 'M7 3h7l4 4v14H7V3ZM14 3v5h5' },
];

const metrics = [
	{ label: 'Net revenue', value: '£42,860', change: '12.4%', context: 'vs. previous period' },
	{ label: 'New customers', value: '186', change: '8.1%', context: '34 repeat purchases' },
	{ label: 'Conversion rate', value: '7.8%', change: '1.2%', context: 'from 18,420 sessions' },
];

const revenueSources = [
	{ label: 'Subscriptions', value: '£26,480', percent: 62 },
	{ label: 'Usage charges', value: '£10,740', percent: 25 },
	{ label: 'Services', value: '£5,640', percent: 13 },
];

const activityItems = [
	{ initials: 'NH', title: 'Northstar renewed', detail: 'Growth plan · £4,800 ARR', time: '12 min', tone: 'success' },
	{ initials: 'AP', title: 'Payment needs attention', detail: 'Atlas Paper · invoice #1842', time: '38 min', tone: 'warning' },
	{ initials: 'JD', title: 'New workspace created', detail: 'Juno Design · 14 seats', time: '1 hr', tone: 'primary' },
];

const periodOptions = [
	{ label: 'Last 30 days', value: '30', description: 'Compare with the previous rolling 30-day period.' },
	{ label: 'Last quarter', value: 'quarter', description: 'Compare with the previous completed quarter.' },
];
const reportingPeriod = ref('30');
</script>

<template>
	<div class="min-h-screen bg-secondary/30 text-canvas-fg">
		<div class="grid min-h-screen lg:grid-cols-[13.5rem_minmax(0,1fr)]">
			<aside class="hidden flex-col border-r border-border bg-canvas lg:flex">
				<div class="flex h-16 items-center gap-2.5 border-b border-border px-4">
					<span class="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg">DS</span>
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold tracking-tight">DOM Studio</p>
						<p class="truncate text-xs text-muted-fg">Revenue workspace</p>
					</div>
				</div>

				<nav class="flex-1 space-y-1 p-3" aria-label="Dashboard navigation">
					<p class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Workspace</p>
					<button
						v-for="item in navItems"
						:key="item.label"
						type="button"
						class="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						:class="item.active ? 'bg-secondary text-canvas-fg' : 'text-muted-fg hover:bg-secondary/70 hover:text-canvas-fg'"
						:aria-current="item.active ? 'page' : undefined"
					>
						<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path :d="item.path" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						{{ item.label }}
					</button>
				</nav>

				<div class="border-t border-border p-3">
					<div class="rounded-xl bg-secondary/70 p-3">
						<div class="flex items-center justify-between gap-3">
							<p class="text-xs font-semibold">Monthly target</p>
							<p class="text-xs font-semibold tabular-nums">76%</p>
						</div>
						<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Monthly revenue target" aria-valuenow="76" aria-valuemin="0" aria-valuemax="100">
							<div class="h-full w-[76%] rounded-full bg-primary"></div>
						</div>
						<p class="mt-2 text-xs text-muted-fg">£7,140 to goal</p>
					</div>
				</div>
			</aside>

			<div class="min-w-0">
				<header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-canvas/95 px-3 backdrop-blur sm:px-5">
					<div class="flex min-w-0 items-center gap-2.5">
						<DomDropdown
							class="lg:hidden"
							:items="navItems"
							align="left"
							width="min-w-52"
							:show-indicator="false"
							trigger-class="grid size-9 place-items-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						>
							<template #trigger>
								<span class="sr-only">Open dashboard navigation</span>
								<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
							</template>
							<template #item="{ item }">
								<span class="flex items-center gap-2.5" :class="item.active ? 'font-semibold text-canvas-fg' : 'text-muted-fg'">
									<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path :d="item.path" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
									{{ item.label }}
								</span>
							</template>
						</DomDropdown>

						<div class="flex min-w-0 items-center gap-2 lg:hidden">
							<span class="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-[10px] font-bold text-primary-fg">DS</span>
							<span class="truncate text-sm font-semibold">Overview</span>
						</div>
						<div class="hidden min-w-0 lg:block">
							<p class="text-xs text-muted-fg">Revenue workspace</p>
							<p class="truncate text-sm font-semibold">Overview</p>
						</div>
					</div>

					<div class="flex shrink-0 items-center gap-2">
						<DomDropdown :items="accountItems" align="right" width="min-w-56">
							<template #trigger>
								<img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80" alt="" class="size-6 rounded-full object-cover" />
								<span class="sr-only sm:not-sr-only">Alex Morgan</span>
							</template>
						</DomDropdown>
					</div>
				</header>

				<main class="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
					<section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Good morning, Alex</h1>
								<span class="hidden sm:inline-flex"><DomStatusPill tone="success" label="On track" size="sm" /></span>
							</div>
							<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Revenue is ahead of plan, with subscription upgrades driving most of this month’s growth.</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<div class="w-full sm:w-44">
								<DomSelect v-model="reportingPeriod" :options="periodOptions" label="Reporting period" chrome="none" width="min-w-[18rem]" />
							</div>
							<DomButton size="sm">New report</DomButton>
						</div>
					</section>

					<DomCard as="section" padding="none" class="mt-6" aria-labelledby="dashboard-key-metrics">
						<h2 id="dashboard-key-metrics" class="sr-only">Key metrics</h2>
						<dl class="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
							<div v-for="metric in metrics" :key="metric.label" class="p-4 sm:p-5">
								<dt class="text-sm font-medium text-muted-fg">{{ metric.label }}</dt>
								<dd class="mt-3 flex items-end justify-between gap-3">
									<span class="text-2xl font-semibold tracking-tight tabular-nums">{{ metric.value }}</span>
									<span class="text-xs font-semibold text-success">↑ {{ metric.change }}</span>
								</dd>
								<p class="mt-1 text-xs text-muted-fg">{{ metric.context }}</p>
							</div>
						</dl>
					</DomCard>

					<div class="mt-5 grid gap-5 md:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
						<DomCard as="section" padding="lg" aria-labelledby="revenue-mix-heading">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Revenue mix</p>
									<h2 id="revenue-mix-heading" class="mt-1 text-lg font-semibold tracking-tight">£42,860 collected</h2>
								</div>
								<DomButton variant="secondary" size="sm">View report</DomButton>
							</div>

							<ul class="mt-6 divide-y divide-border">
								<li v-for="source in revenueSources" :key="source.label" class="py-3 first:pt-0 last:pb-0">
									<div class="flex items-center justify-between gap-4 text-sm">
										<span class="font-medium">{{ source.label }}</span>
										<span class="font-semibold tabular-nums">{{ source.value }}</span>
									</div>
									<div class="mt-2 flex items-center gap-3">
										<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" role="progressbar" :aria-label="`${source.label} share of revenue`" :aria-valuenow="source.percent" aria-valuemin="0" aria-valuemax="100">
											<div class="h-full rounded-full bg-primary" :style="{ width: `${source.percent}%` }"></div>
										</div>
										<span class="w-8 text-right text-xs font-medium tabular-nums text-muted-fg">{{ source.percent }}%</span>
									</div>
								</li>
							</ul>
						</DomCard>

						<DomCard as="section" padding="none" aria-labelledby="recent-activity-heading">
							<div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Workspace</p>
									<h2 id="recent-activity-heading" class="mt-1 font-semibold">Recent activity</h2>
								</div>
								<button type="button" class="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">View all</button>
							</div>
							<ul class="divide-y divide-border px-5">
								<li v-for="item in activityItems" :key="item.title" class="flex gap-3 py-4">
									<span class="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{{ item.initials }}</span>
									<div class="min-w-0 flex-1">
										<div class="flex items-start justify-between gap-3">
											<p class="text-sm font-semibold leading-5">{{ item.title }}</p>
											<span class="shrink-0 text-[11px] text-muted-fg">{{ item.time }}</span>
										</div>
										<p class="mt-0.5 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
									</div>
								</li>
							</ul>
						</DomCard>
					</div>
				</main>
			</div>
		</div>
	</div>
</template>
