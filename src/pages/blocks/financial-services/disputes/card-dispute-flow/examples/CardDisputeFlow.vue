<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAppShell,
	DomAppTopBar,
	DomButton,
	DomDialog,
	DomNativeSelect,
	DomTabs,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';

const tabs = [
	{ key: 'reason', label: 'Reason' },
	{ key: 'evidence', label: 'Evidence' },
	{ key: 'protect', label: 'Protect' },
];

const reasonOptions = [
	{ label: 'I do not recognize this charge', value: 'unauthorized' },
	{ label: 'I was charged twice', value: 'duplicate' },
	{ label: 'The amount is wrong', value: 'wrong_amount' },
	{ label: 'Goods or service not received', value: 'not_received' },
	{ label: 'I cancelled before renewal', value: 'cancelled' },
];

const transactions = [
	{
		id: 'txn-luma-cloud',
		merchant: 'Luma Cloud Services',
		descriptor: 'LUMA*CLOUD PRO',
		category: 'Software',
		amount: 'GBP 128.40',
		value: 128.4,
		card: 'Virtual card ending 2048',
		date: 'Jun 10, 2026',
		status: 'Posted',
		deadline: '106 days left',
		eligible: true,
		risk: 'High',
		color: 'bg-sky-500',
	},
	{
		id: 'txn-harbor-market',
		merchant: 'Harbor Market',
		descriptor: 'HARBOR MARKET 018',
		category: 'Groceries',
		amount: 'GBP 42.16',
		value: 42.16,
		card: 'Physical card ending 9201',
		date: 'Jun 9, 2026',
		status: 'Posted',
		deadline: '107 days left',
		eligible: true,
		risk: 'Low',
		color: 'bg-emerald-500',
	},
	{
		id: 'txn-nova-stay',
		merchant: 'Nova Stay',
		descriptor: 'NOVA STAY DEPOSIT',
		category: 'Travel',
		amount: 'GBP 246.00',
		value: 246,
		card: 'Physical card ending 9201',
		date: 'May 28, 2026',
		status: 'Pending evidence',
		deadline: '91 days left',
		eligible: true,
		risk: 'Medium',
		color: 'bg-violet-500',
	},
];

const activity = [
	{ label: 'Transaction posted', detail: 'Available for dispute intake.', time: 'Jun 10' },
	{ label: 'Merchant descriptor enriched', detail: 'Category and support channel matched.', time: 'Jun 10' },
	{ label: 'Dispute window checked', detail: 'Case can be filed within the network deadline.', time: 'Today' },
];

const selectedTransactionId = ref(transactions[0].id);
const activeTab = ref('reason');
const reasonCode = ref('unauthorized');
const merchantContacted = ref(false);
const cardInPossession = ref(true);
const recognizeMerchant = ref(false);
const screenshotAttached = ref(true);
const cancellationProof = ref(false);
const freezeCard = ref(true);
const replaceCard = ref(false);
const caseDetails = ref('I do not recognize this subscription charge and I did not approve a renewal with this merchant.');
const submitDialogOpen = ref(false);
const submitted = ref(false);
const caseNumber = ref('');
const lastAction = ref('');

const selectedTransaction = computed(() => transactions.find((transaction) => transaction.id === selectedTransactionId.value) || transactions[0]);
const selectedReason = computed(() => reasonOptions.find((reason) => reason.value === reasonCode.value) || reasonOptions[0]);
const requiresMerchantContact = computed(() => ['not_received', 'cancelled', 'wrong_amount'].includes(reasonCode.value));
const requiresCancellationProof = computed(() => reasonCode.value === 'cancelled');
const detailLength = computed(() => caseDetails.value.trim().length);
const evidenceCount = computed(() => Number(screenshotAttached.value) + Number(cancellationProof.value));
const provisionalCreditEligible = computed(() => selectedTransaction.value.value < 250 && selectedTransaction.value.eligible);
const caseStatus = computed(() => {
	if (submitted.value) return 'Submitted';
	if (!selectedTransaction.value.eligible) return 'Not eligible';
	if (blockingChecks.value.length) return `${blockingChecks.value.length} blocker`;
	return warningChecks.value.length ? `${warningChecks.value.length} warning` : 'Ready';
});
const supportRoute = computed(() => {
	if (reasonCode.value === 'unauthorized') return 'Fraud operations';
	if (reasonCode.value === 'duplicate' || reasonCode.value === 'wrong_amount') return 'Billing dispute';
	return 'Merchant services review';
});

const disputeChecks = computed(() => [
	{
		key: 'eligible',
		label: 'Transaction eligible',
		detail: selectedTransaction.value.eligible ? `${selectedTransaction.value.deadline} to file` : 'This transaction is outside the dispute window.',
		status: selectedTransaction.value.eligible ? 'passed' : 'blocked',
		blocking: !selectedTransaction.value.eligible,
	},
	{
		key: 'reason',
		label: 'Reason selected',
		detail: selectedReason.value.label,
		status: reasonCode.value ? 'passed' : 'blocked',
		blocking: !reasonCode.value,
	},
	{
		key: 'details',
		label: 'Customer statement',
		detail: detailLength.value >= 40 ? `${detailLength.value} characters provided` : 'Add at least 40 characters for support review.',
		status: detailLength.value >= 40 ? 'passed' : 'blocked',
		blocking: detailLength.value < 40,
	},
	{
		key: 'merchant',
		label: 'Merchant contact',
		detail: requiresMerchantContact.value
			? merchantContacted.value ? 'Customer attempted merchant resolution.' : 'Ask the customer to contact the merchant first.'
			: 'Not required for this reason.',
		status: requiresMerchantContact.value && !merchantContacted.value ? 'warning' : 'passed',
		blocking: false,
	},
	{
		key: 'evidence',
		label: 'Evidence attached',
		detail: evidenceCount.value ? `${evidenceCount.value} evidence item${evidenceCount.value === 1 ? '' : 's'} ready` : 'Attach at least one screenshot, receipt, or message.',
		status: evidenceCount.value ? 'passed' : 'blocked',
		blocking: evidenceCount.value === 0,
	},
	{
		key: 'cancellation',
		label: 'Cancellation proof',
		detail: requiresCancellationProof.value
			? cancellationProof.value ? 'Cancellation proof included.' : 'Cancellation disputes need proof of cancellation.'
			: 'Not required for this reason.',
		status: requiresCancellationProof.value && !cancellationProof.value ? 'blocked' : 'passed',
		blocking: requiresCancellationProof.value && !cancellationProof.value,
	},
]);
const blockingChecks = computed(() => disputeChecks.value.filter((check) => check.blocking));
const warningChecks = computed(() => disputeChecks.value.filter((check) => check.status === 'warning'));
const completedChecks = computed(() => disputeChecks.value.filter((check) => check.status === 'passed').length);
const readinessPercent = computed(() => Math.round((completedChecks.value / disputeChecks.value.length) * 100));
const canSubmit = computed(() => blockingChecks.value.length === 0 && !submitted.value);
const submitLabel = computed(() => submitted.value ? 'Case submitted' : 'Submit dispute');

const casePayload = computed(() => ({
	transactionId: selectedTransaction.value.id,
	reasonCode: reasonCode.value,
	route: supportRoute.value,
	answers: {
		merchantContacted: merchantContacted.value,
		cardInPossession: cardInPossession.value,
		recognizeMerchant: recognizeMerchant.value,
		details: caseDetails.value,
	},
	evidence: [
		...(screenshotAttached.value ? [{ type: 'screenshot', status: 'ready' }] : []),
		...(cancellationProof.value ? [{ type: 'cancellation_proof', status: 'ready' }] : []),
	],
	controls: {
		freezeCard: freezeCard.value,
		replaceCard: replaceCard.value,
		provisionalCreditEligible: provisionalCreditEligible.value,
	},
	status: submitted.value ? 'submitted' : 'draft',
}));
const casePayloadJson = computed(() => JSON.stringify(casePayload.value, null, 2));

watch([selectedTransactionId, reasonCode], () => {
	submitted.value = false;
	caseNumber.value = '';
	lastAction.value = 'Dispute draft updated.';
});

function selectTransaction(transaction) {
	selectedTransactionId.value = transaction.id;
	activeTab.value = 'reason';
}

function openSubmitDialog() {
	if (!canSubmit.value) {
		activeTab.value = blockingChecks.value.some((check) => ['evidence', 'cancellation'].includes(check.key)) ? 'evidence' : 'reason';
		lastAction.value = 'Resolve required checks before submission.';
		return;
	}

	submitDialogOpen.value = true;
}

function submitDispute() {
	if (!canSubmit.value) return;
	submitted.value = true;
	caseNumber.value = `DSP-${Math.floor(20400 + selectedTransaction.value.value)}`;
	submitDialogOpen.value = false;
	activeTab.value = 'protect';
	lastAction.value = `${caseNumber.value} submitted to ${supportRoute.value}.`;
}

function checkClasses(status) {
	return {
		passed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
		blocked: 'bg-destructive/15 text-destructive',
	}[status] || 'bg-secondary text-muted-fg';
}

function transactionClasses(transaction) {
	return transaction.id === selectedTransaction.value.id
		? 'border-primary/70 bg-primary/10 shadow-lg shadow-primary/10'
		: 'border-border bg-canvas hover:border-primary/40';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<div class="grid gap-0 xl:grid-cols-[minmax(21rem,26rem)_minmax(0,1fr)]">
			<section class="skin-card p-4 sm:p-6">
				<div class="mx-auto h-[780px] max-h-[84vh] min-h-[680px] max-w-[25rem] overflow-hidden rounded-[2.25rem] border border-border bg-canvas shadow-2xl shadow-black/15">
					<DomAppShell variant="app">
						<template #top>
							<DomAppTopBar title="Dispute charge" subtitle="Card support" large>
								<template #leading>
									<button type="button" class="grid size-10 place-items-center rounded-full border border-border bg-canvas text-muted-fg" aria-label="Back to transactions">
										<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
											<path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</button>
								</template>
								<template #trailing>
									<span
										class="rounded-full px-3 py-1 text-xs font-semibold"
										:class="submitted ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : canSubmit ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'"
									>
										{{ caseStatus }}
									</span>
								</template>
							</DomAppTopBar>
						</template>

						<div class="space-y-4 px-4 py-4 pb-28">
							<section class="grid gap-3">
								<button
									v-for="transaction in transactions"
									:key="transaction.id"
									type="button"
									class="grid w-full gap-3 rounded-[1.5rem] border p-4 text-left transition"
									:class="transactionClasses(transaction)"
									@click="selectTransaction(transaction)"
								>
									<span class="flex items-start justify-between gap-3">
										<span class="flex min-w-0 items-start gap-3">
											<span class="mt-1 size-3 shrink-0 rounded-full" :class="transaction.color"></span>
											<span class="min-w-0">
												<span class="block truncate font-semibold">{{ transaction.merchant }}</span>
												<span class="mt-1 block truncate text-xs text-muted-fg">{{ transaction.descriptor }} / {{ transaction.date }}</span>
											</span>
										</span>
										<span class="shrink-0 text-sm font-semibold">{{ transaction.amount }}</span>
									</span>
									<span class="flex flex-wrap items-center gap-2 text-xs">
										<span class="rounded-full bg-secondary px-2.5 py-1 font-medium text-muted-fg">{{ transaction.status }}</span>
										<span class="rounded-full bg-secondary px-2.5 py-1 font-medium text-muted-fg">{{ transaction.deadline }}</span>
									</span>
								</button>
							</section>

							<section class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
								<div class="border-b border-border p-4">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected charge</p>
											<h3 class="mt-1 truncate text-xl font-semibold">{{ selectedTransaction.merchant }}</h3>
											<p class="mt-1 text-sm text-muted-fg">{{ selectedTransaction.card }}</p>
										</div>
										<p class="shrink-0 text-xl font-semibold">{{ selectedTransaction.amount }}</p>
									</div>
									<div class="mt-4">
										<div class="flex items-center justify-between text-xs font-semibold text-muted-fg">
											<span>Case readiness</span>
											<span>{{ readinessPercent }}%</span>
										</div>
										<div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
											<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${readinessPercent}%` }"></div>
										</div>
									</div>
								</div>

								<div class="p-4">
									<DomTabs v-model="activeTab" :tabs="tabs" />

									<section v-if="activeTab === 'reason'" class="mt-4 grid gap-4">
										<DomNativeSelect v-model="reasonCode" label="What happened?" :options="reasonOptions" />

										<div class="grid gap-3 rounded-2xl bg-secondary/60 p-3">
											<DomToggle
												v-model="cardInPossession"
												label="Card is still with me"
												description="Use this to decide whether replacement is recommended."
											/>
											<DomToggle
												v-model="recognizeMerchant"
												label="I recognize the merchant"
												description="Turn this on for amount, duplicate, or fulfilment issues."
											/>
											<DomToggle
												v-model="merchantContacted"
												label="I contacted the merchant"
												description="Often required for service, cancellation, or amount disputes."
											/>
										</div>

										<DomTextareaInput
											v-model="caseDetails"
											label="Tell us what happened"
											:rows="5"
											placeholder="Include dates, contact attempts, order numbers, or why the charge is unfamiliar."
										/>
									</section>

									<section v-else-if="activeTab === 'evidence'" class="mt-4 grid gap-4">
										<div class="grid gap-3 rounded-2xl border border-border bg-canvas p-4">
											<div class="flex items-center justify-between gap-4">
												<div>
													<h4 class="font-semibold">Screenshot or receipt</h4>
													<p class="mt-1 text-sm leading-6 text-muted-fg">Shows the charge, order, cancellation, or merchant reply.</p>
												</div>
												<DomToggle v-model="screenshotAttached" aria-label="Attach screenshot or receipt" />
											</div>
											<div class="flex items-center justify-between gap-4">
												<div>
													<h4 class="font-semibold">Cancellation proof</h4>
													<p class="mt-1 text-sm leading-6 text-muted-fg">Needed when the dispute is about a cancelled renewal.</p>
												</div>
												<DomToggle v-model="cancellationProof" aria-label="Attach cancellation proof" />
											</div>
										</div>

										<div class="rounded-2xl border border-dashed border-border bg-secondary/50 p-4">
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Upload state</p>
											<p class="mt-2 text-sm leading-6 text-muted-fg">
												This copyable block models upload readiness with toggles. Replace this area with your file picker, scan status, malware checks, and evidence thumbnails.
											</p>
										</div>
									</section>

									<section v-else class="mt-4 grid gap-4">
										<div class="rounded-2xl border border-border bg-canvas-fg p-4 text-canvas">
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-canvas/60">Protection recommendation</p>
											<h4 class="mt-2 text-xl font-semibold">{{ reasonCode === 'unauthorized' ? 'Freeze the card now' : 'Keep monitoring this card' }}</h4>
											<p class="mt-2 text-sm leading-6 text-canvas/70">
												{{ reasonCode === 'unauthorized' ? 'Unauthorized disputes should usually freeze spending while support reviews replacement options.' : 'This reason does not always require a card freeze, but customers can still choose it.' }}
											</p>
										</div>

										<div class="grid gap-3 rounded-2xl border border-border bg-canvas p-4">
											<DomToggle
												v-model="freezeCard"
												label="Freeze this card"
												description="Block new purchases while the case is reviewed."
											/>
											<DomToggle
												v-model="replaceCard"
												label="Request replacement card"
												description="Use for suspected compromise or lost card scenarios."
											/>
										</div>

										<div class="rounded-2xl bg-secondary/60 p-4">
											<p class="text-sm font-semibold">Provisional credit</p>
											<p class="mt-1 text-sm leading-6 text-muted-fg">
												{{ provisionalCreditEligible ? 'This case can be screened for provisional credit after submission.' : 'This charge needs support review before credit eligibility.' }}
											</p>
										</div>
									</section>
								</div>
							</section>
						</div>

						<template #bottom>
							<div class="border-t border-border bg-canvas/95 px-4 py-3 shadow-[0_-18px_45px_rgba(15,23,42,0.12)] backdrop-blur">
								<div v-if="lastAction" class="mb-3 rounded-xl bg-secondary/70 px-3 py-2 text-sm text-muted-fg">
									{{ lastAction }}
								</div>
								<div class="flex items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ caseStatus }}</p>
										<p class="truncate text-sm font-semibold">{{ supportRoute }}</p>
									</div>
									<DomButton :disabled="submitted" @click="openSubmitDialog">{{ submitLabel }}</DomButton>
								</div>
							</div>
						</template>
					</DomAppShell>
				</div>
			</section>

			<aside class="grid min-w-0 gap-5 p-4 sm:p-6 xl:border-l xl:border-border">
				<section class="rounded-3xl border border-border bg-canvas p-5 shadow-xl shadow-black/5">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div class="min-w-0">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Case packet</p>
							<h3 class="mt-2 text-2xl font-semibold tracking-tight">{{ selectedTransaction.merchant }}</h3>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
								Review the dispute route, customer statement, evidence readiness, and card protection decisions before creating the support case.
							</p>
						</div>
						<span
							class="rounded-full px-3 py-1 text-xs font-semibold"
							:class="submitted ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : canSubmit ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'"
						>
							{{ caseStatus }}
						</span>
					</div>

					<div class="mt-5 grid gap-3 sm:grid-cols-3">
						<div class="rounded-2xl border border-border bg-secondary/40 p-4">
							<p class="text-2xl font-semibold">{{ selectedTransaction.amount }}</p>
							<p class="mt-1 text-xs font-medium text-muted-fg">Disputed amount</p>
						</div>
						<div class="rounded-2xl border border-border bg-secondary/40 p-4">
							<p class="text-2xl font-semibold">{{ evidenceCount }}</p>
							<p class="mt-1 text-xs font-medium text-muted-fg">Evidence items</p>
						</div>
						<div class="rounded-2xl border border-border bg-secondary/40 p-4">
							<p class="text-2xl font-semibold">{{ readinessPercent }}%</p>
							<p class="mt-1 text-xs font-medium text-muted-fg">Ready</p>
						</div>
					</div>
				</section>

				<section class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
					<div class="rounded-3xl border border-border bg-canvas p-5">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h4 class="font-semibold">Readiness checks</h4>
								<p class="mt-1 text-sm text-muted-fg">These mirror backend dispute eligibility.</p>
							</div>
							<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">{{ completedChecks }} of {{ disputeChecks.length }}</span>
						</div>

						<div class="mt-4 grid gap-3">
							<div v-for="check in disputeChecks" :key="check.key" class="rounded-2xl border border-border bg-canvas p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="font-semibold">{{ check.label }}</p>
										<p class="mt-1 text-sm leading-6 text-muted-fg">{{ check.detail }}</p>
									</div>
									<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="checkClasses(check.status)">
										{{ check.status }}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div class="grid gap-3">
						<section class="rounded-3xl border border-border bg-canvas p-5">
							<h4 class="font-semibold">Timeline</h4>
							<div class="mt-4 grid gap-4">
								<div v-for="event in activity" :key="event.label" class="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 text-sm">
									<span class="font-semibold text-muted-fg">{{ event.time }}</span>
									<span>
										<span class="block font-medium">{{ event.label }}</span>
										<span class="mt-0.5 block leading-5 text-muted-fg">{{ event.detail }}</span>
									</span>
								</div>
								<div v-if="submitted" class="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 text-sm">
									<span class="font-semibold text-muted-fg">Now</span>
									<span>
										<span class="block font-medium">{{ caseNumber }} created</span>
										<span class="mt-0.5 block leading-5 text-muted-fg">Routed to {{ supportRoute }} with customer protection choices.</span>
									</span>
								</div>
							</div>
						</section>

						<section class="rounded-3xl border border-border bg-canvas-fg p-5 text-canvas">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-canvas/60">Route</p>
							<h4 class="mt-2 text-xl font-semibold">{{ supportRoute }}</h4>
							<p class="mt-2 text-sm leading-6 text-canvas/70">
								{{ selectedReason.label }} cases should carry structured answers, evidence files, and card-control events into the support queue.
							</p>
						</section>
					</div>
				</section>

				<section class="rounded-3xl border border-border bg-canvas p-5">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold">Draft payload preview</h4>
							<p class="mt-1 text-sm text-muted-fg">Useful for wiring your API contract and support queue handoff.</p>
						</div>
						<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">{{ selectedTransaction.id }}</span>
					</div>
					<pre class="mt-4 max-h-72 overflow-auto rounded-2xl bg-secondary/70 p-4 text-xs leading-5 text-muted-fg"><code>{{ casePayloadJson }}</code></pre>
				</section>
			</aside>
		</div>

		<DomDialog
			v-model="submitDialogOpen"
			title="Submit dispute case"
			:description="`Create a dispute for ${selectedTransaction.amount} at ${selectedTransaction.merchant}.`"
		>
			<div class="space-y-4">
				<div class="rounded-lg border border-border bg-secondary/50 p-3 text-sm">
					<div class="flex items-center justify-between gap-3">
						<span class="font-medium text-muted-fg">Reason</span>
						<span class="font-semibold">{{ selectedReason.label }}</span>
					</div>
					<div class="mt-2 flex items-center justify-between gap-3">
						<span class="font-medium text-muted-fg">Route</span>
						<span class="font-semibold">{{ supportRoute }}</span>
					</div>
					<div class="mt-2 flex items-center justify-between gap-3">
						<span class="font-medium text-muted-fg">Protection</span>
						<span class="font-semibold">{{ freezeCard ? 'Freeze card' : 'No freeze' }}</span>
					</div>
				</div>
				<p class="text-sm leading-6 text-muted-fg">
					Submitting should create an immutable customer statement, lock the selected evidence snapshot, and queue card-control actions server-side.
				</p>
			</div>

			<template #footer>
				<DomButton variant="secondary" @click="submitDialogOpen = false">Keep editing</DomButton>
				<DomButton @click="submitDispute">Submit case</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
