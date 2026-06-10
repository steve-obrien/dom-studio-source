<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCard, DomNativeSelect, DomTabs, DomToggleButtonGroup } from '../../../lib/vue';

const sprintOptions = [
	{ label: 'Sprint 24', value: 'sprint-24' },
	{ label: 'Sprint 25', value: 'sprint-25' },
	{ label: 'Release hardening', value: 'release-hardening' },
];

const teamOptions = [
	{ label: 'Core team', value: 'core' },
	{ label: 'Growth', value: 'growth' },
	{ label: 'Platform', value: 'platform' },
];

const viewOptions = [
	{ label: 'Board', value: 'board' },
	{ label: 'Risk', value: 'risk' },
];

const lanes = [
	{ key: 'backlog', label: 'Backlog', description: 'Needs decision' },
	{ key: 'ready', label: 'Ready', description: 'Scoped for sprint' },
	{ key: 'active', label: 'In progress', description: 'Being built' },
	{ key: 'review', label: 'Review', description: 'Needs validation' },
];

const sprintIssues = [
	{
		id: 'APP-148',
		title: 'Add workspace invite approval rules',
		lane: 'ready',
		priority: 'High',
		type: 'Feature',
		owner: 'Priya',
		estimate: 5,
		due: 'Jun 14',
		confidence: 82,
		blockers: ['Security review'],
		tags: ['Admin', 'Growth'],
		description: 'Let admins require approval before new domains join a workspace.',
	},
	{
		id: 'APP-152',
		title: 'Improve mobile billing receipt layout',
		lane: 'backlog',
		priority: 'Medium',
		type: 'UX',
		owner: 'Maya',
		estimate: 3,
		due: 'Jun 17',
		confidence: 74,
		blockers: [],
		tags: ['Billing', 'Mobile'],
		description: 'Make payment history and tax details easier to scan on narrow screens.',
	},
	{
		id: 'APP-157',
		title: 'Ship saved replies for support macros',
		lane: 'active',
		priority: 'High',
		type: 'Feature',
		owner: 'Sam',
		estimate: 8,
		due: 'Jun 13',
		confidence: 68,
		blockers: ['Migration review', 'Copy approval'],
		tags: ['Support', 'Automation'],
		description: 'Allow support teams to create, share, and apply reusable customer replies.',
	},
	{
		id: 'APP-160',
		title: 'Add usage alert threshold settings',
		lane: 'ready',
		priority: 'Low',
		type: 'Enhancement',
		owner: 'Jon',
		estimate: 2,
		due: 'Jun 18',
		confidence: 91,
		blockers: [],
		tags: ['Settings', 'Billing'],
		description: 'Notify account owners before they cross plan or seat limits.',
	},
	{
		id: 'APP-166',
		title: 'Review release checklist empty states',
		lane: 'review',
		priority: 'Medium',
		type: 'QA',
		owner: 'Lee',
		estimate: 2,
		due: 'Jun 12',
		confidence: 88,
		blockers: [],
		tags: ['Release', 'QA'],
		description: 'Verify that release checklist states are helpful when teams have no blockers.',
	},
	{
		id: 'APP-171',
		title: 'Backfill activity timeline events',
		lane: 'active',
		priority: 'Urgent',
		type: 'Bug',
		owner: 'Nora',
		estimate: 5,
		due: 'Jun 11',
		confidence: 54,
		blockers: ['Data export'],
		tags: ['Activity', 'Data'],
		description: 'Restore missing audit events for imports created before the new timeline schema.',
	},
];

const selectedSprint = ref('sprint-24');
const selectedTeam = ref('core');
const activeView = ref('board');
const activeLane = ref('ready');
const selectedIssueId = ref('APP-148');

const selectedIssue = computed(() => sprintIssues.find((issue) => issue.id === selectedIssueId.value) || sprintIssues[0]);
const selectedLane = computed(() => lanes.find((lane) => lane.key === activeLane.value) || lanes[0]);
const totalEstimate = computed(() => sprintIssues.reduce((total, issue) => total + issue.estimate, 0));
const blockedIssues = computed(() => sprintIssues.filter((issue) => issue.blockers.length));
const reviewIssues = computed(() => sprintIssues.filter((issue) => issue.lane === 'review'));
const laneTabs = computed(() => lanes.map((lane) => ({
	key: lane.key,
	label: `${lane.label} (${issuesForLane(lane.key).length})`,
})));

function issuesForLane(laneKey) {
	return sprintIssues.filter((issue) => issue.lane === laneKey);
}

function laneEstimate(laneKey) {
	return issuesForLane(laneKey).reduce((total, issue) => total + issue.estimate, 0);
}

function selectIssue(issue) {
	selectedIssueId.value = issue.id;
	activeLane.value = issue.lane;
}

function priorityClasses(priority) {
	return {
		Urgent: 'bg-destructive/15 text-destructive',
		High: 'bg-warning/15 text-warning',
		Medium: 'bg-primary/15 text-primary',
		Low: 'bg-secondary text-muted-fg',
	}[priority] || 'bg-secondary text-muted-fg';
}

function confidenceClasses(confidence) {
	if (confidence < 60) return 'bg-destructive';
	if (confidence < 75) return 'bg-warning';
	return 'bg-primary';
}
</script>

<template>
	<div class="min-h-screen w-full bg-background text-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 sm:p-4 lg:p-6">
			<header class="rounded-2xl border border-border skin-raised p-4 shadow-xl shadow-black/5">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Product planning</p>
						<h3 class="mt-1 text-2xl font-semibold tracking-tight">Sprint scope board</h3>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
							Prioritize the next sprint, balance capacity, and spot delivery risk before work starts.
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<DomNativeSelect v-model="selectedSprint" :options="sprintOptions" class="w-44" />
						<DomNativeSelect v-model="selectedTeam" :options="teamOptions" class="w-36" />
						<DomButton size="sm">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							</svg>
							Add issue
						</DomButton>
					</div>
				</div>

				<div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div class="rounded-xl border border-border bg-background p-3">
						<p class="text-xs text-muted-fg">Planned effort</p>
						<p class="mt-1 text-2xl font-semibold">{{ totalEstimate }} pts</p>
						<p class="mt-1 text-xs text-muted-fg">24 point team capacity</p>
					</div>
					<div class="rounded-xl border border-border bg-background p-3">
						<p class="text-xs text-muted-fg">Release blockers</p>
						<p class="mt-1 text-2xl font-semibold">{{ blockedIssues.length }}</p>
						<p class="mt-1 text-xs text-muted-fg">Resolve before sprint close</p>
					</div>
					<div class="rounded-xl border border-border bg-background p-3">
						<p class="text-xs text-muted-fg">Ready for QA</p>
						<p class="mt-1 text-2xl font-semibold">{{ reviewIssues.length }}</p>
						<p class="mt-1 text-xs text-muted-fg">Waiting on validation</p>
					</div>
					<div class="rounded-xl border border-border bg-background p-3">
						<p class="text-xs text-muted-fg">Scope health</p>
						<p class="mt-1 text-2xl font-semibold">92%</p>
						<p class="mt-1 text-xs text-muted-fg">Based on estimate confidence</p>
					</div>
				</div>
			</header>

			<div class="flex flex-wrap items-center justify-between gap-3">
				<DomToggleButtonGroup v-model="activeView" :options="viewOptions" aria-label="Planning view" />
				<div class="flex flex-wrap gap-2 text-xs text-muted-fg">
					<span class="rounded-full border border-border bg-background px-2.5 py-1">6 issues</span>
					<span class="rounded-full border border-border bg-background px-2.5 py-1">3 owners</span>
					<span class="rounded-full border border-border bg-background px-2.5 py-1">Next release: Jun 20</span>
				</div>
			</div>

			<section v-if="activeView === 'board'" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<div class="hidden gap-3 lg:grid lg:grid-cols-4">
					<section
						v-for="lane in lanes"
						:key="lane.key"
						class="min-w-0 rounded-2xl border border-border skin-raised p-3"
					>
						<div class="mb-3 flex items-start justify-between gap-3">
							<div>
								<h4 class="text-sm font-semibold">{{ lane.label }}</h4>
								<p class="text-xs text-muted-fg">{{ lane.description }}</p>
							</div>
							<span class="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-muted-fg">
								{{ laneEstimate(lane.key) }} pts
							</span>
						</div>

						<div class="space-y-3">
							<button
								v-for="issue in issuesForLane(lane.key)"
								:key="issue.id"
								type="button"
								class="w-full rounded-xl border bg-background p-3 text-left transition hover:border-primary/40 hover:shadow-md"
								:class="issue.id === selectedIssue.id ? 'border-primary/60 ring-2 ring-primary/10' : 'border-border'"
								@click="selectIssue(issue)"
							>
								<div class="flex items-start justify-between gap-2">
									<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ issue.id }}</span>
									<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="priorityClasses(issue.priority)">
										{{ issue.priority }}
									</span>
								</div>
								<p class="mt-3 text-sm font-semibold leading-5">{{ issue.title }}</p>
								<p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-fg">{{ issue.description }}</p>
								<div class="mt-3 flex flex-wrap gap-1">
									<span
										v-for="tag in issue.tags"
										:key="`${issue.id}-${tag}`"
										class="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-fg"
									>
										{{ tag }}
									</span>
								</div>
								<div class="mt-3 flex items-center justify-between text-xs text-muted-fg">
									<span>{{ issue.owner }}</span>
									<span>{{ issue.estimate }} pts / {{ issue.due }}</span>
								</div>
							</button>
						</div>
					</section>
				</div>

				<div class="lg:hidden">
					<DomTabs v-model="activeLane" :tabs="laneTabs">
						<template
							v-for="lane in lanes"
							:key="lane.key"
							#[lane.key]
						>
							<div class="space-y-3 rounded-2xl border border-border skin-raised p-3">
								<div class="flex items-start justify-between gap-3">
									<div>
										<h4 class="text-sm font-semibold">{{ selectedLane.label }}</h4>
										<p class="text-xs text-muted-fg">{{ selectedLane.description }}</p>
									</div>
									<span class="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-muted-fg">
										{{ laneEstimate(lane.key) }} pts
									</span>
								</div>
								<button
									v-for="issue in issuesForLane(lane.key)"
									:key="issue.id"
									type="button"
									class="w-full rounded-xl border bg-background p-3 text-left transition hover:border-primary/40"
									:class="issue.id === selectedIssue.id ? 'border-primary/60 ring-2 ring-primary/10' : 'border-border'"
									@click="selectIssue(issue)"
								>
									<div class="flex items-start justify-between gap-2">
										<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ issue.id }}</span>
										<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="priorityClasses(issue.priority)">
											{{ issue.priority }}
										</span>
									</div>
									<p class="mt-3 text-sm font-semibold leading-5">{{ issue.title }}</p>
									<p class="mt-2 text-xs leading-5 text-muted-fg">{{ issue.description }}</p>
								</button>
							</div>
						</template>
					</DomTabs>
				</div>

				<aside class="space-y-3">
					<DomCard padding="sm">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">{{ selectedIssue.id }}</p>
								<h4 class="mt-2 text-lg font-semibold leading-6">{{ selectedIssue.title }}</h4>
							</div>
							<span class="rounded-full px-2 py-1 text-xs font-semibold" :class="priorityClasses(selectedIssue.priority)">
								{{ selectedIssue.priority }}
							</span>
						</div>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedIssue.description }}</p>
						<dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
							<div>
								<dt class="text-xs text-muted-fg">Owner</dt>
								<dd class="font-semibold">{{ selectedIssue.owner }}</dd>
							</div>
							<div>
								<dt class="text-xs text-muted-fg">Estimate</dt>
								<dd class="font-semibold">{{ selectedIssue.estimate }} points</dd>
							</div>
							<div>
								<dt class="text-xs text-muted-fg">Type</dt>
								<dd class="font-semibold">{{ selectedIssue.type }}</dd>
							</div>
							<div>
								<dt class="text-xs text-muted-fg">Due</dt>
								<dd class="font-semibold">{{ selectedIssue.due }}</dd>
							</div>
						</dl>
						<div class="mt-4">
							<div class="flex items-center justify-between text-xs text-muted-fg">
								<span>Confidence</span>
								<span>{{ selectedIssue.confidence }}%</span>
							</div>
							<div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
								<div
									class="h-full rounded-full"
									:class="confidenceClasses(selectedIssue.confidence)"
									:style="{ width: `${selectedIssue.confidence}%` }"
								></div>
							</div>
						</div>
					</DomCard>

					<DomCard padding="sm">
						<h5 class="text-sm font-semibold">Planning checklist</h5>
						<div class="mt-3 space-y-2">
							<label class="flex items-start gap-2 text-sm text-muted-fg">
								<input type="checkbox" checked class="mt-1 size-4 rounded border-input accent-current" />
								<span>Acceptance criteria written</span>
							</label>
							<label class="flex items-start gap-2 text-sm text-muted-fg">
								<input type="checkbox" :checked="!selectedIssue.blockers.length" class="mt-1 size-4 rounded border-input accent-current" />
								<span>No open blockers</span>
							</label>
							<label class="flex items-start gap-2 text-sm text-muted-fg">
								<input type="checkbox" checked class="mt-1 size-4 rounded border-input accent-current" />
								<span>Owner and estimate assigned</span>
							</label>
						</div>
						<div v-if="selectedIssue.blockers.length" class="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3">
							<p class="text-xs font-semibold text-warning">Blocked by</p>
							<ul class="mt-2 space-y-1 text-sm text-muted-fg">
								<li v-for="blocker in selectedIssue.blockers" :key="blocker">{{ blocker }}</li>
							</ul>
						</div>
						<div class="mt-4 flex flex-wrap gap-2">
							<DomButton size="sm">Move to sprint</DomButton>
							<DomButton variant="secondary" size="sm">Edit issue</DomButton>
						</div>
					</DomCard>
				</aside>
			</section>

			<section v-else class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<DomCard>
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="text-lg font-semibold">Risk review</h4>
							<p class="mt-1 text-sm text-muted-fg">Focus the planning meeting on blockers, low-confidence estimates, and near-due work.</p>
						</div>
						<DomButton variant="secondary" size="sm">Export notes</DomButton>
					</div>
					<div class="mt-4 divide-y divide-border">
						<div
							v-for="issue in blockedIssues"
							:key="`risk-${issue.id}`"
							class="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
						>
							<div>
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ issue.id }}</span>
									<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="priorityClasses(issue.priority)">
										{{ issue.priority }}
									</span>
								</div>
								<p class="mt-2 text-sm font-semibold">{{ issue.title }}</p>
								<p class="mt-1 text-sm text-muted-fg">{{ issue.blockers.join(', ') }}</p>
							</div>
							<DomButton variant="secondary" size="sm" @click="selectIssue(issue)">Review</DomButton>
						</div>
					</div>
				</DomCard>

				<DomCard padding="sm">
					<h5 class="text-sm font-semibold">Meeting agenda</h5>
					<ol class="mt-3 space-y-3 text-sm leading-6 text-muted-fg">
						<li>1. Confirm sprint goal and capacity.</li>
						<li>2. Remove or split issues over 5 points.</li>
						<li>3. Assign owners for every blocker.</li>
						<li>4. Lock scope and publish release notes draft.</li>
					</ol>
				</DomCard>
			</section>
		</div>
	</div>
</template>
