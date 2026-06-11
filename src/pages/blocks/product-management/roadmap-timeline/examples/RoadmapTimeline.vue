<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomToggle } from '@getdom/studio/vue';

const horizons = [
	{
		id: 'h1-2026',
		label: 'H1 2026',
		quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
		summary: 'Quarterly operating roadmap',
	},
	{
		id: 'fy-2026',
		label: 'FY 2026',
		quarters: ['Now', 'Next', 'Later', 'Parking lot'],
		summary: 'Executive planning view',
	},
	{
		id: 'customer-facing',
		label: 'Customer view',
		quarters: ['Soon', 'Planned', 'Exploring', 'Shipped'],
		summary: 'Sanitized roadmap portal',
	},
];

const lanes = [
	{ id: 'acquisition', label: 'Acquisition', goal: 'Improve qualified pipeline', color: 'bg-sky-500' },
	{ id: 'activation', label: 'Activation', goal: 'Shorten time to value', color: 'bg-emerald-500' },
	{ id: 'retention', label: 'Retention', goal: 'Increase expansion readiness', color: 'bg-violet-500' },
	{ id: 'platform', label: 'Platform', goal: 'Reduce operating risk', color: 'bg-amber-500' },
];

const initiatives = [
	{
		id: 'initiative_site_personalization',
		title: 'Website personalization',
		laneId: 'acquisition',
		start: 1,
		span: 2,
		status: 'Discovery',
		owner: 'Ari Patel',
		confidence: 62,
		impact: 'High',
		customers: 18,
		revenue: '$84k',
		theme: 'bg-sky-500',
		brief: 'Route visitors into tailored product tours based on firmographic and intent signals.',
		dependencies: ['CRM enrichment', 'Consent banner'],
		milestones: [
			{ label: 'Analytics baseline approved', complete: true },
			{ label: 'Experiment copy signed off', complete: false },
			{ label: 'Privacy review complete', complete: false },
		],
	},
	{
		id: 'initiative_ai_inbox',
		title: 'AI inbox summaries',
		laneId: 'activation',
		start: 2,
		span: 2,
		status: 'Build',
		owner: 'Maya Chen',
		confidence: 78,
		impact: 'High',
		customers: 36,
		revenue: '$128k',
		theme: 'bg-emerald-500',
		brief: 'Summarize long customer threads into next steps, blockers, and suggested owners.',
		dependencies: ['Event stream API'],
		milestones: [
			{ label: 'Prompt eval set ready', complete: true },
			{ label: 'Beta cohort selected', complete: true },
			{ label: 'Admin audit controls', complete: false },
		],
	},
	{
		id: 'initiative_customer_health',
		title: 'Customer health score v2',
		laneId: 'retention',
		start: 1,
		span: 3,
		status: 'Committed',
		owner: 'Nina Patel',
		confidence: 84,
		impact: 'Critical',
		customers: 54,
		revenue: '$310k',
		theme: 'bg-violet-500',
		brief: 'Combine usage, support risk, renewal date, and champion activity into one explainable score.',
		dependencies: ['Usage warehouse', 'CRM sync'],
		milestones: [
			{ label: 'Model fields mapped', complete: true },
			{ label: 'Success playbooks drafted', complete: true },
			{ label: 'Renewal alerts validated', complete: false },
		],
	},
	{
		id: 'initiative_event_stream',
		title: 'Event stream API',
		laneId: 'platform',
		start: 2,
		span: 1,
		status: 'At risk',
		owner: 'Omar Reid',
		confidence: 46,
		impact: 'Critical',
		customers: 22,
		revenue: '$176k',
		theme: 'bg-amber-500',
		brief: 'Publish normalized product events for automation, data export, and AI assistant features.',
		dependencies: ['Schema governance'],
		milestones: [
			{ label: 'Event catalog reviewed', complete: true },
			{ label: 'Throughput test passed', complete: false },
			{ label: 'Webhook parity confirmed', complete: false },
		],
	},
	{
		id: 'initiative_admin_roles',
		title: 'Granular admin roles',
		laneId: 'platform',
		start: 3,
		span: 2,
		status: 'Planned',
		owner: 'Bea Morgan',
		confidence: 69,
		impact: 'Medium',
		customers: 29,
		revenue: '$96k',
		theme: 'bg-rose-500',
		brief: 'Give enterprise admins scoped permissions for finance, support, security, and contractors.',
		dependencies: ['Policy engine'],
		milestones: [
			{ label: 'Permission matrix accepted', complete: true },
			{ label: 'Audit export compatibility', complete: false },
			{ label: 'SCIM role mapping', complete: false },
		],
	},
];

const updates = [
	{ label: 'Event stream moved to at risk', actor: 'Omar Reid', time: 'Today 11:24' },
	{ label: 'Customer health score gained executive sponsor', actor: 'Nina Patel', time: 'Yesterday' },
	{ label: 'AI inbox beta cohort increased to 12 accounts', actor: 'Maya Chen', time: 'Jun 10' },
	{ label: 'Admin roles dependency added for audit exports', actor: 'Bea Morgan', time: 'Jun 9' },
];

const statusOptions = ['Discovery', 'Planned', 'Build', 'Committed', 'At risk', 'Shipped'];
const ownerOptions = ['Ari Patel', 'Maya Chen', 'Nina Patel', 'Omar Reid', 'Bea Morgan'];
const tabs = [
	{ key: 'roadmap', label: 'Roadmap' },
	{ key: 'risks', label: 'Risks' },
	{ key: 'updates', label: 'Updates' },
];

const activeHorizon = ref(horizons[0].id);
const activeTab = ref('roadmap');
const selectedInitiativeId = ref('initiative_ai_inbox');
const selectedStatus = ref('Build');
const selectedOwner = ref('Maya Chen');
const showDependencies = ref(true);
const notifyStakeholders = ref(true);

const selectedHorizon = computed(() => horizons.find((horizon) => horizon.id === activeHorizon.value) || horizons[0]);
const selectedInitiative = computed(() => initiatives.find((initiative) => initiative.id === selectedInitiativeId.value) || initiatives[0]);
const selectedLane = computed(() => lanes.find((lane) => lane.id === selectedInitiative.value.laneId));
const riskItems = computed(() => initiatives.filter((initiative) => initiative.status === 'At risk' || initiative.confidence < 70));
const committedCount = computed(() => initiatives.filter((initiative) => ['Build', 'Committed'].includes(statusFor(initiative))).length);
const customerSignalCount = computed(() => initiatives.reduce((total, initiative) => total + initiative.customers, 0));
const averageConfidence = computed(() => Math.round(initiatives.reduce((total, initiative) => total + confidenceFor(initiative), 0) / initiatives.length));
const launchReadiness = computed(() => {
	let score = selectedInitiative.value.confidence;
	if (selectedStatus.value === 'Committed') score += 8;
	if (selectedStatus.value === 'At risk') score -= 18;
	if (notifyStakeholders.value) score += 4;
	if (showDependencies.value && selectedInitiative.value.dependencies.length) score -= 6;
	return Math.max(10, Math.min(score, 100));
});

watch(selectedInitiative, (initiative) => {
	selectedStatus.value = initiative.status;
	selectedOwner.value = initiative.owner;
}, { immediate: true });

function initiativesForLane(laneId) {
	return initiatives.filter((initiative) => initiative.laneId === laneId);
}

function selectInitiative(initiative) {
	selectedInitiativeId.value = initiative.id;
}

function statusFor(initiative) {
	return initiative.id === selectedInitiativeId.value ? selectedStatus.value : initiative.status;
}

function confidenceFor(initiative) {
	if (initiative.id !== selectedInitiativeId.value) return initiative.confidence;
	if (selectedStatus.value === 'Committed') return Math.min(100, initiative.confidence + 6);
	if (selectedStatus.value === 'At risk') return Math.max(10, initiative.confidence - 18);
	return initiative.confidence;
}

function initiativeStyle(initiative) {
	return {
		gridColumn: `${initiative.start} / span ${initiative.span}`,
	};
}

function statusClass(status) {
	if (status === 'Committed' || status === 'Shipped') return 'bg-success/15 text-success';
	if (status === 'Build') return 'bg-primary/15 text-primary';
	if (status === 'At risk') return 'bg-destructive/15 text-destructive';
	if (status === 'Discovery') return 'bg-warning/15 text-warning';
	return 'bg-secondary text-muted-fg';
}

function confidenceClass(score) {
	if (score >= 80) return 'bg-success';
	if (score >= 60) return 'bg-primary';
	if (score >= 45) return 'bg-warning';
	return 'bg-destructive';
}
</script>

<template>
	<section class="min-h-screen bg-background text-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col border-x border-border bg-background shadow-2xl shadow-black/10">
			<header class="border-b border-border px-4 py-4 sm:px-6">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Product roadmap</p>
						<h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Roadmap timeline</h1>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedHorizon.summary }} for product, customer-facing, and executive planning conversations.</p>
					</div>
					<div class="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto]">
						<DomNativeSelect v-model="activeHorizon" :options="horizons.map((horizon) => ({ label: horizon.label, value: horizon.id }))" aria-label="Roadmap horizon" />
						<DomButton>
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
							</svg>
							Add initiative
						</DomButton>
					</div>
				</div>

				<div class="mt-5 grid gap-3 sm:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised px-4 py-3">
						<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Committed work</p>
						<p class="mt-2 text-2xl font-semibold">{{ committedCount }}</p>
					</div>
					<div class="rounded-lg border border-border skin-raised px-4 py-3">
						<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Customer signals</p>
						<p class="mt-2 text-2xl font-semibold">{{ customerSignalCount }}</p>
					</div>
					<div class="rounded-lg border border-border skin-raised px-4 py-3">
						<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Avg confidence</p>
						<p class="mt-2 text-2xl font-semibold">{{ averageConfidence }}%</p>
					</div>
				</div>
			</header>

			<main class="min-w-0">
					<div class="border-b border-border px-4 py-4 sm:px-6">
						<label class="flex max-w-xs items-center justify-between gap-3 rounded-full border border-border bg-background px-3 py-2 text-sm">
							<span class="text-muted-fg">Dependency layer</span>
							<DomToggle v-model="showDependencies" aria-label="Show dependencies" />
						</label>
					</div>

					<div class="border-b border-border p-4 sm:p-6">
						<DomTabs v-model="activeTab" :tabs="tabs">
							<template #roadmap>
								<div class="overflow-x-auto">
									<div class="min-w-[58rem]">
										<div class="grid grid-cols-[11rem_repeat(4,minmax(10rem,1fr))] border-b border-border text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">
											<div class="pb-3">Outcome lane</div>
											<div v-for="quarter in selectedHorizon.quarters" :key="quarter" class="border-l border-border px-3 pb-3">{{ quarter }}</div>
										</div>

										<div v-for="lane in lanes" :key="lane.id" class="grid grid-cols-[11rem_repeat(4,minmax(10rem,1fr))] border-b border-border last:border-b-0">
											<div class="py-5 pr-4">
												<div class="flex items-center gap-2">
													<span class="size-2.5 rounded-full" :class="lane.color"></span>
													<h2 class="text-sm font-semibold">{{ lane.label }}</h2>
												</div>
												<p class="mt-2 text-xs leading-5 text-muted-fg">{{ lane.goal }}</p>
											</div>
											<div class="col-span-4 grid grid-cols-4 gap-3 border-l border-border px-3 py-4">
												<button
													v-for="initiative in initiativesForLane(lane.id)"
													:key="initiative.id"
													type="button"
													class="min-h-[8.5rem] rounded-lg border p-3 text-left transition hover:border-primary/50 hover:shadow-md"
													:class="selectedInitiativeId === initiative.id ? 'border-primary/60 bg-primary/5 shadow-md' : 'border-border bg-background'"
													:style="initiativeStyle(initiative)"
													@click="selectInitiative(initiative)"
												>
													<span class="flex items-start justify-between gap-2">
														<span class="min-w-0">
															<span class="block truncate text-sm font-semibold">{{ initiative.title }}</span>
															<span class="mt-1 block text-xs text-muted-fg">{{ initiative.owner }}</span>
														</span>
														<span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(statusFor(initiative))">{{ statusFor(initiative) }}</span>
													</span>
													<span class="mt-4 block h-1.5 overflow-hidden rounded-full bg-secondary">
														<span class="block h-full rounded-full" :class="confidenceClass(confidenceFor(initiative))" :style="{ width: `${confidenceFor(initiative)}%` }"></span>
													</span>
													<span class="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-fg">
														<span>{{ initiative.impact }}</span>
														<span>{{ initiative.customers }} accts</span>
														<span>{{ confidenceFor(initiative) }}%</span>
													</span>
													<span v-if="showDependencies && initiative.dependencies.length" class="mt-3 block rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning">{{ initiative.dependencies.length }} dependency</span>
												</button>
											</div>
										</div>
									</div>
								</div>
							</template>

							<template #risks>
								<div class="grid gap-3 md:grid-cols-2">
									<button
										v-for="initiative in riskItems"
										:key="initiative.id"
										type="button"
										class="rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/50"
										@click="selectInitiative(initiative)"
									>
										<div class="flex items-start justify-between gap-3">
											<div>
												<p class="font-semibold">{{ initiative.title }}</p>
												<p class="mt-1 text-sm text-muted-fg">{{ initiative.brief }}</p>
											</div>
											<span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClass(statusFor(initiative))">{{ statusFor(initiative) }}</span>
										</div>
										<div class="mt-4 flex items-center justify-between text-sm">
											<span class="text-muted-fg">{{ initiative.dependencies.join(', ') || 'No dependency' }}</span>
											<span class="font-semibold">{{ confidenceFor(initiative) }}%</span>
										</div>
									</button>
								</div>
							</template>

							<template #updates>
								<div class="grid gap-3 md:grid-cols-4">
									<div v-for="event in updates" :key="`${event.label}-${event.time}`" class="rounded-lg border border-border skin-raised p-4">
										<p class="text-sm font-semibold">{{ event.label }}</p>
										<p class="mt-2 text-xs text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
									</div>
								</div>
							</template>
						</DomTabs>
					</div>

				<section class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
					<div class="p-4 sm:p-6">
						<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="size-2.5 rounded-full" :class="selectedInitiative.theme"></span>
									<p class="text-sm font-semibold text-muted-fg">{{ selectedLane?.label }}</p>
									<span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClass(selectedStatus)">{{ selectedStatus }}</span>
								</div>
								<h2 class="mt-2 text-xl font-semibold tracking-tight">{{ selectedInitiative.title }}</h2>
								<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedInitiative.brief }}</p>
							</div>
							<div class="grid grid-cols-3 gap-2 text-center text-sm md:min-w-[18rem]">
								<div class="rounded-lg border border-border px-3 py-2">
									<p class="text-xs text-muted-fg">Impact</p>
									<p class="mt-1 font-semibold">{{ selectedInitiative.impact }}</p>
								</div>
								<div class="rounded-lg border border-border px-3 py-2">
									<p class="text-xs text-muted-fg">Accounts</p>
									<p class="mt-1 font-semibold">{{ selectedInitiative.customers }}</p>
								</div>
								<div class="rounded-lg border border-border px-3 py-2">
									<p class="text-xs text-muted-fg">ARR</p>
									<p class="mt-1 font-semibold">{{ selectedInitiative.revenue }}</p>
								</div>
							</div>
						</div>

						<div class="mt-6 grid gap-3 md:grid-cols-3">
							<div v-for="milestone in selectedInitiative.milestones" :key="milestone.label" class="rounded-lg border border-border p-4">
								<div class="flex items-start gap-3">
										<span class="mt-0.5 flex size-5 items-center justify-center rounded-full border text-xs font-semibold" :class="milestone.complete ? 'border-success bg-success text-success-fg' : 'border-border text-muted-fg'">
											<svg v-if="milestone.complete" class="size-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
												<path d="M6 12.5l4 4L18 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
									</span>
									<div>
										<p class="text-sm font-medium">{{ milestone.label }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ milestone.complete ? 'Complete' : 'Needs owner update' }}</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<aside class="border-t border-border skin-raised p-4 sm:p-6 lg:border-l lg:border-t-0">
						<h2 class="text-sm font-semibold">Planning controls</h2>
						<div class="mt-4 grid gap-3">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Status</span>
								<DomNativeSelect v-model="selectedStatus" :options="statusOptions" class="mt-1" />
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Owner</span>
								<DomNativeSelect v-model="selectedOwner" :options="ownerOptions" class="mt-1" />
							</label>
						</div>

						<div class="my-5 border-y border-border py-4">
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium">Launch readiness</span>
								<span class="font-semibold">{{ launchReadiness }}%</span>
							</div>
							<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full" :class="confidenceClass(launchReadiness)" :style="{ width: `${launchReadiness}%` }"></div>
							</div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">Combines confidence, status, stakeholder readiness, and dependency visibility.</p>
						</div>

						<div class="space-y-3">
							<label class="flex items-center justify-between gap-4">
								<span>
									<span class="block text-sm font-medium">Notify stakeholders</span>
									<span class="block text-xs text-muted-fg">Include this change in the planning digest.</span>
								</span>
								<DomToggle v-model="notifyStakeholders" aria-label="Notify stakeholders" />
							</label>
							<label class="flex items-center justify-between gap-4">
								<span>
									<span class="block text-sm font-medium">Show dependencies</span>
									<span class="block text-xs text-muted-fg">Surface blockers on roadmap cards.</span>
								</span>
								<DomToggle v-model="showDependencies" aria-label="Show dependencies in controls" />
							</label>
						</div>

						<div class="mt-5 rounded-lg border border-border bg-background p-3">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Decision summary</p>
							<p class="mt-2 text-sm leading-6">{{ selectedInitiative.title }} is {{ selectedStatus.toLowerCase() }} with {{ launchReadiness }}% readiness and {{ selectedInitiative.dependencies.length }} dependency item{{ selectedInitiative.dependencies.length === 1 ? '' : 's' }}.</p>
						</div>

						<div class="mt-4 flex flex-wrap gap-2">
							<DomButton size="sm">Save roadmap</DomButton>
							<DomButton size="sm" variant="secondary">Export review</DomButton>
						</div>
					</aside>
				</section>
			</main>
		</div>
	</section>
</template>
