<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomToggle } from '@getdom/studio/vue';

const visibilityOptions = [
	{ label: 'Team', value: 'Team' },
	{ label: 'Personal', value: 'Personal' },
	{ label: 'Locked', value: 'Locked' },
];

const matchModeOptions = [
	{ label: 'Match all rules', value: 'all' },
	{ label: 'Match any rule', value: 'any' },
];

const filterFields = [
	{
		label: 'Plan fit',
		operators: ['is', 'is not'],
		values: ['Enterprise', 'Growth', 'Starter'],
	},
	{
		label: 'Lifecycle',
		operators: ['is', 'is not'],
		values: ['Trial', 'Active', 'At risk', 'Churned'],
	},
	{
		label: 'Product usage',
		operators: ['above', 'below'],
		values: ['30%', '50%', '70%', '90%'],
	},
	{
		label: 'Owner',
		operators: ['is', 'is not'],
		values: ['Maya Chen', 'Jon Bell', 'Ari Grant', 'Unassigned'],
	},
];

const savedViews = [
	{
		id: 'view_high_value_trials',
		name: 'High-value trials',
		description: 'Trials with enterprise fit and recent product activity.',
		owner: 'Maya Chen',
		visibility: 'Team',
		updatedAt: 'Today 10:18',
		status: 'Ready',
		rules: [
			{ id: 'rule_plan', field: 'Plan fit', operator: 'is', value: 'Enterprise' },
			{ id: 'rule_usage', field: 'Product usage', operator: 'above', value: '70%' },
			{ id: 'rule_lifecycle', field: 'Lifecycle', operator: 'is', value: 'Trial' },
		],
		metrics: { matches: 128, conversion: '18.4%', revenue: '$94k' },
		activity: [
			{ label: 'Usage threshold raised to 70%', actor: 'Maya Chen', time: 'Today 10:18' },
			{ label: 'Shared with Sales workspace', actor: 'Jon Bell', time: 'Yesterday' },
			{ label: 'View created', actor: 'Maya Chen', time: 'Jun 04, 2026' },
		],
	},
	{
		id: 'view_risk_review',
		name: 'Renewal risk review',
		description: 'Accounts with low activity and upcoming renewal dates.',
		owner: 'Jon Bell',
		visibility: 'Team',
		updatedAt: 'Yesterday',
		status: 'Review',
		rules: [
			{ id: 'rule_usage_low', field: 'Product usage', operator: 'below', value: '50%' },
			{ id: 'rule_owner', field: 'Owner', operator: 'is not', value: 'Unassigned' },
		],
		metrics: { matches: 42, conversion: '7.2%', revenue: '$181k' },
		activity: [
			{ label: 'Marked for manager review', actor: 'Jon Bell', time: 'Yesterday' },
			{ label: 'Owner rule updated', actor: 'Ari Grant', time: 'Jun 08, 2026' },
		],
	},
	{
		id: 'view_self_serve_growth',
		name: 'Self-serve growth',
		description: 'Starter accounts showing signals for an upgrade motion.',
		owner: 'Ari Grant',
		visibility: 'Personal',
		updatedAt: 'Jun 07, 2026',
		status: 'Draft',
		rules: [
			{ id: 'rule_plan_growth', field: 'Plan fit', operator: 'is', value: 'Growth' },
			{ id: 'rule_lifecycle_active', field: 'Lifecycle', operator: 'is', value: 'Active' },
		],
		metrics: { matches: 214, conversion: '11.8%', revenue: '$52k' },
		activity: [
			{ label: 'Private draft duplicated', actor: 'Ari Grant', time: 'Jun 07, 2026' },
			{ label: 'Lifecycle rule added', actor: 'Ari Grant', time: 'Jun 07, 2026' },
		],
	},
];

const previewRows = [
	{ company: 'Northstar Labs', owner: 'Maya Chen', usage: '88%', lifecycle: 'Trial', value: '$18.4k' },
	{ company: 'Fable Systems', owner: 'Jon Bell', usage: '76%', lifecycle: 'Trial', value: '$12.1k' },
	{ company: 'Beacon Health', owner: 'Maya Chen', usage: '91%', lifecycle: 'Active', value: '$24.8k' },
	{ company: 'Atlas Cloud', owner: 'Ari Grant', usage: '72%', lifecycle: 'Trial', value: '$9.6k' },
];

const tabs = [
	{ key: 'preview', label: 'Preview' },
	{ key: 'activity', label: 'Activity' },
];

const selectedViewId = ref(savedViews[0].id);
const activeTab = ref('preview');
const visibility = ref(savedViews[0].visibility);
const matchMode = ref('all');
const notifySubscribers = ref(true);
const rules = ref(cloneRules(savedViews[0].rules));

const selectedView = computed(() => savedViews.find((view) => view.id === selectedViewId.value) || savedViews[0]);
const ruleCount = computed(() => rules.value.length);
const selectedRuleSummary = computed(() => `${matchMode.value === 'all' ? 'All' : 'Any'} of ${ruleCount.value} rules`);
const estimatedMatches = computed(() => Math.max(12, selectedView.value.metrics.matches + (ruleCount.value - selectedView.value.rules.length) * 17));
const activeFields = computed(() => new Set(rules.value.map((rule) => rule.field)));
const completeness = computed(() => {
	const required = ['Plan fit', 'Lifecycle', 'Product usage'];
	const filled = required.filter((field) => activeFields.value.has(field)).length;
	return Math.round((filled / required.length) * 100);
});

watch(selectedView, (view) => {
	visibility.value = view.visibility;
	matchMode.value = 'all';
	rules.value = cloneRules(view.rules);
});

function cloneRules(nextRules) {
	return nextRules.map((rule) => ({ ...rule }));
}

function selectView(view) {
	selectedViewId.value = view.id;
}

function fieldConfig(field) {
	return filterFields.find((item) => item.label === field) || filterFields[0];
}

function updateRuleField(rule, field) {
	const nextField = fieldConfig(field);
	rule.field = nextField.label;
	rule.operator = nextField.operators[0];
	rule.value = nextField.values[0];
}

function addRule() {
	const field = filterFields.find((item) => !activeFields.value.has(item.label)) || filterFields[0];
	rules.value = [
		...rules.value,
		{
			id: `rule_${Date.now()}`,
			field: field.label,
			operator: field.operators[0],
			value: field.values[0],
		},
	];
}

function removeRule(ruleId) {
	if (rules.value.length === 1) return;
	rules.value = rules.value.filter((rule) => rule.id !== ruleId);
}

function statusClasses(status) {
	return {
		Ready: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Review: 'bg-warning/15 text-warning',
		Draft: 'bg-secondary text-muted-fg',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border skin-raised px-4 py-4 sm:px-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Workspace views</p>
				<h3 class="mt-1 text-xl font-semibold tracking-tight">Saved filters</h3>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<DomButton variant="ghost" size="sm">
					<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					</svg>
					New view
				</DomButton>
				<DomButton size="sm">Save changes</DomButton>
			</div>
		</header>

		<div class="grid min-h-[44rem] lg:grid-cols-[18rem_minmax(0,1fr)_18rem]">
			<aside class="border-b border-border skin-raised p-3 lg:border-b-0 lg:border-r">
				<div class="mb-3 grid grid-cols-3 gap-2 text-center">
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">18</p>
						<p class="text-[11px] text-muted-fg">Views</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">6</p>
						<p class="text-[11px] text-muted-fg">Shared</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">3</p>
						<p class="text-[11px] text-muted-fg">Drafts</p>
					</div>
				</div>

				<div class="space-y-2">
					<button
						v-for="view in savedViews"
						:key="view.id"
						type="button"
						class="w-full rounded-lg border p-3 text-left transition hover:border-primary/50"
						:class="view.id === selectedView.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-background'"
						@click="selectView(view)"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ view.name }}</p>
								<p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ view.description }}</p>
							</div>
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClasses(view.status)">
								{{ view.status }}
							</span>
						</div>
						<div class="mt-3 flex items-center justify-between text-xs text-muted-fg">
							<span>{{ view.owner }}</span>
							<span>{{ view.updatedAt }}</span>
						</div>
					</button>
				</div>
			</aside>

			<main class="min-w-0">
				<section class="border-b border-border p-4 sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="text-lg font-semibold">{{ selectedView.name }}</h4>
								<span class="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-fg">
									{{ visibility }}
								</span>
							</div>
							<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">{{ selectedView.description }}</p>
						</div>
						<div class="grid grid-cols-3 gap-3 text-right text-sm">
							<div>
								<p class="font-semibold">{{ estimatedMatches }}</p>
								<p class="text-xs text-muted-fg">Matches</p>
							</div>
							<div>
								<p class="font-semibold">{{ selectedView.metrics.conversion }}</p>
								<p class="text-xs text-muted-fg">Conv.</p>
							</div>
							<div>
								<p class="font-semibold">{{ selectedView.metrics.revenue }}</p>
								<p class="text-xs text-muted-fg">Value</p>
							</div>
						</div>
					</div>
				</section>

				<section class="border-b border-border p-4 sm:p-5">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold">Filter rules</h4>
							<p class="mt-1 text-sm text-muted-fg">{{ selectedRuleSummary }} must pass before a record appears in this view.</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<DomNativeSelect v-model="matchMode" :options="matchModeOptions" class="w-44" />
							<DomButton variant="ghost" size="sm" @click="addRule">Add rule</DomButton>
						</div>
					</div>

					<div class="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
						<div
							v-for="(rule, index) in rules"
							:key="rule.id"
							class="grid gap-3 bg-background p-3 sm:grid-cols-[2rem_minmax(0,1fr)_8rem_8rem_auto] sm:items-center"
						>
							<div class="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-fg">
								{{ index + 1 }}
							</div>
							<DomNativeSelect
								:model-value="rule.field"
								:options="filterFields.map((field) => ({ label: field.label, value: field.label }))"
								@update:model-value="updateRuleField(rule, $event)"
							/>
							<DomNativeSelect
								v-model="rule.operator"
								:options="fieldConfig(rule.field).operators.map((operator) => ({ label: operator, value: operator }))"
							/>
							<DomNativeSelect
								v-model="rule.value"
								:options="fieldConfig(rule.field).values.map((value) => ({ label: value, value }))"
							/>
							<button
								type="button"
								class="inline-flex size-9 items-center justify-center rounded-lg text-muted-fg transition hover:bg-secondary hover:text-fg disabled:opacity-40"
								:disabled="rules.length === 1"
								aria-label="Remove rule"
								@click="removeRule(rule.id)"
							>
								<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
							</button>
						</div>
					</div>
				</section>

				<section class="p-4 sm:p-5">
					<div class="border-b border-border">
						<DomTabs v-model="activeTab" :tabs="tabs" />
					</div>

					<div v-if="activeTab === 'preview'" class="mt-4 overflow-x-auto rounded-xl border border-border">
						<div class="min-w-[32rem]">
							<div class="grid grid-cols-[minmax(10rem,1fr)_7rem_6rem_6rem] gap-3 border-b border-border bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-fg">
								<span>Company</span>
								<span>Owner</span>
								<span>Usage</span>
								<span class="text-right">Value</span>
							</div>
							<div class="divide-y divide-border">
								<div
									v-for="row in previewRows"
									:key="row.company"
									class="grid grid-cols-[minmax(10rem,1fr)_7rem_6rem_6rem] gap-3 px-3 py-3 text-sm"
								>
									<div class="min-w-0">
										<p class="truncate font-medium">{{ row.company }}</p>
										<p class="mt-0.5 text-xs text-muted-fg">{{ row.lifecycle }}</p>
									</div>
									<span class="truncate text-muted-fg">{{ row.owner }}</span>
									<span>{{ row.usage }}</span>
									<span class="text-right font-medium">{{ row.value }}</span>
								</div>
							</div>
						</div>
					</div>

					<div v-else class="mt-4 divide-y divide-border rounded-xl border border-border">
						<div
							v-for="event in selectedView.activity"
							:key="`${event.label}-${event.time}`"
							class="flex items-start justify-between gap-3 p-3"
						>
							<div>
								<p class="text-sm font-medium">{{ event.label }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
							</div>
							<p class="shrink-0 text-xs text-muted-fg">{{ event.time }}</p>
						</div>
					</div>
				</section>
			</main>

			<aside class="border-t border-border skin-raised p-4 lg:border-l lg:border-t-0">
				<div class="space-y-5">
					<section>
						<h4 class="font-semibold">View settings</h4>
						<label class="mt-4 block text-sm font-medium">
							Visibility
							<DomNativeSelect v-model="visibility" :options="visibilityOptions" class="mt-2 w-full" />
						</label>
						<label class="mt-4 flex items-center justify-between gap-3 text-sm font-medium">
							<span>
								<span class="block">Notify subscribers</span>
								<span class="mt-1 block text-xs font-normal text-muted-fg">Send a digest when saved rules change.</span>
							</span>
							<DomToggle v-model="notifySubscribers" aria-label="Notify subscribers" />
						</label>
					</section>

					<section class="border-t border-border pt-5">
						<h4 class="font-semibold">Readiness</h4>
						<div class="mt-3">
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-fg">Core fields covered</span>
								<span class="font-medium">{{ completeness }}%</span>
							</div>
							<div class="mt-2 h-2 rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary" :style="{ width: `${completeness}%` }" />
							</div>
						</div>
						<div class="mt-4 space-y-2 text-sm text-muted-fg">
							<p class="flex items-center gap-2"><span class="size-2 rounded-full bg-emerald-500" /> Query can be cached</p>
							<p class="flex items-center gap-2"><span class="size-2 rounded-full bg-primary" /> {{ ruleCount }} rules configured</p>
							<p class="flex items-center gap-2"><span class="size-2 rounded-full bg-warning" /> Review export access</p>
						</div>
					</section>

					<section class="border-t border-border pt-5">
						<h4 class="font-semibold">Share targets</h4>
						<div class="mt-3 space-y-2">
							<div class="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 text-sm">
								<span>Sales workspace</span>
								<span class="text-xs font-medium text-emerald-700 dark:text-emerald-300">Synced</span>
							</div>
							<div class="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 text-sm">
								<span>Success review</span>
								<span class="text-xs font-medium text-muted-fg">Digest</span>
							</div>
							<div class="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 text-sm">
								<span>Weekly export</span>
								<span class="text-xs font-medium text-warning">Needs auth</span>
							</div>
						</div>
					</section>
				</div>
			</aside>
		</div>
	</div>
</template>
