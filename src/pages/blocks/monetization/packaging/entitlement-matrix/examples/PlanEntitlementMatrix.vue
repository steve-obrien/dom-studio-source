<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomToggle, DomTooltip } from '@getdom/studio/vue';

const segmentOptions = [
	{ label: 'Growth teams', value: 'growth' },
	{ label: 'Developer platforms', value: 'platform' },
	{ label: 'Agency workspaces', value: 'agency' },
];

const plans = [
	{
		id: 'starter',
		name: 'Starter',
		shortName: 'Start',
		description: 'For small teams proving the workflow.',
		monthlyPrice: 19,
		annualPrice: 15,
		includedSeats: 3,
		priceId: 'price_starter_annual',
		status: 'Public',
		accent: 'bg-sky-500',
		tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
	},
	{
		id: 'growth',
		name: 'Growth',
		shortName: 'Grow',
		description: 'For teams standardizing delivery.',
		monthlyPrice: 49,
		annualPrice: 39,
		includedSeats: 12,
		priceId: 'price_growth_annual',
		status: 'Recommended',
		accent: 'bg-primary',
		tone: 'bg-primary/10 text-primary',
	},
	{
		id: 'scale',
		name: 'Scale',
		shortName: 'Scale',
		description: 'For mature teams with compliance needs.',
		monthlyPrice: 129,
		annualPrice: 99,
		includedSeats: 40,
		priceId: 'price_scale_annual',
		status: 'Sales assisted',
		accent: 'bg-emerald-500',
		tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
	},
];

const featureGroups = [
	{
		name: 'Workspace',
		description: 'Core limits shown in onboarding, settings, and checkout.',
		features: [
			{
				key: 'seats.included',
				label: 'Included seats',
				detail: 'Default seats before paid expansion.',
				values: { starter: '3', growth: '12', scale: '40' },
			},
			{
				key: 'projects.active',
				label: 'Active projects',
				detail: 'Projects visible to the team at once.',
				values: { starter: '5', growth: 'Unlimited', scale: 'Unlimited' },
			},
			{
				key: 'storage.total',
				label: 'Storage',
				detail: 'Pooled files, exports, and attachments.',
				values: { starter: '25 GB', growth: '250 GB', scale: '2 TB' },
			},
		],
	},
	{
		name: 'Automation',
		description: 'Metered work your backend should enforce.',
		features: [
			{
				key: 'automation.runs',
				label: 'Workflow runs',
				detail: 'Monthly automation executions.',
				values: { starter: '5k', growth: '50k', scale: '250k' },
				metered: true,
			},
			{
				key: 'integrations.premium',
				label: 'Premium integrations',
				detail: 'CRM, warehouse, billing, and identity syncs.',
				values: { starter: false, growth: true, scale: true },
			},
			{
				key: 'webhooks.retries',
				label: 'Webhook retry window',
				detail: 'How long failed delivery attempts remain retryable.',
				values: { starter: '24 hours', growth: '7 days', scale: '30 days' },
			},
		],
	},
	{
		name: 'Service',
		description: 'Human support and account protections.',
		features: [
			{
				key: 'support.priority',
				label: 'Priority support',
				detail: 'Raised queue priority for account owners.',
				values: { starter: false, growth: true, scale: true },
			},
			{
				key: 'security.sso',
				label: 'SAML SSO',
				detail: 'Single sign-on for managed company domains.',
				values: { starter: false, growth: 'Add-on', scale: true },
			},
			{
				key: 'success.manager',
				label: 'Success manager',
				detail: 'Named owner for rollout planning and renewals.',
				values: { starter: false, growth: false, scale: true },
			},
		],
	},
];

const addOns = [
	{ id: 'extra-seats', label: 'Extra seat pack', price: 8, detail: 'Adds five flexible seats.' },
	{ id: 'sso', label: 'SAML SSO add-on', price: 29, detail: 'Available when the plan does not include SSO.' },
];

const selectedSegment = ref('growth');
const annualBilling = ref(true);
const showAddOns = ref(true);
const selectedPlanId = ref('growth');
const visiblePlanIds = ref(plans.map((plan) => plan.id));

const visiblePlans = computed(() => plans.filter((plan) => visiblePlanIds.value.includes(plan.id)));
const selectedPlan = computed(() => plans.find((plan) => plan.id === selectedPlanId.value) || plans[1]);
const cadenceLabel = computed(() => annualBilling.value ? 'Annual' : 'Monthly');
const selectedSegmentLabel = computed(() => segmentOptions.find((option) => option.value === selectedSegment.value)?.label || 'Growth teams');
const selectedPlanPrice = computed(() => annualBilling.value ? selectedPlan.value.annualPrice : selectedPlan.value.monthlyPrice);
const addOnTotal = computed(() => showAddOns.value ? addOns.reduce((total, addOn) => total + addOn.price, 0) : 0);
const checkoutTotal = computed(() => selectedPlanPrice.value + addOnTotal.value);
const checkoutPayload = computed(() => ({
	planId: selectedPlan.value.id,
	priceId: selectedPlan.value.priceId,
	segment: selectedSegment.value,
	cadence: annualBilling.value ? 'annual' : 'monthly',
	addOns: showAddOns.value ? addOns.map((addOn) => addOn.id) : [],
	monthlyPreview: checkoutTotal.value,
}));

const visibleFeatureCount = computed(() => featureGroups.reduce((count, group) => count + group.features.length, 0));
const enabledFeatureCount = computed(() => {
	return featureGroups.reduce((count, group) => {
		return count + group.features.filter((feature) => Boolean(feature.values[selectedPlan.value.id])).length;
	}, 0);
});
const checkoutPayloadJson = computed(() => JSON.stringify(checkoutPayload.value, null, 2));
const readinessChecks = computed(() => [
	{
		label: 'Checkout SKU mapped',
		detail: selectedPlan.value.priceId,
		complete: Boolean(selectedPlan.value.priceId),
	},
	{
		label: 'Entitlements visible',
		detail: `${enabledFeatureCount.value} of ${visibleFeatureCount.value} rows enabled`,
		complete: enabledFeatureCount.value >= 6,
	},
	{
		label: 'Upgrade path clear',
		detail: selectedPlan.value.id === 'scale' ? 'Sales-assisted handoff' : 'Self-serve upgrade ready',
		complete: true,
	},
]);

function formatCurrency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}

function planPrice(plan) {
	return annualBilling.value ? plan.annualPrice : plan.monthlyPrice;
}

function toggleVisiblePlan(planId) {
	if (visiblePlanIds.value.includes(planId) && visiblePlanIds.value.length > 1) {
		visiblePlanIds.value = visiblePlanIds.value.filter((id) => id !== planId);
		return;
	}

	if (!visiblePlanIds.value.includes(planId)) {
		visiblePlanIds.value = [...visiblePlanIds.value, planId];
	}
}

function selectPlan(planId) {
	selectedPlanId.value = planId;
	if (!visiblePlanIds.value.includes(planId)) {
		visiblePlanIds.value = [...visiblePlanIds.value, planId];
	}
}

function cellLabel(value) {
	if (value === true) return 'Included';
	if (value === false) return 'Not included';
	return value;
}

function cellClasses(value, planId) {
	if (planId === selectedPlan.value.id) return 'bg-primary/5 text-fg';
	if (value === true) return 'bg-success/10 text-success';
	if (value === false) return 'text-muted-fg';
	if (value === 'Add-on') return 'bg-warning/10 text-warning';
	return 'text-fg';
}

function checkIcon(value) {
	if (value === true) return 'M20 6 9 17l-5-5';
	if (value === false) return 'M6 6l12 12M18 6 6 18';
	return '';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-5 sm:px-6">
			<div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div class="max-w-3xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Revenue packaging</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Plan entitlement matrix</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Compare package limits, feature gates, support levels, and checkout mappings before publishing plan changes.
					</p>
				</div>

				<div class="grid gap-3 sm:grid-cols-[minmax(10rem,12rem)_auto_auto] sm:items-center">
					<DomNativeSelect v-model="selectedSegment" :options="segmentOptions" />
					<label class="flex items-center justify-between gap-3 rounded-full border border-border bg-background px-3 py-2 text-sm">
						<span class="font-medium">{{ cadenceLabel }}</span>
						<DomToggle v-model="annualBilling" aria-label="Use annual billing" />
					</label>
					<DomButton>
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						New plan
					</DomButton>
				</div>
			</div>
		</header>

		<section class="grid border-b border-border lg:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
				<button
					v-for="plan in plans"
					:key="plan.id"
					type="button"
					class="group relative overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-black/5"
					:class="plan.id === selectedPlan.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-background'"
					@click="selectPlan(plan.id)"
				>
					<div class="absolute inset-x-0 top-0 h-1" :class="plan.accent"></div>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-lg font-semibold tracking-tight">{{ plan.name }}</p>
							<p class="mt-1 text-xs text-muted-fg">{{ plan.description }}</p>
						</div>
						<span class="rounded-full px-2 py-1 text-[11px] font-semibold" :class="plan.tone">{{ plan.status }}</span>
					</div>
					<div class="mt-5 flex items-end gap-1">
						<span class="text-3xl font-semibold tracking-tight">{{ formatCurrency(planPrice(plan)) }}</span>
						<span class="pb-1 text-xs text-muted-fg">/ seat</span>
					</div>
					<div class="mt-4 flex items-center justify-between gap-3 text-xs text-muted-fg">
						<span>{{ plan.includedSeats }} seats included</span>
						<span>{{ annualBilling ? 'Billed yearly' : 'Billed monthly' }}</span>
					</div>
					<div class="mt-4 flex items-center justify-between gap-3 rounded-full bg-secondary/70 px-3 py-2 text-xs">
						<span>Show in matrix</span>
						<span
							class="grid size-5 place-items-center rounded-full border"
							:class="visiblePlanIds.includes(plan.id) ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-background text-muted-fg'"
							@click.stop="toggleVisiblePlan(plan.id)"
						>
							<svg v-if="visiblePlanIds.includes(plan.id)" class="size-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</span>
					</div>
				</button>
			</div>

			<aside class="border-t border-border skin-raised p-4 sm:p-6 lg:border-l lg:border-t-0">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Checkout preview</p>
						<h4 class="mt-1 text-xl font-semibold tracking-tight">{{ selectedPlan.name }} for {{ selectedSegmentLabel }}</h4>
					</div>
					<span class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Ready</span>
				</div>

				<div class="mt-5 rounded-2xl border border-border bg-background p-4">
					<div class="flex items-center justify-between gap-4">
						<span class="text-sm text-muted-fg">Plan price</span>
						<span class="font-semibold">{{ formatCurrency(selectedPlanPrice) }}</span>
					</div>
					<div class="mt-3 flex items-center justify-between gap-4">
						<span class="text-sm text-muted-fg">Add-ons</span>
						<span class="font-semibold">{{ formatCurrency(addOnTotal) }}</span>
					</div>
					<div class="mt-4 border-t border-border pt-4">
						<div class="flex items-end justify-between gap-4">
							<span class="text-sm font-medium">Monthly preview</span>
							<span class="text-2xl font-semibold tracking-tight">{{ formatCurrency(checkoutTotal) }}</span>
						</div>
					</div>
				</div>

				<label class="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
					<span>
						<span class="block text-sm font-semibold">Include common add-ons</span>
						<span class="mt-1 block text-xs leading-5 text-muted-fg">Preview seats and SSO as checkout line items.</span>
					</span>
					<DomToggle v-model="showAddOns" aria-label="Include common add-ons" />
				</label>

				<div class="mt-4 space-y-3">
					<div v-for="check in readinessChecks" :key="check.label" class="flex gap-3 rounded-2xl border border-border bg-background p-3">
						<span
							class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold"
							:class="check.complete ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
						>
							{{ check.complete ? 'Y' : '!' }}
						</span>
						<div class="min-w-0">
							<p class="text-sm font-semibold">{{ check.label }}</p>
							<p class="mt-1 truncate text-xs text-muted-fg">{{ check.detail }}</p>
						</div>
					</div>
				</div>
			</aside>
		</section>

		<section class="border-b border-border bg-secondary/30 px-4 py-3 sm:px-6">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div class="flex flex-wrap items-center gap-2 text-xs">
					<span class="font-semibold uppercase tracking-[0.14em] text-muted-fg">Visible plans</span>
					<button
						v-for="plan in plans"
						:key="plan.id"
						type="button"
						class="rounded-full border px-3 py-1.5 font-semibold transition"
						:class="visiblePlanIds.includes(plan.id) ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-background text-muted-fg'"
						@click="toggleVisiblePlan(plan.id)"
					>
						{{ plan.name }}
					</button>
				</div>
				<p class="text-xs text-muted-fg">{{ visibleFeatureCount }} entitlement rows across {{ featureGroups.length }} groups</p>
			</div>
		</section>

		<section class="hidden overflow-x-auto lg:block">
			<table class="w-full min-w-[58rem] border-separate border-spacing-0 text-sm">
				<thead>
					<tr>
						<th class="sticky left-0 z-20 w-[22rem] border-b border-r border-border bg-background px-6 py-4 text-left font-semibold">Entitlement</th>
						<th
							v-for="plan in visiblePlans"
							:key="plan.id"
							class="sticky top-0 z-10 min-w-48 border-b border-border bg-background px-5 py-4 text-left"
						>
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="font-semibold">{{ plan.name }}</p>
									<p class="mt-1 text-xs font-normal text-muted-fg">{{ formatCurrency(planPrice(plan)) }} per seat</p>
								</div>
								<span class="h-8 w-1 rounded-full" :class="plan.accent"></span>
							</div>
						</th>
					</tr>
				</thead>
				<tbody v-for="group in featureGroups" :key="group.name">
					<tr>
						<td :colspan="visiblePlans.length + 1" class="border-b border-border bg-secondary/60 px-6 py-3">
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="font-semibold">{{ group.name }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ group.description }}</p>
								</div>
							</div>
						</td>
					</tr>
					<tr v-for="feature in group.features" :key="feature.key" class="group">
						<th class="sticky left-0 z-10 border-b border-r border-border bg-background px-6 py-4 text-left align-top">
							<div class="flex items-start gap-3">
								<DomTooltip :text="feature.detail">
									<span class="mt-0.5 grid size-6 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-fg">?</span>
								</DomTooltip>
								<div>
									<p class="font-semibold">{{ feature.label }}</p>
									<p class="mt-1 text-xs font-normal text-muted-fg">{{ feature.key }}</p>
								</div>
							</div>
						</th>
						<td
							v-for="plan in visiblePlans"
							:key="`${feature.key}-${plan.id}`"
							class="border-b border-border px-5 py-4 align-top transition group-hover:bg-secondary/30"
							:class="cellClasses(feature.values[plan.id], plan.id)"
						>
							<div class="flex min-h-8 items-center gap-2">
								<svg v-if="typeof feature.values[plan.id] === 'boolean'" class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path :d="checkIcon(feature.values[plan.id])" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<span class="font-medium">{{ cellLabel(feature.values[plan.id]) }}</span>
							</div>
							<p v-if="feature.metered" class="mt-1 text-xs text-muted-fg">Metered monthly</p>
						</td>
					</tr>
				</tbody>
			</table>
		</section>

		<section class="grid gap-4 p-4 sm:p-6 lg:hidden">
			<article
				v-for="plan in visiblePlans"
				:key="`mobile-${plan.id}`"
				class="overflow-hidden rounded-2xl border border-border bg-background"
			>
				<div class="flex items-start justify-between gap-4 border-b border-border p-4">
					<div>
						<p class="text-lg font-semibold">{{ plan.name }}</p>
						<p class="mt-1 text-sm text-muted-fg">{{ formatCurrency(planPrice(plan)) }} per seat</p>
					</div>
					<span class="rounded-full px-2 py-1 text-xs font-semibold" :class="plan.tone">{{ plan.status }}</span>
				</div>
				<div class="divide-y divide-border">
					<div v-for="group in featureGroups" :key="`${plan.id}-${group.name}`" class="p-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ group.name }}</p>
						<div class="mt-3 space-y-3">
							<div v-for="feature in group.features" :key="`${plan.id}-${feature.key}`" class="flex items-start justify-between gap-4">
								<div class="min-w-0">
									<p class="text-sm font-medium">{{ feature.label }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ feature.detail }}</p>
								</div>
								<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="cellClasses(feature.values[plan.id], plan.id)">
									{{ cellLabel(feature.values[plan.id]) }}
								</span>
							</div>
						</div>
					</div>
				</div>
			</article>
		</section>

		<footer class="grid gap-4 border-t border-border skin-raised p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
			<div>
				<p class="text-sm font-semibold">Checkout payload</p>
				<p class="mt-1 text-sm text-muted-fg">Use this preview to wire the block into your product catalog, entitlement service, and billing session endpoint.</p>
				<pre class="mt-4 max-h-56 overflow-auto rounded-2xl border border-border bg-fg p-4 text-xs leading-5 text-background"><code>{{ checkoutPayloadJson }}</code></pre>
			</div>
			<div class="grid content-start gap-3 rounded-2xl border border-border bg-background p-4">
				<p class="text-sm font-semibold">Recommended follow-up</p>
				<p class="text-sm leading-6 text-muted-fg">Add row editing only after plan versions, audit approvals, and entitlement keys are stable. Most teams should publish through a guarded backend workflow.</p>
				<DomButton class="mt-2 w-full">Publish package draft</DomButton>
			</div>
		</footer>
	</div>
</template>
