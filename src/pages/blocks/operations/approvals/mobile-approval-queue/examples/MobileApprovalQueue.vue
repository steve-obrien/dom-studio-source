<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomDialog, DomNativeSelect, DomTabs, DomTextareaInput, DomToggle, DomTooltip } from '@getdom/studio/vue';

const queueTabs = [
	{ key: 'pending', label: 'Pending' },
	{ key: 'mine', label: 'Mine' },
	{ key: 'done', label: 'Done' },
];

const priorityOptions = [
	{ label: 'All priorities', value: 'all' },
	{ label: 'Due today', value: 'today' },
	{ label: 'High risk', value: 'high' },
	{ label: 'Finance', value: 'finance' },
];

const reasonOptions = [
	{ label: 'Needs more evidence', value: 'evidence' },
	{ label: 'Policy exception denied', value: 'policy' },
	{ label: 'Budget owner should review', value: 'budget' },
	{ label: 'Security review required', value: 'security' },
];

const approvalRequests = ref([
	{
		id: 'expense-client-dinner',
		type: 'Expense',
		title: 'Client dinner exception',
		requester: 'Maya Chen',
		team: 'Enterprise Success',
		object: 'Northstar launch dinner',
		amount: 'GBP 428.00',
		delta: 'GBP 78 above policy',
		due: 'Due in 42m',
		risk: 'Medium',
		filter: 'today',
		decision: 'pending',
		avatar: 'MC',
		accent: 'bg-amber-500',
		summary: 'Dinner for five customer stakeholders after the mobile rollout planning session.',
		impact: 'Will reimburse on Friday payroll if approved before 17:00.',
		policyChecks: [
			{ label: 'Receipt attached', status: 'passed' },
			{ label: 'Customer attendee listed', status: 'passed' },
			{ label: 'Meal limit exceeded', status: 'warning' },
		],
		evidence: [
			{ label: 'Receipt', value: 'Dinner-receipt.jpg' },
			{ label: 'Opportunity', value: 'Northstar expansion' },
			{ label: 'Budget', value: 'Customer success discretionary' },
		],
		activity: [
			{ label: 'Finance matched card transaction', time: '9m ago' },
			{ label: 'Maya added attendees', time: '21m ago' },
		],
	},
	{
		id: 'access-data-export',
		type: 'Access',
		title: 'Temporary export access',
		requester: 'Jon Bell',
		team: 'Data Platform',
		object: 'Warehouse export role',
		amount: '14 day grant',
		delta: 'Includes customer PII table',
		due: 'Due today',
		risk: 'High',
		filter: 'high',
		decision: 'pending',
		avatar: 'JB',
		accent: 'bg-rose-500',
		summary: 'Analyst needs temporary export access for a regulated customer reconciliation.',
		impact: 'Access auto-expires after two weeks and requires security sign-off.',
		policyChecks: [
			{ label: 'Manager approval ready', status: 'passed' },
			{ label: 'PII scope detected', status: 'warning' },
			{ label: 'Security reviewer missing', status: 'blocked' },
		],
		evidence: [
			{ label: 'Ticket', value: 'DATA-4921' },
			{ label: 'Dataset', value: 'customer_events_private' },
			{ label: 'Expiry', value: '2026-06-25' },
		],
		activity: [
			{ label: 'Access analyzer flagged PII', time: '18m ago' },
			{ label: 'Jon attached reconciliation ticket', time: '1h ago' },
		],
	},
	{
		id: 'discount-enterprise',
		type: 'Revenue',
		title: 'Enterprise discount approval',
		requester: 'Ari Patel',
		team: 'Sales',
		object: 'Acme annual renewal',
		amount: '18% discount',
		delta: 'Above 15% manager limit',
		due: 'Tomorrow',
		risk: 'Medium',
		filter: 'finance',
		decision: 'pending',
		avatar: 'AP',
		accent: 'bg-sky-500',
		summary: 'Account executive requests pricing approval to close a three-year expansion.',
		impact: 'Net revenue stays above floor with services add-on included.',
		policyChecks: [
			{ label: 'Revenue floor passed', status: 'passed' },
			{ label: 'Legal terms unchanged', status: 'passed' },
			{ label: 'Finance approval needed', status: 'warning' },
		],
		evidence: [
			{ label: 'ARR', value: 'USD 186,000' },
			{ label: 'Term', value: '36 months' },
			{ label: 'Close date', value: '2026-06-14' },
		],
		activity: [
			{ label: 'Deal desk added margin note', time: '34m ago' },
			{ label: 'Ari updated expansion scope', time: '2h ago' },
		],
	},
]);

const activeTab = ref('pending');
const priorityFilter = ref('all');
const selectedRequestId = ref(approvalRequests[0].id);
const reviewComplete = ref(false);
const biometricConfirm = ref(true);
const sheetExpanded = ref(false);
const decisionNote = ref('Reviewed receipt, attendee list, and budget owner context.');
const declineReason = ref(reasonOptions[0].value);
const declineDialogOpen = ref(false);
const actionLog = ref([
	{ label: 'You opened mobile approval queue', time: 'Now' },
	{ label: 'Push notification delivered', time: '3m ago' },
]);

const selectedRequest = computed(() => approvalRequests.value.find((request) => request.id === selectedRequestId.value) || approvalRequests.value[0]);
const pendingCount = computed(() => approvalRequests.value.filter((request) => request.decision === 'pending').length);
const readyCount = computed(() => approvalRequests.value.filter((request) => request.policyChecks.every((check) => check.status !== 'blocked')).length);
const filteredRequests = computed(() => {
	if (activeTab.value === 'done') return approvalRequests.value.filter((request) => request.decision !== 'pending');

	return approvalRequests.value.filter((request) => {
		if (request.decision !== 'pending') return false;
		if (activeTab.value === 'mine' && request.team !== 'Enterprise Success') return false;
		if (priorityFilter.value === 'all') return true;
		if (priorityFilter.value === 'high') return request.risk === 'High';
		return request.filter === priorityFilter.value;
	});
});
const hasBlockedCheck = computed(() => selectedRequest.value.policyChecks.some((check) => check.status === 'blocked'));
const canApprove = computed(() => reviewComplete.value && !hasBlockedCheck.value && selectedRequest.value.decision === 'pending');
const selectedDecisionLabel = computed(() => {
	if (selectedRequest.value.decision === 'approved') return 'Approved';
	if (selectedRequest.value.decision === 'declined') return 'Declined';
	if (hasBlockedCheck.value) return 'Needs escalation';
	return 'Ready for review';
});

function selectRequest(request) {
	selectedRequestId.value = request.id;
	reviewComplete.value = false;
	sheetExpanded.value = false;
}

function approveRequest() {
	if (!canApprove.value) return;
	selectedRequest.value.decision = 'approved';
	activeTab.value = 'done';
	actionLog.value = [
		{ label: `Approved ${selectedRequest.value.title}`, time: 'Just now' },
		...actionLog.value,
	];
}

function declineRequest() {
	selectedRequest.value.decision = 'declined';
	activeTab.value = 'done';
	declineDialogOpen.value = false;
	actionLog.value = [
		{ label: `Declined ${selectedRequest.value.title}`, time: 'Just now' },
		...actionLog.value,
	];
}

function escalateRequest() {
	actionLog.value = [
		{ label: `Escalated ${selectedRequest.value.title} to policy owner`, time: 'Just now' },
		...actionLog.value,
	];
}

function riskClasses(risk) {
	return {
		High: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
		Medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
		Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	}[risk] || 'bg-secondary text-muted-fg';
}

function checkClasses(status) {
	return {
		passed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
		blocked: 'bg-destructive/15 text-destructive',
	}[status] || 'bg-secondary text-muted-fg';
}

function requestClasses(request) {
	return request.id === selectedRequest.value.id
		? 'border-primary/60 bg-primary/5 shadow-lg shadow-primary/10'
		: 'border-border bg-background hover:border-primary/40';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<div class="grid gap-0 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
			<section class="skin-raised p-4 sm:p-6">
				<div class="mx-auto max-w-[26rem] rounded-[2rem] border border-border bg-background shadow-2xl shadow-black/15">
					<div class="rounded-[2rem] border-8 border-fg/90 bg-background">
						<div class="mx-auto mt-2 h-1.5 w-20 rounded-full bg-muted-fg/30"></div>

						<div class="px-4 pb-4 pt-5">
							<header class="flex items-start justify-between gap-3">
								<div>
									<p class="text-xs font-semibold uppercase text-muted-fg">Today</p>
									<h3 class="mt-1 text-2xl font-semibold">Approvals</h3>
								</div>
								<DomTooltip text="Queue uses your approver permissions and mobile notification rules.">
									<button type="button" class="flex size-10 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold">
										{{ pendingCount }}
									</button>
								</DomTooltip>
							</header>

							<div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
								<div class="rounded-2xl bg-secondary p-3">
									<p class="font-semibold text-fg">{{ pendingCount }}</p>
									<p class="mt-1 text-muted-fg">Pending</p>
								</div>
								<div class="rounded-2xl bg-secondary p-3">
									<p class="font-semibold text-fg">{{ readyCount }}</p>
									<p class="mt-1 text-muted-fg">Reviewable</p>
								</div>
								<div class="rounded-2xl bg-secondary p-3">
									<p class="font-semibold text-fg">17:00</p>
									<p class="mt-1 text-muted-fg">Cutoff</p>
								</div>
							</div>

							<div class="approval-tabs mt-4">
								<DomTabs v-model="activeTab" :tabs="queueTabs">
									<template #pending><span class="sr-only">Pending approvals</span></template>
									<template #mine><span class="sr-only">My approvals</span></template>
									<template #done><span class="sr-only">Completed approvals</span></template>
								</DomTabs>
							</div>

							<div class="mt-4">
								<DomNativeSelect v-model="priorityFilter" label="Priority" :options="priorityOptions" />
							</div>

							<div class="mt-4 max-h-[19rem] space-y-3 overflow-y-auto pr-1">
								<button
									v-for="request in filteredRequests"
									:key="request.id"
									type="button"
									class="w-full rounded-2xl border p-3 text-left transition"
									:class="requestClasses(request)"
									@click="selectRequest(request)"
								>
									<div class="flex items-start gap-3">
										<span class="flex size-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white" :class="request.accent">
											{{ request.avatar }}
										</span>
										<span class="min-w-0 flex-1">
											<span class="flex items-start justify-between gap-2">
												<span class="min-w-0">
													<span class="block truncate text-sm font-semibold">{{ request.title }}</span>
													<span class="mt-1 block truncate text-xs text-muted-fg">{{ request.requester }} / {{ request.team }}</span>
												</span>
												<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="riskClasses(request.risk)">
													{{ request.risk }}
												</span>
											</span>
											<span class="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs">
												<span class="truncate font-medium">{{ request.amount }}</span>
												<span class="text-muted-fg">{{ request.due }}</span>
												<span class="col-span-2 truncate text-muted-fg">{{ request.delta }}</span>
											</span>
										</span>
									</div>
								</button>

								<div v-if="!filteredRequests.length" class="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-fg">
									No requests match this filter.
								</div>
							</div>

							<section class="mt-4 rounded-t-[2rem] border border-border bg-background p-4 shadow-2xl shadow-black/15">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="text-xs font-semibold uppercase text-muted-fg">Decision sheet</p>
										<h4 class="mt-1 truncate text-lg font-semibold">{{ selectedRequest.title }}</h4>
										<p class="mt-1 text-sm text-muted-fg">{{ selectedDecisionLabel }}</p>
									</div>
									<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="riskClasses(selectedRequest.risk)">
										{{ selectedRequest.risk }}
									</span>
								</div>

								<div class="mt-4 space-y-2">
									<div
										v-for="check in selectedRequest.policyChecks"
										:key="check.label"
										class="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2 text-sm"
									>
										<span class="min-w-0 truncate">{{ check.label }}</span>
										<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize" :class="checkClasses(check.status)">
											{{ check.status }}
										</span>
									</div>
								</div>

								<button
									type="button"
									class="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-fg"
									@click="sheetExpanded = !sheetExpanded"
								>
									{{ sheetExpanded ? 'Hide request context' : 'Show request context' }}
								</button>

								<div v-if="sheetExpanded" class="mt-4 space-y-4">
									<p class="text-sm leading-6 text-muted-fg">{{ selectedRequest.summary }}</p>
									<div class="grid gap-2 text-sm">
										<div
											v-for="item in selectedRequest.evidence"
											:key="item.label"
											class="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2"
										>
											<span class="text-muted-fg">{{ item.label }}</span>
											<span class="min-w-0 truncate font-medium">{{ item.value }}</span>
										</div>
									</div>
									<p class="rounded-xl bg-primary/10 p-3 text-sm leading-6 text-primary">{{ selectedRequest.impact }}</p>
								</div>

								<div class="mt-4 rounded-2xl border border-border p-3">
									<DomToggle v-model="reviewComplete" label="I reviewed evidence and policy checks" />
								</div>

								<div class="mt-4 grid grid-cols-2 gap-2">
									<DomButton variant="secondary" class="w-full" @click="declineDialogOpen = true">Decline</DomButton>
									<DomButton class="w-full" :disabled="!canApprove" @click="approveRequest">Approve</DomButton>
								</div>
								<DomButton variant="ghost" class="mt-2 w-full" @click="escalateRequest">Escalate to owner</DomButton>
							</section>
						</div>
					</div>
				</div>
			</section>

			<aside class="border-t border-border p-4 sm:p-6 lg:border-l lg:border-t-0">
				<div class="max-w-2xl">
					<p class="text-sm font-semibold uppercase text-muted-fg">Mobile operations pattern</p>
					<h3 class="mt-2 text-2xl font-semibold">Approve work without opening a full admin console.</h3>
					<p class="mt-3 text-sm leading-6 text-muted-fg">
						This block is designed for managers who enter from a notification, compare a few request cards, inspect policy context, and make a traceable decision quickly.
					</p>
				</div>

				<div class="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
					<div class="rounded-2xl border border-border p-4">
						<p class="text-xs font-medium text-muted-fg">Interaction</p>
						<p class="mt-2 font-semibold">Bottom-sheet decision</p>
					</div>
					<div class="rounded-2xl border border-border p-4">
						<p class="text-xs font-medium text-muted-fg">Primary user</p>
						<p class="mt-2 font-semibold">Mobile approver</p>
					</div>
					<div class="rounded-2xl border border-border p-4">
						<p class="text-xs font-medium text-muted-fg">Risk model</p>
						<p class="mt-2 font-semibold">Policy-gated actions</p>
					</div>
				</div>

				<div class="mt-6 rounded-2xl border border-border skin-raised p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h4 class="font-semibold">Decision guardrails</h4>
							<p class="mt-1 text-sm text-muted-fg">Keep fast mobile decisions auditable.</p>
						</div>
						<DomToggle v-model="biometricConfirm" aria-label="Require biometric confirmation" />
					</div>
					<div class="mt-4 space-y-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Biometric confirmation</span>
							<span class="font-semibold">{{ biometricConfirm ? 'Required' : 'Optional' }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Blocked policy checks</span>
							<span class="font-semibold">Disable approval</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Decision note</span>
							<span class="font-semibold">Saved to audit log</span>
						</div>
					</div>
				</div>

				<div class="mt-6 rounded-2xl border border-border p-4">
					<h4 class="font-semibold">Recent mobile events</h4>
					<div class="mt-4 space-y-3">
						<div v-for="event in actionLog.slice(0, 4)" :key="`${event.label}-${event.time}`" class="flex gap-3 text-sm">
							<span class="mt-1 size-2 rounded-full bg-primary"></span>
							<span>
								<span class="block font-medium">{{ event.label }}</span>
								<span class="text-xs text-muted-fg">{{ event.time }}</span>
							</span>
						</div>
					</div>
				</div>
			</aside>
		</div>

		<DomDialog v-model="declineDialogOpen" title="Decline request" description="Give the requester a clear reason and the next step.">
			<div class="space-y-4">
				<DomNativeSelect v-model="declineReason" label="Reason" :options="reasonOptions" />
				<DomTextareaInput v-model="decisionNote" label="Decision note" rows="4" />
				<div class="rounded-2xl bg-secondary p-3 text-sm leading-6 text-muted-fg">
					This records a declined decision for {{ selectedRequest.requester }} and moves the request to Done.
				</div>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton data-close variant="secondary" class="text-destructive" @click="declineRequest">Decline request</DomButton>
			</template>
		</DomDialog>
	</div>
</template>

<style scoped>
.approval-tabs :deep(dom-tabs > div:nth-child(2)) {
	display: none;
}
</style>
