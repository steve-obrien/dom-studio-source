<script setup>
import { computed, ref } from 'vue';
import {
	DomActionSheet,
	DomAppBottomNav,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomDialog,
	DomRadioGroup,
	DomRangeInput,
	DomStatusPill,
	DomToggle,
} from '@getdom/studio/vue';
import CardControlRow from '../components/CardControlRow.vue';
import CardPreview from '../components/CardPreview.vue';
import SpendLimitMeter from '../components/SpendLimitMeter.vue';

const iconPaths = {
	back: 'M15 18l-6-6 6-6',
	bell: 'M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m2 0a2 2 0 0 0 4 0',
	card: 'M4 7h16v10H4V7Zm0 3h16M7 15h4',
	lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Zm6 4v2',
	globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-8-9h16M12 3c2.2 2.5 3.3 5.5 3.3 9s-1.1 6.5-3.3 9M12 3c-2.2 2.5-3.3 5.5-3.3 9s1.1 6.5 3.3 9',
	cash: 'M4 7h16v10H4V7Zm3 3h.01M17 14h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
	wallet: 'M5 7h13a2 2 0 0 1 2 2v8H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11M16 13h4',
	shield: 'M12 3l7 3v5c0 4.2-2.8 7.8-7 10-4.2-2.2-7-5.8-7-10V6l7-3Zm-3 9 2 2 4-5',
	plane: 'M10 21l2-7-7-2 1.5-2 6.5.5 3-6.5a1.8 1.8 0 0 1 3.3 1.4L16 12l5 .5-1.5 2-5.5.5-2 6h-2Z',
	replace: 'M7 7h11v7M17 4l3 3-3 3M17 17H6v-7M7 20l-3-3 3-3',
};

const cards = [
	{
		id: 'founder-card',
		name: 'Founder card',
		type: 'Virtual card',
		holder: 'Maya Chen',
		last4: '2048',
		expiry: '08/29',
		status: 'Active',
		spent: 1840,
		limit: 3200,
		merchant: 'SaaS and travel',
	},
	{
		id: 'team-card',
		name: 'Design team',
		type: 'Team budget',
		holder: 'Design Ops',
		last4: '9182',
		expiry: '03/28',
		status: 'Active',
		spent: 620,
		limit: 1500,
		merchant: 'Tools only',
	},
	{
		id: 'vendor-card',
		name: 'Vendor card',
		type: 'Single vendor',
		holder: 'Finance',
		last4: '7710',
		expiry: '11/27',
		status: 'Review',
		spent: 290,
		limit: 900,
		merchant: 'Cloud infra',
	},
];

const periodOptions = [
	{ label: 'Daily', value: 'daily', description: 'Resets every night' },
	{ label: 'Weekly', value: 'weekly', description: 'Best for field teams' },
	{ label: 'Monthly', value: 'monthly', description: 'Matches close cycle' },
];

const navItems = [
	{ value: 'home', label: 'Home', icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4v-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>` },
	{ value: 'cards', label: 'Cards', badge: '3', icon: `<svg viewBox="0 0 24 24" fill="none"><path d="${iconPaths.card}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
	{ value: 'activity', label: 'Activity', icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V5m0 14h14M8 16l3-4 3 2 4-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
];

const activeCardId = ref(cards[0].id);
const activeNav = ref('cards');
const sheetOpen = ref(false);
const revealDialogOpen = ref(false);
const cardFrozen = ref(false);
const onlinePayments = ref(true);
const atmWithdrawals = ref(false);
const internationalPayments = ref(true);
const walletEnabled = ref(true);
const period = ref('monthly');
const spendLimit = ref(cards[0].limit);
const latestAction = ref('Controls synced 2 minutes ago');

const activeCard = computed(() => cards.find((card) => card.id === activeCardId.value) || cards[0]);
const projectedSpend = computed(() => Math.min(spendLimit.value, activeCard.value.spent + 280));
const actionSheetActions = computed(() => [
	{
		label: cardFrozen.value ? 'Unfreeze card' : 'Freeze card',
		description: cardFrozen.value ? 'Allow new purchases again' : 'Block new authorizations instantly',
		value: 'freeze',
	},
	{ label: 'Reveal card details', description: 'Require step-up authentication in production', value: 'reveal' },
	{ label: 'Add travel notice', description: 'Reduce false declines for upcoming trips', value: 'travel' },
	{ label: 'Replace card', description: 'Issue a new number and move subscriptions', value: 'replace', variant: 'danger' },
]);

function selectCard(card) {
	activeCardId.value = card.id;
	spendLimit.value = card.limit;
	latestAction.value = `${card.name} selected`;
}

function handleAction(action) {
	if (action.value === 'freeze') {
		cardFrozen.value = !cardFrozen.value;
		latestAction.value = cardFrozen.value ? 'Card frozen just now' : 'Card unfrozen just now';
		return;
	}

	if (action.value === 'reveal') {
		revealDialogOpen.value = true;
		latestAction.value = 'Secure details requested';
		return;
	}

	latestAction.value = `${action.label} queued for review`;
}

function saveLimit() {
	latestAction.value = `${period.value} limit saved at GBP ${spendLimit.value.toLocaleString('en-GB')}`;
}
</script>

<template>
	<div class="min-h-screen w-full bg-secondary p-3 text-canvas-fg sm:p-6">
		<div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] lg:items-start">
			<div class="mx-auto w-full max-w-[28rem] rounded-[2.25rem] border border-border bg-canvas-fg/90 p-2 shadow-2xl shadow-black/20">
				<DomAppShell variant="card" class="min-h-[46rem]">
					<template #top>
						<DomAppTopBar title="Cards" subtitle="Aster Business" :border="false">
							<template #leading>
								<button type="button" class="grid size-10 place-items-center rounded-full bg-secondary text-canvas-fg" aria-label="Back">
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path :d="iconPaths.back" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</button>
							</template>
							<template #trailing>
								<button type="button" class="grid size-10 place-items-center rounded-full bg-secondary text-canvas-fg" aria-label="Notifications">
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path :d="iconPaths.bell" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</button>
							</template>
						</DomAppTopBar>
					</template>

					<div class="space-y-5 px-4 pb-6">
						<CardPreview :card="activeCard" :frozen="cardFrozen" />

						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs font-semibold uppercase text-muted-fg">Current policy</p>
								<h2 class="mt-1 truncate text-xl font-semibold">{{ activeCard.merchant }}</h2>
							</div>
							<DomStatusPill :tone="cardFrozen ? 'danger' : 'success'" :label="cardFrozen ? 'Frozen' : 'Live'" />
						</div>

						<div class="grid grid-cols-3 gap-2">
							<button
								v-for="card in cards"
								:key="card.id"
								type="button"
								class="rounded-2xl border p-3 text-left transition"
								:class="card.id === activeCard.id ? 'border-primary bg-primary/10' : 'border-border bg-canvas hover:border-primary/40'"
								@click="selectCard(card)"
							>
								<span class="block truncate text-xs font-semibold">{{ card.name }}</span>
								<span class="mt-1 block text-[11px] text-muted-fg">•••• {{ card.last4 }}</span>
							</button>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<DomButton class="justify-center" @click="sheetOpen = true">
								Card actions
							</DomButton>
							<DomButton variant="secondary" class="justify-center" @click="saveLimit">
								Save limit
							</DomButton>
						</div>

						<SpendLimitMeter :spent="projectedSpend" :limit="spendLimit" currency="GBP" />

						<section class="rounded-3xl border border-border skin-card p-4">
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-xs font-semibold uppercase text-muted-fg">Limit editor</p>
									<h3 class="mt-1 text-base font-semibold">Authorization ceiling</h3>
								</div>
								<DomBadge tone="info" variant="outline">{{ period }}</DomBadge>
							</div>
							<div class="mt-4">
								<DomRangeInput v-model="spendLimit" label="Spend limit" :min="250" :max="5000" :step="50" suffix=" GBP" />
							</div>
							<div class="mt-4">
								<DomRadioGroup v-model="period" label="Reset cadence" :options="periodOptions">
									<template #option="{ option }">
										<span class="min-w-0">
											<span class="block font-semibold">{{ option.label }}</span>
											<span class="block text-xs text-muted-fg">{{ option.description }}</span>
										</span>
									</template>
								</DomRadioGroup>
							</div>
						</section>

						<section class="space-y-3">
							<CardControlRow title="Online payments" description="Allow web and in-app card checks" :icon="iconPaths.wallet">
								<template #trailing>
									<DomToggle v-model="onlinePayments" label="Online payments" class="card-toggle" />
								</template>
							</CardControlRow>
							<CardControlRow title="ATM withdrawals" description="Cash access remains blocked by default" :icon="iconPaths.cash">
								<template #trailing>
									<DomToggle v-model="atmWithdrawals" label="ATM withdrawals" class="card-toggle" />
								</template>
							</CardControlRow>
							<CardControlRow title="International use" description="Permit cross-border authorizations" :icon="iconPaths.globe">
								<template #trailing>
									<DomToggle v-model="internationalPayments" label="International use" class="card-toggle" />
								</template>
							</CardControlRow>
							<CardControlRow title="Wallet token" description="Apple Pay and Google Pay token active" :icon="iconPaths.shield">
								<template #trailing>
									<DomToggle v-model="walletEnabled" label="Wallet token" class="card-toggle" />
								</template>
							</CardControlRow>
						</section>

						<p class="rounded-2xl bg-secondary px-4 py-3 text-xs text-muted-fg">{{ latestAction }}</p>
					</div>

					<template #bottom>
						<DomAppBottomNav v-model="activeNav" :items="navItems" />
					</template>

					<template #overlay>
						<DomActionSheet
							v-model="sheetOpen"
							title="Card actions"
							:description="`Choose an action for ${activeCard.name}.`"
							:actions="actionSheetActions"
							@select="handleAction"
						/>
					</template>
				</DomAppShell>
			</div>

			<aside class="grid gap-4 lg:pt-8">
				<section class="rounded-3xl border border-border skin-card p-5">
					<div class="flex items-start justify-between gap-4">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Integration packet</p>
							<h2 class="mt-2 text-2xl font-semibold tracking-tight">Self-service controls for issued cards</h2>
						</div>
						<DomBadge tone="success">Mobile ready</DomBadge>
					</div>
					<p class="mt-3 text-sm leading-6 text-muted-fg">
						Use this pattern when customers, employees, or admins need to make high-confidence card changes without opening a support ticket. Keep the policy decisions server-backed and use the mobile UI as the clear control layer.
					</p>
				</section>

				<div class="grid gap-3 sm:grid-cols-2">
					<CardControlRow title="Freeze audit event" description="Persist old state, new state, actor, device, and reason." :icon="iconPaths.lock" />
					<CardControlRow title="Travel notice" description="Store region, start date, end date, and reviewer outcome." :icon="iconPaths.plane" />
					<CardControlRow title="Replacement flow" description="Move merchant tokens and ship physical cards from the backend." :icon="iconPaths.replace" />
					<CardControlRow title="Policy service" description="Return allowed controls per account, role, country, and risk state." :icon="iconPaths.shield" />
				</div>
			</aside>
		</div>

		<DomDialog
			v-model="revealDialogOpen"
			title="Reveal card details"
			description="Production apps should require step-up authentication before showing sensitive card data."
		>
			<div class="space-y-3 rounded-2xl bg-secondary p-4 font-mono text-sm">
				<p>4242 4242 4242 {{ activeCard.last4 }}</p>
				<p>EXP {{ activeCard.expiry }} / CVC 392</p>
				<p>{{ activeCard.holder.toUpperCase() }}</p>
			</div>
			<template #footer>
				<DomButton variant="secondary" data-close>Close</DomButton>
				<DomButton data-close>Copy once</DomButton>
			</template>
		</DomDialog>
	</div>
</template>

<style scoped>
.card-toggle :deep(> span) {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
</style>
