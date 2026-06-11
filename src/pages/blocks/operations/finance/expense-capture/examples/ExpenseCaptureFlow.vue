<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomActionSheet,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomButton,
	DomNativeSelect,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const categoryOptions = [
	{ label: 'Meals and entertainment', value: 'Meals and entertainment' },
	{ label: 'Travel', value: 'Travel' },
	{ label: 'Software', value: 'Software' },
	{ label: 'Office supplies', value: 'Office supplies' },
	{ label: 'Client gifts', value: 'Client gifts' },
];

const projectOptions = [
	{ label: 'Launch workshop', value: 'Launch workshop' },
	{ label: 'Customer success', value: 'Customer success' },
	{ label: 'Recruiting', value: 'Recruiting' },
	{ label: 'Unassigned', value: 'Unassigned' },
];

const paymentOptions = [
	{ label: 'Company card ending 2048', value: 'Company card ending 2048' },
	{ label: 'Personal card', value: 'Personal card' },
	{ label: 'Cash', value: 'Cash' },
];

const extractionRows = [
	{ label: 'Merchant', value: 'Northstar Coffee', confidence: 97 },
	{ label: 'Total', value: 'GBP 42.80', confidence: 94 },
	{ label: 'Date', value: 'Jun 10, 2026', confidence: 89 },
	{ label: 'VAT', value: 'Included', confidence: 82 },
];

const activity = [
	{ label: 'Receipt uploaded', detail: 'Image scan completed with 91% confidence.', time: '09:42' },
	{ label: 'Card match found', detail: 'Matched company card transaction ending 2048.', time: '09:43' },
	{ label: 'Policy check queued', detail: 'Meal limit and project coding rules evaluated.', time: '09:44' },
];

const merchant = ref('Northstar Coffee');
const amount = ref('42.80');
const spentAt = ref('2026-06-10');
const category = ref('Meals and entertainment');
const project = ref('Launch workshop');
const paymentMethod = ref('Company card ending 2048');
const reimbursable = ref(false);
const taxIncluded = ref(true);
const notes = ref('Client workshop breakfast before launch planning.');
const receiptAttached = ref(true);
const sheetOpen = ref(false);
const submitted = ref(false);
const selectedReceiptAction = ref('Ready');

const numericAmount = computed(() => {
	const parsed = Number.parseFloat(amount.value);
	return Number.isFinite(parsed) ? parsed : 0;
});

const policyChecks = computed(() => [
	{
		label: 'Receipt attached',
		detail: receiptAttached.value ? 'Original image is available for audit.' : 'Attach a receipt before submission.',
		status: receiptAttached.value ? 'passed' : 'blocked',
		blocking: !receiptAttached.value,
	},
	{
		label: 'Project selected',
		detail: project.value === 'Unassigned' ? 'Choose a project before submit.' : `${project.value} will receive the cost.`,
		status: project.value === 'Unassigned' ? 'blocked' : 'passed',
		blocking: project.value === 'Unassigned',
	},
	{
		label: 'Meal policy',
		detail: numericAmount.value > 35 && category.value === 'Meals and entertainment'
			? 'Over the GBP 35 meal guidance. Add context for finance.'
			: 'Amount is within the selected category guidance.',
		status: numericAmount.value > 35 && category.value === 'Meals and entertainment' ? 'warning' : 'passed',
		blocking: false,
	},
	{
		label: 'Reimbursement route',
		detail: reimbursable.value ? 'Will route to payroll after approval.' : 'Will reconcile against the card feed.',
		status: 'passed',
		blocking: false,
	},
]);

const blockingChecks = computed(() => policyChecks.value.filter((check) => check.blocking));
const warningChecks = computed(() => policyChecks.value.filter((check) => check.status === 'warning'));
const canSubmit = computed(() => {
	return Boolean(
		merchant.value.trim()
		&& numericAmount.value > 0
		&& spentAt.value
		&& category.value
		&& blockingChecks.value.length === 0
	);
});
const readinessLabel = computed(() => {
	if (submitted.value) return 'Submitted';
	if (blockingChecks.value.length) return `${blockingChecks.value.length} blocker`;
	if (warningChecks.value.length) return `${warningChecks.value.length} warning`;
	return 'Ready';
});
const submitLabel = computed(() => submitted.value ? 'Submitted for approval' : 'Submit expense');
const reimbursementLabel = computed(() => reimbursable.value ? 'Reimbursable' : 'Company card');
const expensePayload = computed(() => ({
	merchant: merchant.value,
	amount: {
		value: numericAmount.value,
		currency: 'GBP',
		taxIncluded: taxIncluded.value,
	},
	spentAt: spentAt.value,
	category: category.value,
	project: project.value,
	paymentMethod: paymentMethod.value,
	reimbursable: reimbursable.value,
	notes: notes.value,
	status: submitted.value ? 'submitted' : 'draft',
}));
const expensePayloadJson = computed(() => JSON.stringify(expensePayload.value, null, 2));

watch([merchant, amount, spentAt, category, project, paymentMethod, reimbursable, taxIncluded, notes], () => {
	submitted.value = false;
});

function formatMoney(value) {
	return `GBP ${value.toFixed(2)}`;
}

function submitExpense() {
	if (!canSubmit.value) return;
	submitted.value = true;
}

function handleReceiptAction(action) {
	selectedReceiptAction.value = action.label;
	receiptAttached.value = action.value !== 'remove';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<div class="grid gap-0 lg:grid-cols-[minmax(22rem,26rem)_minmax(0,1fr)]">
			<section class="skin-raised p-4 sm:p-6">
				<div class="mx-auto h-[780px] max-h-[82vh] min-h-[680px] max-w-[25rem] overflow-hidden rounded-[2.25rem] border border-border bg-background shadow-2xl shadow-black/15">
					<DomAppShell variant="app">
						<template #top>
							<DomAppTopBar title="New expense" subtitle="Receipt capture" large>
								<template #leading>
									<button type="button" class="grid size-10 place-items-center rounded-full border border-border bg-background text-muted-fg" aria-label="Close expense">
										<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
											<path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</button>
								</template>
								<template #trailing>
									<button type="button" class="grid size-10 place-items-center rounded-full bg-secondary text-muted-fg" aria-label="Scan settings">
										<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
											<path d="M12 8v8M8 12h8M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
										</svg>
									</button>
								</template>
							</DomAppTopBar>
						</template>

						<div class="space-y-4 px-4 py-4 pb-28">
							<section class="overflow-hidden rounded-[1.75rem] border border-border bg-fg text-background shadow-lg shadow-black/10">
								<div class="relative min-h-56 p-4">
									<div class="absolute inset-4 rounded-2xl border border-background/20 bg-[linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.04))]"></div>
									<div class="relative grid gap-4">
										<div class="flex items-start justify-between gap-4">
											<div>
												<p class="text-xs font-semibold uppercase tracking-[0.16em] text-background/55">Receipt</p>
												<h3 class="mt-1 text-xl font-semibold">Northstar Coffee</h3>
											</div>
											<span class="rounded-full bg-background/15 px-3 py-1 text-xs font-semibold">{{ selectedReceiptAction }}</span>
										</div>
										<div class="grid gap-2 rounded-2xl bg-background/10 p-3 text-xs">
											<div v-for="row in extractionRows" :key="row.label" class="flex items-center justify-between gap-3">
												<span class="text-background/60">{{ row.label }}</span>
												<span class="font-medium">{{ row.value }}</span>
											</div>
										</div>
										<div class="flex items-center justify-between gap-3">
											<div>
												<p class="text-3xl font-semibold tracking-tight">{{ formatMoney(numericAmount) }}</p>
												<p class="mt-1 text-xs text-background/60">OCR confidence 91%</p>
											</div>
											<DomButton size="sm" variant="secondary" @click="sheetOpen = true">{{ receiptAttached ? 'Receipt' : 'Attach' }}</DomButton>
										</div>
									</div>
								</div>
							</section>

							<section class="overflow-hidden rounded-[1.5rem] border border-border bg-background">
								<DomAppListItem label="Status" description="Finance can audit receipt, card match, and policy output." :meta="readinessLabel">
									<template #icon>
										<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
											<path d="M9 12l2 2 4-5M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</template>
								</DomAppListItem>
								<DomAppListItem label="Route" :description="paymentMethod" :meta="reimbursementLabel">
									<template #icon>
										<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
											<path d="M4 7h16v10H4V7Zm0 4h16M8 15h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</template>
								</DomAppListItem>
							</section>

							<section class="grid gap-4 rounded-[1.5rem] border border-border bg-background p-4">
								<div class="grid grid-cols-2 gap-3">
									<DomTextInput v-model="merchant" label="Merchant" />
									<DomTextInput v-model="amount" label="Amount" inputmode="decimal" />
								</div>
								<DomTextInput v-model="spentAt" label="Date" type="date" />
								<DomNativeSelect v-model="category" label="Category" :options="categoryOptions" />
								<DomNativeSelect v-model="project" label="Project" :options="projectOptions" />
								<DomNativeSelect v-model="paymentMethod" label="Payment method" :options="paymentOptions" />
								<div class="grid gap-3 rounded-2xl bg-secondary/60 p-3">
									<DomToggle v-model="reimbursable" label="Reimburse employee" description="Route this through payroll instead of card reconciliation." />
									<DomToggle v-model="taxIncluded" label="Tax included" description="Keep this on when OCR detected VAT on the receipt." />
								</div>
								<DomTextareaInput v-model="notes" label="Memo" :rows="3" placeholder="Add client, attendee, or business purpose details." />
							</section>

							<section class="rounded-[1.5rem] border border-border bg-background p-4">
								<div class="flex items-center justify-between gap-3">
									<div>
										<h4 class="font-semibold tracking-tight">Policy checks</h4>
										<p class="mt-1 text-xs text-muted-fg">Resolved before finance review.</p>
									</div>
									<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">{{ policyChecks.length }} checks</span>
								</div>
								<div class="mt-4 space-y-3">
									<div v-for="check in policyChecks" :key="check.label" class="flex gap-3">
										<span
											class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold"
											:class="{
												'bg-success/15 text-success': check.status === 'passed',
												'bg-warning/15 text-warning': check.status === 'warning',
												'bg-destructive/15 text-destructive': check.status === 'blocked',
											}"
										>
											{{ check.status === 'passed' ? 'Y' : '!' }}
										</span>
										<div class="min-w-0">
											<p class="text-sm font-semibold">{{ check.label }}</p>
											<p class="mt-0.5 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
										</div>
									</div>
								</div>
							</section>
						</div>

						<template #bottom>
							<div class="border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
								<div class="flex items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ readinessLabel }}</p>
										<p class="truncate text-sm font-semibold">{{ formatMoney(numericAmount) }} to {{ project }}</p>
									</div>
									<DomButton :disabled="!canSubmit || submitted" @click="submitExpense">{{ submitLabel }}</DomButton>
								</div>
							</div>
						</template>

						<template #overlay>
							<DomActionSheet
								v-model="sheetOpen"
								title="Receipt actions"
								description="Use these commands after capture or OCR review."
								:actions="[
									{ label: 'Retake receipt photo', description: 'Replace the current image', value: 'retake' },
									{ label: 'Upload PDF receipt', description: 'Attach a file from the device', value: 'upload' },
									{ label: 'Remove receipt', description: 'Keep fields but clear evidence', value: 'remove', variant: 'danger' },
								]"
								@select="handleReceiptAction"
							/>
						</template>
					</DomAppShell>
				</div>
			</section>

			<aside class="grid min-w-0 gap-5 p-4 sm:p-6 lg:border-l lg:border-border">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Expense capture</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Review the receipt, resolve policy, submit once.</h3>
					<p class="mt-3 max-w-2xl text-sm leading-6 text-muted-fg">
						This block is intentionally mobile-first for field teams, sales reps, founders, and operations staff who need to file spend before context disappears.
					</p>
				</div>

				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-2xl border border-border bg-background p-4">
						<p class="text-2xl font-semibold">{{ formatMoney(numericAmount) }}</p>
						<p class="mt-1 text-xs font-medium text-muted-fg">Detected total</p>
					</div>
					<div class="rounded-2xl border border-border bg-background p-4">
						<p class="text-2xl font-semibold">{{ warningChecks.length }}</p>
						<p class="mt-1 text-xs font-medium text-muted-fg">Warnings</p>
					</div>
					<div class="rounded-2xl border border-border bg-background p-4">
						<p class="text-2xl font-semibold">{{ blockingChecks.length }}</p>
						<p class="mt-1 text-xs font-medium text-muted-fg">Blockers</p>
					</div>
				</div>

				<div class="rounded-2xl border border-border bg-background p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold tracking-tight">Extracted fields</h4>
							<p class="mt-1 text-sm text-muted-fg">Show what OCR found and where humans edited.</p>
						</div>
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">91% confidence</span>
					</div>
					<div class="mt-4 grid gap-3">
						<div v-for="row in extractionRows" :key="row.label" class="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-3">
							<div class="min-w-0">
								<p class="text-sm font-semibold">{{ row.label }}</p>
								<p class="mt-0.5 truncate text-xs text-muted-fg">{{ row.value }}</p>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary" :style="{ width: `${row.confidence}%` }"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
					<div class="rounded-2xl border border-border bg-background p-4">
						<h4 class="font-semibold tracking-tight">Integration activity</h4>
						<div class="mt-4 space-y-4">
							<div v-for="item in activity" :key="item.label" class="grid grid-cols-[3rem_minmax(0,1fr)] gap-3">
								<span class="text-xs font-semibold text-muted-fg">{{ item.time }}</span>
								<div>
									<p class="text-sm font-semibold">{{ item.label }}</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
								</div>
							</div>
						</div>
					</div>

					<div class="rounded-2xl border border-border bg-fg p-4 text-background">
						<h4 class="font-semibold tracking-tight">Draft payload</h4>
						<pre class="mt-3 max-h-72 overflow-auto rounded-xl bg-background/10 p-3 text-[11px] leading-5 text-background/80">{{ expensePayloadJson }}</pre>
					</div>
				</div>
			</aside>
		</div>
	</div>
</template>
