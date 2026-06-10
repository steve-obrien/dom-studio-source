<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomToggle } from '../../../lib/vue';

const environmentOptions = [
	{ label: 'Production', value: 'production' },
	{ label: 'Staging', value: 'staging' },
	{ label: 'Development', value: 'development' },
];

const flagViewTabs = [
	{ key: 'targeting', label: 'Targeting' },
	{ key: 'guardrails', label: 'Guardrails' },
	{ key: 'activity', label: 'Activity' },
];

const flags = [
	{
		id: 'wallet-checkout',
		key: 'checkout.wallet_express',
		name: 'Express wallet checkout',
		description: 'Offer Apple Pay and saved-wallet options before the full address step.',
		owner: 'Growth engineering',
		status: 'Monitoring',
		risk: 'Medium',
		rollout: 32,
		enabled: true,
		updated: '12 min ago',
		exposures: '12.8k',
		segments: ['Beta customers', 'EU workspaces'],
		exclusions: ['Enterprise contracts'],
		metrics: [
			{ label: 'Error rate', value: '0.18%', trend: 'Down 0.04%', tone: 'success' },
			{ label: 'P95 latency', value: '184 ms', trend: 'Stable', tone: 'neutral' },
			{ label: 'Checkout lift', value: '+4.7%', trend: 'Above target', tone: 'success' },
		],
		checks: [
			{ label: 'Support macro prepared', done: true },
			{ label: 'Rollback owner assigned', done: true },
			{ label: 'Enterprise accounts excluded', done: true },
			{ label: 'Payment failure alert linked', done: false },
		],
		activity: [
			{ actor: 'Maya Chen', action: 'Raised rollout from 20% to 32%', time: '12 min ago' },
			{ actor: 'Release bot', action: 'Guardrails passed for 2 hours', time: '42 min ago' },
			{ actor: 'Priya Shah', action: 'Added EU workspaces segment', time: 'Yesterday' },
		],
	},
	{
		id: 'team-invites',
		key: 'workspace.invite_approval',
		name: 'Invite approval flow',
		description: 'Require admins to approve external-domain invitations before users join.',
		owner: 'Admin platform',
		status: 'Draft',
		risk: 'Low',
		rollout: 0,
		enabled: false,
		updated: '1 hr ago',
		exposures: '0',
		segments: ['Internal workspaces'],
		exclusions: ['Starter plans'],
		metrics: [
			{ label: 'Approval success', value: 'Not live', trend: 'Waiting', tone: 'neutral' },
			{ label: 'Invite errors', value: '0', trend: 'No traffic', tone: 'neutral' },
			{ label: 'Admin adoption', value: '0%', trend: 'Not measured', tone: 'neutral' },
		],
		checks: [
			{ label: 'Policy copy approved', done: true },
			{ label: 'Owner transfer tested', done: false },
			{ label: 'Support article drafted', done: false },
			{ label: 'Audit event reviewed', done: true },
		],
		activity: [
			{ actor: 'Nora Patel', action: 'Created production flag draft', time: '1 hr ago' },
			{ actor: 'Sam Reed', action: 'Linked admin audit event', time: 'Yesterday' },
		],
	},
	{
		id: 'ai-summary',
		key: 'support.ai_summary',
		name: 'AI support summaries',
		description: 'Summarize long support conversations before agents write a reply.',
		owner: 'Support tooling',
		status: 'Live',
		risk: 'High',
		rollout: 78,
		enabled: true,
		updated: '4 min ago',
		exposures: '38.4k',
		segments: ['Support agents', 'English language'],
		exclusions: ['Healthcare customers'],
		metrics: [
			{ label: 'Escalation rate', value: '2.4%', trend: 'Down 0.8%', tone: 'success' },
			{ label: 'Summary edits', value: '18%', trend: 'Watch', tone: 'warning' },
			{ label: 'Avg handle time', value: '-1m 42s', trend: 'Improved', tone: 'success' },
		],
		checks: [
			{ label: 'PII redaction tested', done: true },
			{ label: 'Model fallback enabled', done: true },
			{ label: 'QA sample reviewed', done: false },
			{ label: 'Customer opt-out honored', done: true },
		],
		activity: [
			{ actor: 'Lee Morgan', action: 'Paused healthcare customer exposure', time: '4 min ago' },
			{ actor: 'Release bot', action: 'Edit-rate guardrail entered watch state', time: '25 min ago' },
			{ actor: 'Ava Singh', action: 'Raised rollout from 60% to 78%', time: 'Today' },
		],
	},
];

const selectedFlagId = ref(flags[0].id);
const selectedEnvironment = ref('production');
const activeTab = ref('targeting');
const rolloutDraft = ref(flags[0].rollout);
const enabledDraft = ref(flags[0].enabled);

const selectedFlag = computed(() => flags.find((flag) => flag.id === selectedFlagId.value) || flags[0]);
const selectedChecklist = computed(() => selectedFlag.value.checks);
const completedChecks = computed(() => selectedChecklist.value.filter((check) => check.done).length);
const readinessPercent = computed(() => Math.round((completedChecks.value / selectedChecklist.value.length) * 100));
const selectedMetric = computed(() => selectedFlag.value.metrics.find((metric) => metric.tone === 'warning') || selectedFlag.value.metrics[0]);
const summaryCards = computed(() => [
	{ label: 'Production flags', value: '18', detail: '7 active rollouts' },
	{ label: 'Current exposure', value: selectedFlag.value.exposures, detail: 'Matched users evaluated' },
	{ label: 'Readiness', value: `${readinessPercent.value}%`, detail: `${completedChecks.value} of ${selectedChecklist.value.length} checks complete` },
	{ label: selectedMetric.value.label, value: selectedMetric.value.value, detail: selectedMetric.value.trend },
]);
const rolloutLabel = computed(() => {
	if (!enabledDraft.value) return 'Paused';
	if (Number(rolloutDraft.value) === 100) return 'Everyone';
	if (Number(rolloutDraft.value) === 0) return 'No traffic';
	return `${rolloutDraft.value}% of matched traffic`;
});

function selectFlag(flag) {
	selectedFlagId.value = flag.id;
	rolloutDraft.value = flag.rollout;
	enabledDraft.value = flag.enabled;
	activeTab.value = 'targeting';
}

function statusClasses(status) {
	return {
		Live: 'bg-success/15 text-success',
		Monitoring: 'bg-primary/15 text-primary',
		Draft: 'bg-secondary text-muted-fg',
	}[status] || 'bg-secondary text-muted-fg';
}

function statusRailClasses(status) {
	return {
		Live: 'bg-success/80',
		Monitoring: 'bg-primary/70',
		Draft: 'bg-muted-fg/35',
	}[status] || 'bg-muted-fg/35';
}

function riskClasses(risk) {
	return {
		High: 'bg-destructive/15 text-destructive',
		Medium: 'bg-warning/15 text-warning',
		Low: 'bg-success/15 text-success',
	}[risk] || 'bg-secondary text-muted-fg';
}

function metricClasses(tone) {
	return {
		success: 'bg-success/15 text-success',
		warning: 'bg-warning/15 text-warning',
		neutral: 'bg-secondary text-muted-fg',
	}[tone] || 'bg-secondary text-muted-fg';
}

function metricTextClasses(tone) {
	return {
		success: 'text-success',
		warning: 'text-warning',
		neutral: 'text-muted-fg',
	}[tone] || 'text-muted-fg';
}
</script>

<template>
	<div class="min-h-screen w-full bg-background text-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col gap-5 p-3 sm:p-5 lg:p-6">
			<header class="overflow-hidden rounded-lg border border-border skin-raised shadow-lg shadow-black/5">
				<div class="h-1 bg-[linear-gradient(90deg,var(--success),var(--warning),var(--primary))]"></div>
				<div class="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Release operations</p>
						<h3 class="mt-1 text-2xl font-semibold tracking-tight">Feature flag console</h3>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
							Control rollout exposure, target the right customers, and watch release guardrails before opening a feature to everyone.
						</p>
					</div>
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
						<DomNativeSelect v-model="selectedEnvironment" :options="environmentOptions" class="sm:w-44" />
						<DomButton size="sm" variant="secondary">View audit log</DomButton>
						<DomButton size="sm">Create flag</DomButton>
					</div>
				</div>

				<div class="grid gap-px bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
					<div
						v-for="item in summaryCards"
						:key="item.label"
						class="bg-background/75 px-4 py-3"
					>
						<p class="text-xs text-muted-fg">{{ item.label }}</p>
						<p class="mt-1 text-2xl font-semibold tracking-tight">{{ item.value }}</p>
						<p class="mt-1 text-xs text-muted-fg">{{ item.detail }}</p>
					</div>
				</div>
			</header>

			<section class="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
				<aside class="overflow-hidden rounded-lg border border-border skin-raised shadow-sm">
					<div class="flex items-center justify-between gap-3 border-b border-border/80 p-4">
						<div>
							<h4 class="text-sm font-semibold">Flag inventory</h4>
							<p class="text-xs text-muted-fg">Select a flag to inspect rollout state.</p>
						</div>
						<span class="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-muted-fg">{{ selectedEnvironment }}</span>
					</div>

					<div class="grid gap-1 p-2">
						<button
							v-for="flag in flags"
							:key="flag.id"
							type="button"
							class="group rounded-md px-3 py-3 text-left transition hover:bg-muted/55"
							:class="flag.id === selectedFlag.id ? 'bg-primary/5 shadow-xs ring-1 ring-primary/15' : ''"
							@click="selectFlag(flag)"
						>
							<div class="flex gap-3">
								<span class="mt-1 h-10 w-1 shrink-0 rounded-full" :class="statusRailClasses(flag.status)"></span>
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-semibold">{{ flag.name }}</p>
											<p class="mt-1 truncate font-mono text-[11px] text-muted-fg">{{ flag.key }}</p>
										</div>
										<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClasses(flag.status)">
											{{ flag.status }}
										</span>
									</div>
									<p class="mt-3 line-clamp-2 text-xs leading-5 text-muted-fg">{{ flag.description }}</p>
									<div class="mt-3 flex items-center justify-between gap-3">
										<span class="text-xs text-muted-fg">{{ flag.rollout }}% rollout</span>
										<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="riskClasses(flag.risk)">
											{{ flag.risk }} risk
										</span>
									</div>
								</div>
							</div>
						</button>
					</div>
				</aside>

				<main class="grid gap-4">
					<section class="overflow-hidden rounded-lg border border-border skin-raised shadow-sm">
						<div class="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
							<div class="p-4 sm:p-5">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(selectedFlag.status)">
										{{ selectedFlag.status }}
									</span>
									<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="riskClasses(selectedFlag.risk)">
										{{ selectedFlag.risk }} risk
									</span>
									<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">{{ selectedFlag.owner }}</span>
								</div>
								<h4 class="mt-3 text-xl font-semibold tracking-tight">{{ selectedFlag.name }}</h4>
								<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ selectedFlag.description }}</p>
								<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-fg">
									<span class="font-mono">{{ selectedFlag.key }}</span>
									<span>Updated {{ selectedFlag.updated }}</span>
								</div>
								<div class="mt-5 grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-3">
									<div
										v-for="metric in selectedFlag.metrics"
										:key="metric.label"
									>
										<p class="text-xs text-muted-fg">{{ metric.label }}</p>
										<p class="mt-1 text-lg font-semibold tracking-tight">{{ metric.value }}</p>
										<p class="mt-1 text-[11px] font-medium" :class="metricTextClasses(metric.tone)">
											{{ metric.trend }}
										</p>
									</div>
								</div>
							</div>

							<div class="border-t border-border/80 bg-muted/25 p-4 lg:border-l lg:border-t-0">
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-sm font-semibold">Flag enabled</p>
										<p class="mt-1 text-xs leading-5 text-muted-fg">Pause traffic instantly without deleting rules.</p>
									</div>
									<DomToggle v-model="enabledDraft" aria-label="Toggle flag enabled state" />
								</div>
								<div class="mt-4">
									<div class="flex items-center justify-between gap-3 text-sm">
										<span class="font-medium">Rollout</span>
										<span class="text-muted-fg">{{ rolloutLabel }}</span>
									</div>
									<input
										v-model="rolloutDraft"
										type="range"
										min="0"
										max="100"
										step="1"
										class="mt-3 h-2 w-full accent-primary"
										aria-label="Rollout percentage"
									/>
									<div class="mt-2 flex justify-between text-[11px] text-muted-fg">
										<span>0%</span>
										<span>50%</span>
										<span>100%</span>
									</div>
								</div>
								<DomButton class="mt-4 w-full" :variant="enabledDraft ? 'primary' : 'secondary'">
									{{ enabledDraft ? 'Schedule rollout change' : 'Save paused state' }}
								</DomButton>
							</div>
						</div>
					</section>

					<section class="rounded-lg border border-border skin-raised p-4 shadow-sm sm:p-5">
						<DomTabs v-model="activeTab" :tabs="flagViewTabs" aria-label="Flag detail view">
							<template #targeting>
								<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
									<div class="grid gap-4">
										<div class="rounded-md bg-muted/35 p-4">
											<div class="flex items-start justify-between gap-3">
												<div>
													<h5 class="text-sm font-semibold">Included segments</h5>
													<p class="mt-1 text-xs leading-5 text-muted-fg">Traffic must match at least one segment and all rule conditions.</p>
												</div>
												<DomButton size="sm" variant="secondary">Edit rules</DomButton>
											</div>
											<div class="mt-4 flex flex-wrap gap-2">
												<span
													v-for="segment in selectedFlag.segments"
													:key="segment"
													class="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"
												>
													{{ segment }}
												</span>
											</div>
										</div>

										<div class="rounded-md bg-muted/35 p-4">
											<h5 class="text-sm font-semibold">Excluded audiences</h5>
											<p class="mt-1 text-xs leading-5 text-muted-fg">Use exclusions for contracts, regions, cohorts, or accounts that require manual launch.</p>
											<div class="mt-4 flex flex-wrap gap-2">
												<span
													v-for="segment in selectedFlag.exclusions"
													:key="segment"
													class="rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive"
												>
													{{ segment }}
												</span>
											</div>
										</div>
									</div>

									<div class="rounded-md bg-muted/35 p-4">
										<h5 class="text-sm font-semibold">Launch checklist</h5>
										<div class="mt-4 divide-y divide-border/70 overflow-hidden rounded-md bg-background/75 ring-1 ring-border/70">
											<label
												v-for="check in selectedChecklist"
												:key="check.label"
												class="flex items-start gap-3 px-3 py-3 text-sm transition hover:bg-muted/45"
											>
												<input
													type="checkbox"
													:checked="check.done"
													class="mt-1 size-4 accent-primary"
													readonly
												/>
												<span>
													<span class="font-medium">{{ check.label }}</span>
													<span class="block text-xs text-muted-fg">{{ check.done ? 'Complete' : 'Required before full launch' }}</span>
												</span>
											</label>
										</div>
									</div>
								</div>
							</template>

							<template #guardrails>
								<div class="grid gap-4 md:grid-cols-3">
									<div
										v-for="metric in selectedFlag.metrics"
										:key="metric.label"
										class="rounded-md bg-muted/35 p-4 ring-1 ring-border/70"
									>
										<div class="flex items-start justify-between gap-3">
											<p class="text-sm font-semibold">{{ metric.label }}</p>
											<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="metricClasses(metric.tone)">
												{{ metric.trend }}
											</span>
										</div>
										<p class="mt-4 text-3xl font-semibold tracking-tight">{{ metric.value }}</p>
										<p class="mt-2 text-xs leading-5 text-muted-fg">Compare against baseline before increasing rollout.</p>
									</div>
								</div>
							</template>

							<template #activity>
								<div class="rounded-md bg-muted/35 p-4">
									<div
										v-for="item in selectedFlag.activity"
										:key="`${item.actor}-${item.action}`"
										class="relative border-l border-border pb-4 pl-5 text-sm last:pb-0"
									>
										<span class="absolute -left-[5px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background"></span>
										<div class="flex flex-wrap items-baseline justify-between gap-2">
											<span class="font-medium">{{ item.actor }}</span>
											<span class="text-xs text-muted-fg">{{ item.time }}</span>
										</div>
										<p class="mt-1 text-muted-fg">{{ item.action }}</p>
									</div>
								</div>
							</template>
						</DomTabs>
					</section>
				</main>
			</section>
		</div>
	</div>
</template>
