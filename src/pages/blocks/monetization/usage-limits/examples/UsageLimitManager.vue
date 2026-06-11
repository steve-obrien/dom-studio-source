<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomToggle } from '@getdom/studio/vue';

const plans = [
	{ label: 'Starter plan', value: 'starter', customers: 248, monthlyRevenue: '$18.4k' },
	{ label: 'Growth plan', value: 'growth', customers: 94, monthlyRevenue: '$42.8k' },
	{ label: 'Scale plan', value: 'scale', customers: 31, monthlyRevenue: '$78.2k' },
];

const meters = [
	{
		id: 'workflow_runs',
		name: 'Workflow runs',
		unit: 'runs',
		period: 'Monthly',
		current: 84200,
		limit: 120000,
		recommended: 140000,
		planMax: 200000,
		softLimit: 80,
		trend: '+18%',
		status: 'Healthy',
	},
	{
		id: 'ai_tokens',
		name: 'AI credits',
		unit: 'credits',
		period: 'Monthly',
		current: 3180000,
		limit: 4000000,
		recommended: 4600000,
		planMax: 8000000,
		softLimit: 75,
		trend: '+31%',
		status: 'Watch',
	},
	{
		id: 'storage_gb',
		name: 'Storage',
		unit: 'GB',
		period: 'Monthly average',
		current: 182,
		limit: 250,
		recommended: 300,
		planMax: 500,
		softLimit: 85,
		trend: '+7%',
		status: 'Healthy',
	},
];

const exceptions = [
	{ customer: 'Arcadia Health', meter: 'Workflow runs', limit: '180,000', owner: 'Customer success', expires: 'Jul 1' },
	{ customer: 'Northstar Labs', meter: 'AI credits', limit: '5.5M', owner: 'Revenue ops', expires: 'Jun 28' },
	{ customer: 'Harbor Retail', meter: 'Storage', limit: '420 GB', owner: 'Support lead', expires: 'Jul 14' },
];

const activity = [
	{ label: 'Soft limit alert changed to 80%', actor: 'Maya Chen', time: 'Today 11:20' },
	{ label: 'Arcadia Health exception approved', actor: 'Revenue ops', time: 'Today 09:45' },
	{ label: 'AI credits overage policy switched to billable', actor: 'Finance admin', time: 'Yesterday' },
	{ label: 'Scale plan maximum raised', actor: 'Entitlements API', time: 'Jun 8' },
];

const selectedPlan = ref('growth');
const selectedMeterId = ref(meters[0].id);
const draftLimit = ref(meters[0].limit);
const softLimit = ref(meters[0].softLimit);
const overagePolicy = ref('charge');
const graceHours = ref(24);
const alertOwners = ref(true);
const alertBilling = ref(true);
const requireApproval = ref(false);

const selectedPlanRecord = computed(() => plans.find((plan) => plan.value === selectedPlan.value) || plans[0]);
const selectedMeter = computed(() => meters.find((meter) => meter.id === selectedMeterId.value) || meters[0]);
const usagePercent = computed(() => Math.min(100, Math.round((selectedMeter.value.current / draftLimit.value) * 100)));
const softLimitUsage = computed(() => Math.round((draftLimit.value * softLimit.value) / 100));
const headroom = computed(() => Math.max(0, draftLimit.value - selectedMeter.value.current));
const approvalNeeded = computed(() => draftLimit.value > selectedMeter.value.recommended || requireApproval.value);
const saveSummary = computed(() => {
	const action = overagePolicy.value === 'charge' ? 'Bill overages' : overagePolicy.value === 'pause' ? 'Pause usage' : 'Allow grace period';
	return `${action} after ${formatNumber(draftLimit.value)} ${selectedMeter.value.unit}`;
});

watch(selectedMeter, (meter) => {
	draftLimit.value = meter.limit;
	softLimit.value = meter.softLimit;
});

function selectMeter(meter) {
	selectedMeterId.value = meter.id;
}

function formatNumber(value) {
	return new Intl.NumberFormat('en-US').format(value);
}

function meterWidth(meter) {
	return `${Math.min(100, Math.round((meter.current / meter.limit) * 100))}%`;
}

function statusClass(status) {
	return status === 'Watch'
		? 'bg-warning/15 text-warning'
		: 'bg-success/15 text-success';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Revenue operations</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Usage limits</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Configure metered product limits with guardrails for billing, customer experience, and support teams.
					</p>
				</div>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<DomNativeSelect v-model="selectedPlan" :options="plans" class="sm:w-44" />
					<DomButton>
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						New exception
					</DomButton>
				</div>
			</div>
		</header>

		<div class="grid min-h-[46rem] lg:grid-cols-[19rem_minmax(0,1fr)_21rem]">
			<aside class="border-b border-border skin-raised lg:border-b-0 lg:border-r">
				<div class="grid grid-cols-2 border-b border-border text-sm">
					<div class="px-4 py-3">
						<p class="text-xs text-muted-fg">Customers</p>
						<p class="mt-1 text-lg font-semibold">{{ selectedPlanRecord.customers }}</p>
					</div>
					<div class="border-l border-border px-4 py-3">
						<p class="text-xs text-muted-fg">MRR</p>
						<p class="mt-1 text-lg font-semibold">{{ selectedPlanRecord.monthlyRevenue }}</p>
					</div>
				</div>

				<div class="p-3">
					<p class="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Meters</p>
					<div class="space-y-2">
						<button
							v-for="meter in meters"
							:key="meter.id"
							type="button"
							class="w-full rounded-xl border p-3 text-left transition hover:border-primary/50"
							:class="meter.id === selectedMeter.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-background'"
							@click="selectMeter(meter)"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold">{{ meter.name }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ meter.period }} limit</p>
								</div>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(meter.status)">
									{{ meter.status }}
								</span>
							</div>
							<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary" :style="{ width: meterWidth(meter) }"></div>
							</div>
							<div class="mt-2 flex justify-between text-xs text-muted-fg">
								<span>{{ formatNumber(meter.current) }}</span>
								<span>{{ formatNumber(meter.limit) }} {{ meter.unit }}</span>
							</div>
						</button>
					</div>
				</div>
			</aside>

			<main class="min-w-0">
				<section class="border-b border-border px-4 py-5 sm:px-6">
					<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div>
							<p class="text-sm font-medium text-muted-fg">Selected meter</p>
							<h4 class="mt-1 text-xl font-semibold tracking-tight">{{ selectedMeter.name }}</h4>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
								Current usage is {{ formatNumber(selectedMeter.current) }} {{ selectedMeter.unit }} with {{ formatNumber(headroom) }} {{ selectedMeter.unit }} of headroom.
							</p>
						</div>
						<div class="grid grid-cols-3 overflow-hidden rounded-xl border border-border text-center text-sm">
							<div class="px-3 py-3">
								<p class="text-xs text-muted-fg">Used</p>
								<p class="mt-1 font-semibold">{{ usagePercent }}%</p>
							</div>
							<div class="border-l border-border px-3 py-3">
								<p class="text-xs text-muted-fg">Trend</p>
								<p class="mt-1 font-semibold">{{ selectedMeter.trend }}</p>
							</div>
							<div class="border-l border-border px-3 py-3">
								<p class="text-xs text-muted-fg">Plan max</p>
								<p class="mt-1 font-semibold">{{ formatNumber(selectedMeter.planMax) }}</p>
							</div>
						</div>
					</div>

					<div class="mt-6">
						<div class="flex items-center justify-between gap-4 text-sm">
							<span class="font-medium">Draft hard limit</span>
							<span class="font-semibold">{{ formatNumber(draftLimit) }} {{ selectedMeter.unit }}</span>
						</div>
						<input
							v-model.number="draftLimit"
							type="range"
							class="mt-3 w-full accent-primary"
							:min="selectedMeter.current"
							:max="selectedMeter.planMax"
							:step="selectedMeter.unit === 'GB' ? 10 : 10000"
							aria-label="Draft hard limit"
						>
						<div class="mt-2 flex justify-between text-xs text-muted-fg">
							<span>Current usage</span>
							<span>Plan maximum</span>
						</div>
					</div>
				</section>

				<section class="grid border-b border-border md:grid-cols-2">
					<div class="border-b border-border px-4 py-5 sm:px-6 md:border-b-0 md:border-r">
						<h5 class="font-semibold tracking-tight">Soft limit alerts</h5>
						<p class="mt-2 text-sm leading-6 text-muted-fg">Warn owners before usage becomes a billing or availability issue.</p>
						<div class="mt-5">
							<div class="flex items-center justify-between text-sm">
								<span>Alert threshold</span>
								<span class="font-semibold">{{ softLimit }}%</span>
							</div>
							<input
								v-model.number="softLimit"
								type="range"
								class="mt-3 w-full accent-primary"
								min="50"
								max="100"
								step="5"
								aria-label="Soft limit alert threshold"
							>
							<p class="mt-2 text-xs text-muted-fg">
								First alert at {{ formatNumber(softLimitUsage) }} {{ selectedMeter.unit }}.
							</p>
						</div>
						<div class="mt-5 divide-y divide-border rounded-xl border border-border">
							<label class="flex items-center justify-between gap-4 px-3 py-3">
								<span>
									<span class="block text-sm font-medium">Notify account owners</span>
									<span class="block text-xs text-muted-fg">Send email and in-app warnings.</span>
								</span>
								<DomToggle v-model="alertOwners" aria-label="Notify account owners" />
							</label>
							<label class="flex items-center justify-between gap-4 px-3 py-3">
								<span>
									<span class="block text-sm font-medium">Notify billing admins</span>
									<span class="block text-xs text-muted-fg">Include upcoming charge context.</span>
								</span>
								<DomToggle v-model="alertBilling" aria-label="Notify billing admins" />
							</label>
						</div>
					</div>

					<div class="px-4 py-5 sm:px-6">
						<h5 class="font-semibold tracking-tight">Overage policy</h5>
						<p class="mt-2 text-sm leading-6 text-muted-fg">Choose what happens when usage reaches the hard limit.</p>
						<div class="mt-5 grid gap-2">
							<button
								v-for="policy in [
									{ id: 'charge', label: 'Bill overages', description: 'Keep service running and charge per unit.' },
									{ id: 'grace', label: 'Allow grace window', description: 'Keep service running briefly before enforcement.' },
									{ id: 'pause', label: 'Pause usage', description: 'Block new usage until the limit is raised.' }
								]"
								:key="policy.id"
								type="button"
								class="rounded-xl border px-3 py-3 text-left transition hover:border-primary/50"
								:class="overagePolicy === policy.id ? 'border-primary/60 bg-primary/5' : 'border-border'"
								@click="overagePolicy = policy.id"
							>
								<span class="block text-sm font-semibold">{{ policy.label }}</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ policy.description }}</span>
							</button>
						</div>
						<div class="mt-5 flex items-center justify-between gap-4 rounded-xl bg-secondary px-3 py-3">
							<div>
								<p class="text-sm font-medium">Grace period</p>
								<p class="text-xs text-muted-fg">Applies only to grace and billable policies.</p>
							</div>
							<select v-model.number="graceHours" class="rounded-lg border border-border bg-background px-3 py-2 text-sm">
								<option :value="0">None</option>
								<option :value="12">12 hours</option>
								<option :value="24">24 hours</option>
								<option :value="72">72 hours</option>
							</select>
						</div>
					</div>
				</section>

				<section class="px-4 py-5 sm:px-6">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h5 class="font-semibold tracking-tight">Customer exceptions</h5>
							<p class="mt-2 text-sm leading-6 text-muted-fg">Temporary overrides keep strategic accounts moving without changing the plan default.</p>
						</div>
						<DomButton size="sm" variant="secondary">Review requests</DomButton>
					</div>
					<div class="mt-5 overflow-hidden rounded-xl border border-border">
						<div
							v-for="exception in exceptions"
							:key="exception.customer"
							class="grid gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1.2fr_1fr_auto]"
						>
							<div>
								<p class="font-medium">{{ exception.customer }}</p>
								<p class="text-xs text-muted-fg">{{ exception.owner }}</p>
							</div>
							<div>
								<p>{{ exception.meter }} limit</p>
								<p class="text-xs text-muted-fg">{{ exception.limit }} until {{ exception.expires }}</p>
							</div>
							<button type="button" class="justify-self-start rounded-lg px-2 py-1 text-sm font-medium text-muted-fg hover:bg-secondary hover:text-fg md:justify-self-end">
								Inspect
							</button>
						</div>
					</div>
				</section>
			</main>

			<aside class="border-t border-border skin-raised lg:border-l lg:border-t-0">
				<div class="border-b border-border px-4 py-5">
					<p class="text-sm font-semibold text-muted-fg">Change summary</p>
					<p class="mt-2 text-xl font-semibold tracking-tight">{{ saveSummary }}</p>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Alert at {{ softLimit }}%, grace for {{ graceHours }} hours, then enforce the selected overage policy.
					</p>
					<div class="mt-4 rounded-xl border border-border bg-background p-3">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-sm font-medium">Approval status</p>
								<p class="mt-1 text-xs text-muted-fg">
									{{ approvalNeeded ? 'Revenue approval required before publishing.' : 'Ready to publish without approval.' }}
								</p>
							</div>
							<span class="rounded-full px-2 py-1 text-xs font-semibold" :class="approvalNeeded ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'">
								{{ approvalNeeded ? 'Review' : 'Ready' }}
							</span>
						</div>
						<label class="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
							<span class="text-sm font-medium">Require manager approval</span>
							<DomToggle v-model="requireApproval" aria-label="Require manager approval" />
						</label>
					</div>
					<div class="mt-4 grid grid-cols-2 gap-2">
						<DomButton variant="secondary">Save draft</DomButton>
						<DomButton>Publish</DomButton>
					</div>
				</div>

				<div class="px-4 py-5">
					<h5 class="font-semibold tracking-tight">Activity</h5>
					<div class="mt-4 space-y-4">
						<div v-for="event in activity" :key="event.label" class="flex gap-3">
							<span class="mt-1 size-2 shrink-0 rounded-full bg-primary"></span>
							<div>
								<p class="text-sm font-medium">{{ event.label }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.actor }} - {{ event.time }}</p>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</template>
