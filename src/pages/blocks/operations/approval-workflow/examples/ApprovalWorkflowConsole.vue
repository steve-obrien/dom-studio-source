<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const statusOptions = [
	{ label: 'All open', value: 'All open' },
	{ label: 'Needs me', value: 'Needs me' },
	{ label: 'Blocked', value: 'Blocked' },
	{ label: 'Approved', value: 'Approved' },
];

const decisionOptions = [
	{ label: 'Approve request', value: 'approve' },
	{ label: 'Request changes', value: 'changes' },
	{ label: 'Reject request', value: 'reject' },
	{ label: 'Escalate to owner', value: 'escalate' },
];

const tabs = [
	{ key: 'checks', label: 'Checks' },
	{ key: 'history', label: 'History' },
];

const requests = [
	{
		id: 'limit-increase',
		title: 'Raise production API limit',
		object: 'Northstar Bank workspace',
		requester: 'Maya Chen',
		team: 'Enterprise Success',
		status: 'Needs security',
		filterStatus: 'Needs me',
		risk: 'High',
		due: 'Today 16:00',
		submitted: '42 minutes ago',
		amount: '$18.4k expansion',
		change: {
			label: 'Monthly request limit',
			from: '75,000 requests',
			to: '250,000 requests',
			reason: 'Mobile banking launch moves traffic from a legacy integration to the public API.',
		},
		approvers: [
			{ name: 'Finance review', owner: 'Jon Bell', status: 'Approved', required: true },
			{ name: 'Security review', owner: 'You', status: 'Waiting', required: true },
			{ name: 'CS leadership', owner: 'Ari Grant', status: 'Optional', required: false },
		],
		checks: [
			{ label: 'Contract value verified', detail: 'Signed expansion order is attached.', status: 'Passed' },
			{ label: 'Abuse controls reviewed', detail: 'Workspace has elevated traffic and webhook fan-out.', status: 'Warning' },
			{ label: 'Billing account healthy', detail: 'No failed payments in the last 90 days.', status: 'Passed' },
			{ label: 'Launch window inside support hours', detail: 'Customer launch is scheduled for 09:00 UTC.', status: 'Passed' },
		],
		history: [
			{ label: 'Finance approved', actor: 'Jon Bell', time: 'Today 12:18' },
			{ label: 'Security review requested', actor: 'Workflow bot', time: 'Today 12:03' },
			{ label: 'Request submitted', actor: 'Maya Chen', time: 'Today 11:58' },
		],
	},
	{
		id: 'data-export',
		title: 'Export customer activity archive',
		object: 'Acme Retail tenant',
		requester: 'Rina Shah',
		team: 'Data Operations',
		status: 'Blocked',
		filterStatus: 'Blocked',
		risk: 'Critical',
		due: 'Tomorrow 10:30',
		submitted: '2 hours ago',
		amount: '1.8M events',
		change: {
			label: 'Data export destination',
			from: 'Internal warehouse',
			to: 'Vendor SFTP endpoint',
			reason: 'Quarterly compliance archive requested by customer operations.',
		},
		approvers: [
			{ name: 'Privacy review', owner: 'Nora Lee', status: 'Blocked', required: true },
			{ name: 'Legal review', owner: 'Sam Patel', status: 'Waiting', required: true },
			{ name: 'Data owner', owner: 'Rina Shah', status: 'Approved', required: true },
		],
		checks: [
			{ label: 'DPA covers destination', detail: 'Vendor processor terms are missing for this workspace.', status: 'Failed' },
			{ label: 'Sensitive fields redacted', detail: 'Email, IP, and device identifiers will be tokenized.', status: 'Passed' },
			{ label: 'Customer approval attached', detail: 'Signed request was uploaded yesterday.', status: 'Passed' },
		],
		history: [
			{ label: 'Privacy blocked request', actor: 'Nora Lee', time: 'Today 10:40' },
			{ label: 'Export package prepared', actor: 'Data bot', time: 'Today 10:12' },
			{ label: 'Request submitted', actor: 'Rina Shah', time: 'Today 09:52' },
		],
	},
	{
		id: 'refund-exception',
		title: 'Approve refund exception',
		object: 'Invoice INV-2048',
		requester: 'Lena Ortiz',
		team: 'Customer Success',
		status: 'Ready',
		filterStatus: 'Needs me',
		risk: 'Medium',
		due: 'Jun 12',
		submitted: 'Yesterday',
		amount: '$2,840 refund',
		change: {
			label: 'Refund policy',
			from: 'Standard 30 day credit',
			to: 'Full cash refund after 44 days',
			reason: 'Duplicate annual renewal charged after migration to consolidated billing.',
		},
		approvers: [
			{ name: 'Success manager', owner: 'Lena Ortiz', status: 'Approved', required: true },
			{ name: 'Finance review', owner: 'You', status: 'Waiting', required: true },
			{ name: 'Revenue operations', owner: 'Ivy Tan', status: 'Approved', required: false },
		],
		checks: [
			{ label: 'Duplicate charge confirmed', detail: 'Two annual renewals collected within 12 hours.', status: 'Passed' },
			{ label: 'Account health reviewed', detail: 'Renewal and expansion notes are linked.', status: 'Passed' },
			{ label: 'Refund amount under threshold', detail: '$2,840 is below finance manager limit.', status: 'Passed' },
		],
		history: [
			{ label: 'Revenue operations approved', actor: 'Ivy Tan', time: 'Yesterday 16:44' },
			{ label: 'Finance review requested', actor: 'Workflow bot', time: 'Yesterday 16:12' },
			{ label: 'Request submitted', actor: 'Lena Ortiz', time: 'Yesterday 16:08' },
		],
	},
];

const selectedStatus = ref('All open');
const selectedRequestId = ref(requests[0].id);
const activeTab = ref('checks');
const decision = ref('approve');
const requireFollowUp = ref(true);
const notifyRequester = ref(true);
const decisionNote = ref('Approved for production increase after confirming contract value and monitoring coverage.');
const submittedDecision = ref('');

const filteredRequests = computed(() => requests.filter((request) => {
	if (selectedStatus.value === 'All open') return request.status !== 'Approved';
	if (selectedStatus.value === 'Approved') return request.status === 'Approved';
	return request.filterStatus === selectedStatus.value || request.status === selectedStatus.value;
}));
const selectedRequest = computed(() => requests.find((request) => request.id === selectedRequestId.value) || filteredRequests.value[0] || requests[0]);
const passedChecks = computed(() => selectedRequest.value.checks.filter((check) => check.status === 'Passed').length);
const blockingChecks = computed(() => selectedRequest.value.checks.filter((check) => check.status === 'Failed').length);
const requiredApprovals = computed(() => selectedRequest.value.approvers.filter((approver) => approver.required));
const completedApprovals = computed(() => requiredApprovals.value.filter((approver) => approver.status === 'Approved').length);
const readinessPercent = computed(() => Math.round(((passedChecks.value + completedApprovals.value) / (selectedRequest.value.checks.length + requiredApprovals.value.length)) * 100));
const canApprove = computed(() => blockingChecks.value === 0 && decisionNote.value.trim().length >= 12);
const decisionSummary = computed(() => `${decisionOptions.find((option) => option.value === decision.value)?.label || 'Decision'} for ${selectedRequest.value.object}`);

watch(selectedStatus, () => {
	const first = filteredRequests.value[0];
	if (first) selectRequest(first);
});

function selectRequest(request) {
	selectedRequestId.value = request.id;
	activeTab.value = 'checks';
	submittedDecision.value = '';
	decision.value = request.status === 'Blocked' ? 'changes' : 'approve';
	decisionNote.value = request.status === 'Blocked'
		? 'Please resolve the blocked policy check and attach the missing agreement before approval.'
		: 'Approved after reviewing impact, required approvers, and policy checks.';
}

function submitDecision() {
	if (!canApprove.value) return;
	submittedDecision.value = decisionSummary.value;
}

function riskClasses(risk) {
	return {
		Critical: 'bg-destructive/15 text-destructive',
		High: 'bg-warning/15 text-warning',
		Medium: 'bg-primary/10 text-primary',
		Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	}[risk] || 'bg-secondary text-muted-fg';
}

function statusClasses(status) {
	return {
		Approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Passed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Ready: 'bg-primary/10 text-primary',
		Waiting: 'bg-primary/10 text-primary',
		Warning: 'bg-warning/15 text-warning',
		Optional: 'bg-secondary text-muted-fg',
		Blocked: 'bg-destructive/15 text-destructive',
		Failed: 'bg-destructive/15 text-destructive',
		'Needs security': 'bg-warning/15 text-warning',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Approval workspace</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Sensitive change review</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Review impact, policy checks, approver progress, and audit history before a risky change is applied.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomNativeSelect v-model="selectedStatus" :options="statusOptions" class="w-40" />
					<DomButton size="sm" variant="secondary">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						New request
					</DomButton>
				</div>
			</div>
		</header>

		<div class="grid min-h-[46rem] lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
				<div class="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
					<div class="px-2 py-3">
						<p class="text-lg font-semibold">8</p>
						<p class="text-[11px] text-muted-fg">Open</p>
					</div>
					<div class="px-2 py-3">
						<p class="text-lg font-semibold">3</p>
						<p class="text-[11px] text-muted-fg">Need me</p>
					</div>
					<div class="px-2 py-3">
						<p class="text-lg font-semibold">1</p>
						<p class="text-[11px] text-muted-fg">Blocked</p>
					</div>
				</div>

				<div class="divide-y divide-border">
					<button
						v-for="request in filteredRequests"
						:key="request.id"
						type="button"
						class="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-secondary/60"
						:class="request.id === selectedRequest.id ? 'bg-primary/5' : 'bg-transparent'"
						@click="selectRequest(request)"
					>
						<span class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ request.title }}</span>
								<span class="mt-1 block truncate text-xs text-muted-fg">{{ request.object }}</span>
							</span>
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="riskClasses(request.risk)">
								{{ request.risk }}
							</span>
						</span>
						<span class="flex items-center justify-between gap-2 text-xs text-muted-fg">
							<span>{{ request.requester }}</span>
							<span>{{ request.due }}</span>
						</span>
					</button>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(selectedRequest.status)">
									{{ selectedRequest.status }}
								</span>
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="riskClasses(selectedRequest.risk)">
									{{ selectedRequest.risk }} risk
								</span>
							</div>
							<h4 class="mt-3 text-xl font-semibold tracking-tight">{{ selectedRequest.title }}</h4>
							<p class="mt-2 text-sm leading-6 text-muted-fg">
								{{ selectedRequest.object }} requested by {{ selectedRequest.requester }} from {{ selectedRequest.team }}.
							</p>
						</div>
						<div class="grid gap-1 rounded-2xl bg-secondary/70 px-4 py-3 text-sm xl:min-w-56">
							<span class="font-semibold">{{ selectedRequest.amount }}</span>
							<span class="text-muted-fg">Submitted {{ selectedRequest.submitted }}</span>
							<span class="text-muted-fg">Due {{ selectedRequest.due }}</span>
						</div>
					</div>
				</section>

				<section class="grid gap-0 border-b border-border md:grid-cols-3 md:divide-x md:divide-border">
					<div class="p-4 sm:p-5">
						<p class="text-xs font-medium text-muted-fg">Readiness</p>
						<p class="mt-2 text-2xl font-semibold">{{ readinessPercent }}%</p>
						<div class="mt-3 h-2 rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${readinessPercent}%` }" />
						</div>
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-medium text-muted-fg">Policy checks</p>
						<p class="mt-2 text-2xl font-semibold">{{ passedChecks }} / {{ selectedRequest.checks.length }}</p>
						<p class="mt-2 text-xs text-muted-fg">{{ blockingChecks }} blocking issue{{ blockingChecks === 1 ? '' : 's' }}</p>
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-medium text-muted-fg">Required approvals</p>
						<p class="mt-2 text-2xl font-semibold">{{ completedApprovals }} / {{ requiredApprovals.length }}</p>
						<p class="mt-2 text-xs text-muted-fg">Current reviewer: You</p>
					</div>
				</section>

				<section class="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Change summary</p>
						<div class="mt-3 overflow-hidden rounded-2xl border border-border">
							<div class="grid gap-4 border-b border-border bg-secondary/50 p-4 md:grid-cols-3">
								<div>
									<p class="text-xs text-muted-fg">Field</p>
									<p class="mt-1 text-sm font-semibold">{{ selectedRequest.change.label }}</p>
								</div>
								<div>
									<p class="text-xs text-muted-fg">Current</p>
									<p class="mt-1 text-sm font-semibold">{{ selectedRequest.change.from }}</p>
								</div>
								<div>
									<p class="text-xs text-muted-fg">Requested</p>
									<p class="mt-1 text-sm font-semibold text-primary">{{ selectedRequest.change.to }}</p>
								</div>
							</div>
							<p class="p-4 text-sm leading-6 text-muted-fg">{{ selectedRequest.change.reason }}</p>
						</div>

						<div class="mt-5">
							<DomTabs v-model="activeTab" :tabs="tabs" />
							<div v-if="activeTab === 'checks'" class="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
								<div v-for="check in selectedRequest.checks" :key="check.label" class="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
									<div>
										<p class="text-sm font-semibold">{{ check.label }}</p>
										<p class="mt-1 text-sm leading-6 text-muted-fg">{{ check.detail }}</p>
									</div>
									<span class="h-fit rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(check.status)">
										{{ check.status }}
									</span>
								</div>
							</div>
							<div v-else class="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
								<div v-for="event in selectedRequest.history" :key="`${event.label}-${event.time}`" class="grid gap-1 p-4">
									<p class="text-sm font-semibold">{{ event.label }}</p>
									<p class="text-sm text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
								</div>
							</div>
						</div>
					</div>

					<aside class="rounded-2xl bg-secondary/60 p-4">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Approvers</p>
						<div class="mt-3 divide-y divide-border">
							<div v-for="approver in selectedRequest.approvers" :key="approver.name" class="py-3">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="text-sm font-semibold">{{ approver.name }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ approver.owner }}</p>
									</div>
									<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClasses(approver.status)">
										{{ approver.status }}
									</span>
								</div>
								<p class="mt-2 text-xs text-muted-fg">{{ approver.required ? 'Required approver' : 'Optional observer' }}</p>
							</div>
						</div>
					</aside>
				</section>
			</main>

			<aside class="skin-card p-4 sm:p-5">
				<div class="sticky top-4 grid gap-5">
					<section>
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Decision</p>
						<div class="mt-3 grid gap-4">
							<DomNativeSelect v-model="decision" label="Decision type" :options="decisionOptions" />
							<DomTextareaInput
								v-model="decisionNote"
								label="Decision note"
								placeholder="Summarize what changed, why it is safe, or what needs to be fixed."
								:rows="5"
							/>
							<div class="grid gap-3 rounded-2xl bg-canvas p-4">
								<DomToggle
									v-model="notifyRequester"
									label="Notify requester"
									description="Send the decision note to the original requester."
								/>
								<DomToggle
									v-model="requireFollowUp"
									label="Create follow-up task"
									description="Track post-approval verification after the change applies."
								/>
							</div>
						</div>
					</section>

					<section class="rounded-2xl border border-border bg-canvas p-4">
						<p class="text-sm font-semibold">Safety summary</p>
						<div class="mt-3 space-y-3 text-sm">
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-fg">Blocking checks</span>
								<span class="font-semibold" :class="blockingChecks ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-300'">
									{{ blockingChecks }}
								</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-fg">Note length</span>
								<span class="font-semibold">{{ decisionNote.trim().length }} chars</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-fg">Requester notice</span>
								<span class="font-semibold">{{ notifyRequester ? 'On' : 'Off' }}</span>
							</div>
						</div>
					</section>

					<div v-if="submittedDecision" class="rounded-2xl bg-primary/10 p-4 text-sm text-primary">
						<p class="font-semibold">Decision staged</p>
						<p class="mt-1 leading-6">{{ submittedDecision }}. Send this payload to your approval workflow endpoint.</p>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<DomButton variant="secondary" @click="decision = 'changes'">Request changes</DomButton>
						<DomButton :disabled="!canApprove" @click="submitDecision">Submit</DomButton>
					</div>
				</div>
			</aside>
		</div>
	</div>
</template>
