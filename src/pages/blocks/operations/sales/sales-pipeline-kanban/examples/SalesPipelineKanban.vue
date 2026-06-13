<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomButton,
	DomDialog,
	DomListbox,
	DomRangeInput,
	DomTagCombobox,
	DomTextareaInput,
	DomToggle,
	DomToggleButtonGroup,
	DomTooltip,
} from '@getdom/studio/vue';
import DealStageColumn from '../components/DealStageColumn.vue';
import ForecastPill from '../components/ForecastPill.vue';

const stages = [
	{ value: 'qualified', label: 'Qualified', description: 'Need confirmed budget and pain.', defaultProbability: 25 },
	{ value: 'solution', label: 'Solution fit', description: 'Discovery complete, solution mapped.', defaultProbability: 45 },
	{ value: 'proposal', label: 'Proposal', description: 'Pricing and scope are in buyer review.', defaultProbability: 65 },
	{ value: 'legal', label: 'Legal review', description: 'Security, procurement, or legal review.', defaultProbability: 80 },
	{ value: 'commit', label: 'Commit', description: 'Mutual close plan is active.', defaultProbability: 90 },
];

const forecastModes = [
	{ value: 'pipeline', label: 'Pipeline' },
	{ value: 'weighted', label: 'Weighted' },
	{ value: 'commit', label: 'Commit' },
];

const ownerOptions = [
	{ value: 'ada', label: 'Ada Riley', description: 'Enterprise AE', meta: '$304k open' },
	{ value: 'maya', label: 'Maya Chen', description: 'Strategic AE', meta: '$276k open' },
	{ value: 'jon', label: 'Jon Bell', description: 'Growth AE', meta: '$186k open' },
	{ value: 'sam', label: 'Sam Patel', description: 'Partner lead', meta: '$144k open' },
];

const regionOptions = [
	{ value: 'na', label: 'North America', description: 'US and Canada territory', count: 5 },
	{ value: 'emea', label: 'EMEA', description: 'Europe, Middle East, Africa', count: 4 },
	{ value: 'apac', label: 'APAC', description: 'Asia-Pacific expansion', count: 2 },
];

const initialDeals = [
	{
		id: 'deal_northstar',
		account: 'Northstar Labs',
		description: 'Enterprise product analytics rollout',
		stage: 'proposal',
		value: 128000,
		probability: 65,
		forecast: 'Best case',
		forecastTone: 'primary',
		owner: 'ada',
		ownerInitials: 'AR',
		region: 'emea',
		closeDate: 'Jun 28',
		nextStep: 'Security review',
		risks: ['Security', 'Legal'],
		stakeholders: ['CFO', 'VP Product'],
		closePlan: 'Confirm security exception path, then send final order form.',
	},
	{
		id: 'deal_evergreen',
		account: 'Evergreen Clinics',
		description: 'Multi-location patient scheduling suite',
		stage: 'legal',
		value: 94000,
		probability: 78,
		forecast: 'Commit',
		forecastTone: 'success',
		owner: 'maya',
		ownerInitials: 'MC',
		region: 'na',
		closeDate: 'Jun 21',
		nextStep: 'Procurement call',
		risks: ['MSA'],
		stakeholders: ['COO', 'Procurement'],
		closePlan: 'Procurement requested one redline pass and updated implementation dates.',
	},
	{
		id: 'deal_clearpath',
		account: 'Clearpath Freight',
		description: 'Dispatch automation and customer portal',
		stage: 'solution',
		value: 76000,
		probability: 42,
		forecast: 'Pipeline',
		forecastTone: 'neutral',
		owner: 'sam',
		ownerInitials: 'SP',
		region: 'na',
		closeDate: 'Jul 10',
		nextStep: 'Solution workshop',
		risks: ['Integration'],
		stakeholders: ['VP Ops'],
		closePlan: 'Map EDI integration scope before pricing approval.',
	},
	{
		id: 'deal_summit',
		account: 'Summit Finance',
		description: 'Compliance workflow expansion',
		stage: 'commit',
		value: 156000,
		probability: 91,
		forecast: 'Commit',
		forecastTone: 'success',
		owner: 'ada',
		ownerInitials: 'AR',
		region: 'emea',
		closeDate: 'Jun 17',
		nextStep: 'Order form',
		risks: [],
		stakeholders: ['CIO', 'General Counsel'],
		closePlan: 'Send final order form after data residency addendum is attached.',
	},
	{
		id: 'deal_riverline',
		account: 'Riverline Market',
		description: 'Seller onboarding and payouts workflow',
		stage: 'qualified',
		value: 52000,
		probability: 22,
		forecast: 'Pipeline',
		forecastTone: 'neutral',
		owner: 'jon',
		ownerInitials: 'JB',
		region: 'na',
		closeDate: 'Jul 24',
		nextStep: 'Budget check',
		risks: ['Budget'],
		stakeholders: ['Founder'],
		closePlan: 'Confirm implementation budget and marketplace launch date.',
	},
	{
		id: 'deal_monarch',
		account: 'Monarch Education',
		description: 'District onboarding and parent portal',
		stage: 'proposal',
		value: 112000,
		probability: 58,
		forecast: 'Best case',
		forecastTone: 'primary',
		owner: 'maya',
		ownerInitials: 'MC',
		region: 'emea',
		closeDate: 'Jul 03',
		nextStep: 'Board packet',
		risks: ['Timeline'],
		stakeholders: ['Superintendent', 'Finance'],
		closePlan: 'Package implementation timeline and proof points for board review.',
	},
	{
		id: 'deal_atlas',
		account: 'Atlas Robotics',
		description: 'Developer platform usage expansion',
		stage: 'solution',
		value: 88000,
		probability: 50,
		forecast: 'Best case',
		forecastTone: 'primary',
		owner: 'jon',
		ownerInitials: 'JB',
		region: 'apac',
		closeDate: 'Jul 14',
		nextStep: 'Usage model',
		risks: ['Pricing'],
		stakeholders: ['CTO', 'Finance'],
		closePlan: 'Align usage model with procurement cap before proposal.',
	},
	{
		id: 'deal_pixel',
		account: 'Pixel Grove',
		description: 'Creative operations workspace',
		stage: 'qualified',
		value: 38000,
		probability: 30,
		forecast: 'Pipeline',
		forecastTone: 'neutral',
		owner: 'sam',
		ownerInitials: 'SP',
		region: 'apac',
		closeDate: 'Aug 02',
		nextStep: 'Champion call',
		risks: [],
		stakeholders: ['Head of Studio'],
		closePlan: 'Identify executive sponsor and agency rollout path.',
	},
];

const deals = ref(initialDeals.map((deal) => ({ ...deal, stakeholders: [...deal.stakeholders], risks: [...deal.risks] })));
const selectedDealId = ref('deal_northstar');
const selectedOwners = ref(['ada', 'maya', 'jon', 'sam']);
const selectedRegions = ref(['na', 'emea', 'apac']);
const forecastMode = ref('weighted');
const mobileStage = ref('proposal');
const showExecutiveCommit = ref(true);
const reviewOpen = ref(false);
const lastSavedAt = ref('');

const selectedDeal = computed(() => deals.value.find((deal) => deal.id === selectedDealId.value) || deals.value[0]);
const filteredDeals = computed(() => deals.value.filter((deal) => {
	return selectedOwners.value.includes(deal.owner) && selectedRegions.value.includes(deal.region);
}));
const visibleStages = computed(() => stages.map((stage) => ({
	...stage,
	deals: filteredDeals.value.filter((deal) => deal.stage === stage.value),
})));
const mobileStageOptions = computed(() => visibleStages.value.map((stage) => ({
	value: stage.value,
	label: `${stage.label} (${stage.deals.length})`,
})));
const activeMobileStage = computed(() => visibleStages.value.find((stage) => stage.value === mobileStage.value) || visibleStages.value[0]);
const openPipelineValue = computed(() => filteredDeals.value.reduce((sum, deal) => sum + deal.value, 0));
const weightedForecastValue = computed(() => filteredDeals.value.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0));
const commitValue = computed(() => filteredDeals.value.filter((deal) => deal.forecast === 'Commit').reduce((sum, deal) => sum + deal.value, 0));
const riskCount = computed(() => filteredDeals.value.filter((deal) => deal.risks.length).length);
const commitCoverage = computed(() => {
	if (!openPipelineValue.value) return 0;
	return Math.round((commitValue.value / openPipelineValue.value) * 100);
});
const payload = computed(() => {
	const deal = selectedDeal.value;

	return {
		view: {
			mode: forecastMode.value,
			ownerIds: selectedOwners.value,
			regions: selectedRegions.value,
			showExecutiveCommit: showExecutiveCommit.value,
		},
		selectedDeal: {
			id: deal.id,
			stage: deal.stage,
			value: deal.value,
			probability: deal.probability,
			forecast: deal.forecast,
			closeDate: deal.closeDate,
			nextStep: deal.nextStep,
			stakeholders: deal.stakeholders,
			closePlan: deal.closePlan,
		},
		forecast: {
			openPipeline: openPipelineValue.value,
			weighted: Math.round(weightedForecastValue.value),
			commit: commitValue.value,
		},
	};
});
const payloadJson = computed(() => JSON.stringify(payload.value, null, 2));

watch(selectedDeal, (deal) => {
	if (deal) mobileStage.value = deal.stage;
});

function money(value) {
	return new Intl.NumberFormat('en', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}

function selectDeal(deal) {
	selectedDealId.value = deal.id;
	mobileStage.value = deal.stage;
}

function openReview(deal) {
	selectDeal(deal);
	reviewOpen.value = true;
}

function forecastToneFor(forecast) {
	if (forecast === 'Commit') return 'success';
	if (forecast === 'Best case') return 'primary';
	return 'neutral';
}

function saveReview() {
	selectedDeal.value.forecastTone = forecastToneFor(selectedDeal.value.forecast);
	lastSavedAt.value = 'Saved just now';
	reviewOpen.value = false;
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-xl shadow-black/10">
		<header class="border-b border-border skin-card">
			<div class="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-6">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<span class="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
								<path d="M4 7h4v10H4V7Zm6-3h4v13h-4V4Zm6 6h4v7h-4v-7ZM3 20h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</span>
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Revenue operations</p>
							<h2 class="text-2xl font-semibold text-canvas-fg">Enterprise pipeline</h2>
						</div>
					</div>
					<p class="mt-3 max-w-3xl text-sm leading-6 text-muted-fg">
						Review deal stages, forecast coverage, owner focus, and close-plan readiness without forcing a permanent inspector panel.
					</p>
				</div>

				<div class="grid grid-cols-3 gap-2 text-sm sm:min-w-[28rem]">
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-xs text-muted-fg">Pipeline</p>
						<p class="mt-1 font-semibold">{{ money(openPipelineValue) }}</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-xs text-muted-fg">Weighted</p>
						<p class="mt-1 font-semibold">{{ money(weightedForecastValue) }}</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-xs text-muted-fg">Commit</p>
						<p class="mt-1 font-semibold">{{ money(commitValue) }}</p>
					</div>
				</div>
			</div>

			<div class="grid gap-3 border-t border-border p-4 lg:grid-cols-[1fr_1fr_auto] lg:p-6">
				<DomTagCombobox
					v-model="selectedOwners"
					:options="ownerOptions"
					label="Owners"
					placeholder="Filter owner"
				>
					<template #item="{ item }">
						<div class="flex min-w-0 items-center justify-between gap-3">
							<div class="min-w-0">
								<span class="block truncate font-medium">{{ item.label }}</span>
								<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
							</div>
							<span class="shrink-0 text-xs text-muted-fg">{{ item.meta }}</span>
						</div>
					</template>
				</DomTagCombobox>

				<DomTagCombobox
					v-model="selectedRegions"
					:options="regionOptions"
					label="Regions"
					placeholder="Filter region"
				>
					<template #item="{ item }">
						<div class="flex min-w-0 items-center justify-between gap-3">
							<div class="min-w-0">
								<span class="block truncate font-medium">{{ item.label }}</span>
								<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
							</div>
							<span class="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-fg">{{ item.count }}</span>
						</div>
					</template>
				</DomTagCombobox>

				<div class="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_auto] lg:min-w-[28rem]">
					<DomToggleButtonGroup
						v-model="forecastMode"
						label="Forecast mode"
						:options="forecastModes"
					/>
					<div class="flex items-end">
						<DomToggle
							v-model="showExecutiveCommit"
							label="Exec commit"
							description="Highlight committed deals."
						/>
					</div>
				</div>
			</div>
		</header>

		<main class="grid gap-0">
			<section class="min-w-0">
				<div class="hidden gap-4 overflow-x-auto p-4 lg:flex lg:p-6">
					<DealStageColumn
						v-for="stage in visibleStages"
						:key="stage.value"
						:stage="stage"
						:deals="stage.deals"
						:selected-deal-id="selectedDeal?.id"
						@select="openReview"
					/>
				</div>

				<div class="grid gap-4 p-4 lg:hidden">
					<DomToggleButtonGroup
						v-model="mobileStage"
						label="Stage"
						:options="mobileStageOptions"
					/>
					<div class="grid gap-3">
						<button
							v-for="deal in activeMobileStage.deals"
							:key="deal.id"
							type="button"
							class="rounded-lg border border-border bg-canvas p-4 text-left shadow-sm"
							@click="openReview(deal)"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="truncate font-semibold">{{ deal.account }}</p>
									<p class="mt-1 truncate text-sm text-muted-fg">{{ deal.description }}</p>
								</div>
								<ForecastPill :tone="deal.forecastTone" :label="deal.forecast" />
							</div>
							<div class="mt-4 flex items-end justify-between">
								<p class="text-lg font-semibold">{{ money(deal.value) }}</p>
								<p class="text-sm text-muted-fg">{{ deal.probability }}%</p>
							</div>
						</button>
						<div v-if="!activeMobileStage.deals.length" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-fg">
							No matching deals in {{ activeMobileStage.label }}.
						</div>
					</div>
				</div>
			</section>

			<section class="grid gap-4 border-t border-border bg-secondary/30 p-4 lg:grid-cols-[minmax(0,1fr)_18rem_minmax(20rem,24rem)] lg:p-6">
				<div class="rounded-lg border border-border bg-canvas p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Selected deal</p>
							<h3 class="mt-1 text-lg font-semibold">{{ selectedDeal.account }}</h3>
						</div>
						<ForecastPill :tone="selectedDeal.forecastTone" :label="selectedDeal.forecast" />
					</div>
					<p class="mt-2 text-sm text-muted-fg">{{ selectedDeal.description }}</p>
					<div class="mt-4 grid grid-cols-2 gap-2 text-sm">
						<div class="rounded-md bg-secondary p-3">
							<p class="text-xs text-muted-fg">Value</p>
							<p class="mt-1 font-semibold">{{ money(selectedDeal.value) }}</p>
						</div>
						<div class="rounded-md bg-secondary p-3">
							<p class="text-xs text-muted-fg">Probability</p>
							<p class="mt-1 font-semibold">{{ selectedDeal.probability }}%</p>
						</div>
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						<span
							v-for="stakeholder in selectedDeal.stakeholders"
							:key="stakeholder"
							class="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-fg"
						>
							{{ stakeholder }}
						</span>
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						<DomButton size="sm" @click="reviewOpen = true">Review deal</DomButton>
						<DomButton size="sm" variant="secondary">Log activity</DomButton>
						<DomTooltip text="Export the current forecast payload" placement="top">
							<button type="button" class="grid size-9 place-items-center rounded-lg border border-border bg-canvas text-muted-fg hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label="Export forecast payload">
								<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
									<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</button>
						</DomTooltip>
					</div>
					<p v-if="lastSavedAt" class="mt-3 text-xs text-success">{{ lastSavedAt }}</p>
				</div>

				<div class="rounded-lg border border-border bg-canvas p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h3 class="font-semibold">Forecast health</h3>
							<p class="mt-1 text-sm text-muted-fg">Coverage across filtered opportunities.</p>
						</div>
						<span class="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">{{ commitCoverage }}%</span>
					</div>
					<div class="mt-4 space-y-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Open deals</span>
							<span class="font-semibold">{{ filteredDeals.length }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Risk flags</span>
							<span class="font-semibold">{{ riskCount }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Commit coverage</span>
							<span class="font-semibold">{{ commitCoverage }}%</span>
						</div>
					</div>
				</div>

				<div class="rounded-lg border border-border bg-canvas p-4">
					<h3 class="font-semibold">Command payload</h3>
					<p class="mt-1 text-sm text-muted-fg">Use this shape for save, transition, or forecast export commands.</p>
					<pre class="mt-4 max-h-80 overflow-auto rounded-lg bg-secondary p-3 text-xs leading-5 text-muted-fg">{{ payloadJson }}</pre>
				</div>
			</section>
		</main>

		<DomDialog
			v-model="reviewOpen"
			title="Review deal"
			description="Update stage, probability, and close-plan details before saving the opportunity command."
		>
			<div v-if="selectedDeal" class="grid gap-4">
				<div class="rounded-lg border border-border bg-secondary/40 p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold">{{ selectedDeal.account }}</p>
							<p class="mt-1 text-sm text-muted-fg">{{ selectedDeal.description }}</p>
						</div>
						<p class="shrink-0 font-semibold">{{ money(selectedDeal.value) }}</p>
					</div>
				</div>

				<DomListbox v-model="selectedDeal.stage" :options="stages" label="Stage">
					<template #option="{ option }">
						<div class="min-w-0">
							<span class="block font-medium">{{ option.label }}</span>
							<span class="block text-xs text-muted-fg">{{ option.description }}</span>
						</div>
						<span class="text-xs font-semibold text-muted-fg">{{ option.defaultProbability }}%</span>
					</template>
				</DomListbox>

				<DomRangeInput
					v-model="selectedDeal.probability"
					label="Probability"
					description="Use seller judgment here; server forecast rules can still override rollups."
					:min="0"
					:max="100"
					:step="5"
					suffix="%"
				/>

				<DomListbox
					v-model="selectedDeal.forecast"
					label="Forecast category"
					:options="[
						{ value: 'Pipeline', label: 'Pipeline', description: 'Early, uncommitted opportunity.' },
						{ value: 'Best case', label: 'Best case', description: 'Possible this period with active work.' },
						{ value: 'Commit', label: 'Commit', description: 'Expected to close this period.' },
					]"
				>
					<template #option="{ option }">
						<span class="block font-medium">{{ option.label }}</span>
						<span class="block text-xs text-muted-fg">{{ option.description }}</span>
					</template>
				</DomListbox>

				<DomTextareaInput
					v-model="selectedDeal.closePlan"
					label="Close plan"
					:rows="4"
				/>
			</div>

			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton @click="saveReview">Save deal</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
