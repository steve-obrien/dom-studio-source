<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomToggle } from '@getdom/studio/vue';

const bulkActions = [
	{
		label: 'Pause billing',
		value: 'pause_billing',
		description: 'Stop upcoming charges while keeping product access active.',
		approval: true,
		impact: 'Revenue hold',
	},
	{
		label: 'Send renewal notice',
		value: 'send_renewal_notice',
		description: 'Email account owners with their renewal timeline and next step.',
		approval: false,
		impact: 'Customer communication',
	},
	{
		label: 'Apply compliance hold',
		value: 'compliance_hold',
		description: 'Prevent deletion and export changes until legal review completes.',
		approval: true,
		impact: 'Restricted data lifecycle',
	},
];

const accounts = [
	{
		id: 'acct_arcadia',
		name: 'Arcadia Health',
		owner: 'Nina Patel',
		plan: 'Scale',
		status: 'At risk',
		revenue: 5400,
		users: 84,
		lastSeen: '2 hours ago',
		risk: 'High',
	},
	{
		id: 'acct_harbor',
		name: 'Harbor Retail',
		owner: 'Marco Ruiz',
		plan: 'Growth',
		status: 'Renewal due',
		revenue: 3180,
		users: 41,
		lastSeen: 'Today',
		risk: 'Medium',
	},
	{
		id: 'acct_northstar',
		name: 'Northstar Labs',
		owner: 'Avery Stone',
		plan: 'Scale',
		status: 'Open invoice',
		revenue: 4260,
		users: 63,
		lastSeen: 'Yesterday',
		risk: 'Medium',
	},
	{
		id: 'acct_luma',
		name: 'Luma Works',
		owner: 'Priya Shah',
		plan: 'Starter',
		status: 'Healthy',
		revenue: 780,
		users: 12,
		lastSeen: 'Today',
		risk: 'Low',
	},
	{
		id: 'acct_summit',
		name: 'Summit Freight',
		owner: 'Jules Carter',
		plan: 'Growth',
		status: 'Contract review',
		revenue: 2210,
		users: 26,
		lastSeen: '3 days ago',
		risk: 'Low',
	},
];

const activity = [
	{ label: 'Dry run generated for 3 accounts', actor: 'Avery Stone', time: 'Today 14:10' },
	{ label: 'Renewal notice batch completed', actor: 'Customer success', time: 'Today 11:40' },
	{ label: 'Pause billing job approved', actor: 'Finance admin', time: 'Yesterday' },
	{ label: 'Compliance hold action template updated', actor: 'Legal ops', time: 'Jun 9' },
];

const selectedAction = ref('pause_billing');
const selectedIds = ref(['acct_arcadia', 'acct_harbor', 'acct_northstar']);
const reason = ref('Customer success cleanup after contract review.');
const dryRun = ref(true);
const notifyCustomers = ref(false);
const requireApproval = ref(true);

const actionRecord = computed(() => bulkActions.find((action) => action.value === selectedAction.value) || bulkActions[0]);
const selectedAccounts = computed(() => accounts.filter((account) => selectedIds.value.includes(account.id)));
const selectedCount = computed(() => selectedAccounts.value.length);
const selectedRevenue = computed(() => selectedAccounts.value.reduce((total, account) => total + account.revenue, 0));
const selectedUsers = computed(() => selectedAccounts.value.reduce((total, account) => total + account.users, 0));
const highRiskCount = computed(() => selectedAccounts.value.filter((account) => account.risk === 'High').length);
const needsApproval = computed(() => actionRecord.value.approval || requireApproval.value || highRiskCount.value > 0);
const canExecute = computed(() => selectedCount.value > 0 && reason.value.trim().length >= 12 && (!needsApproval.value || requireApproval.value));
const summaryText = computed(() => {
	const mode = dryRun.value ? 'Preview' : 'Queue';
	return `${mode} ${actionRecord.value.label.toLowerCase()} for ${selectedCount.value} ${selectedCount.value === 1 ? 'account' : 'accounts'}`;
});

const safetyChecks = computed(() => [
	{
		label: 'Records selected',
		detail: `${selectedCount.value} accounts selected from current segment`,
		status: selectedCount.value > 0 ? 'Passed' : 'Blocked',
	},
	{
		label: 'Audit reason',
		detail: reason.value.trim().length >= 12 ? 'Reason is long enough for audit review' : 'Add a more specific reason',
		status: reason.value.trim().length >= 12 ? 'Passed' : 'Blocked',
	},
	{
		label: 'Approval policy',
		detail: needsApproval.value ? 'Finance or operations approval is required' : 'No extra approval required',
		status: needsApproval.value ? 'Warning' : 'Passed',
	},
	{
		label: 'Customer notification',
		detail: notifyCustomers.value ? 'Customers will receive an email update' : 'No customer-facing email will be sent',
		status: notifyCustomers.value ? 'Warning' : 'Passed',
	},
]);

function toggleAccount(id) {
	if (selectedIds.value.includes(id)) {
		selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id);
		return;
	}
	selectedIds.value = [...selectedIds.value, id];
}

function selectAll() {
	selectedIds.value = accounts.map((account) => account.id);
}

function clearSelection() {
	selectedIds.value = [];
}

function formatCurrency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}

function riskClass(risk) {
	if (risk === 'High') return 'bg-destructive/15 text-destructive';
	if (risk === 'Medium') return 'bg-warning/15 text-warning';
	return 'bg-success/15 text-success';
}

function checkClass(status) {
	if (status === 'Blocked') return 'bg-destructive/15 text-destructive';
	if (status === 'Warning') return 'bg-warning/15 text-warning';
	return 'bg-success/15 text-success';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Operations control</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Bulk action review</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Review selected accounts, satisfy policy checks, and queue sensitive changes with a clear audit trail.
					</p>
				</div>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<DomButton variant="secondary" @click="clearSelection">
						Clear
					</DomButton>
					<DomButton @click="selectAll">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						Select all
					</DomButton>
				</div>
			</div>
		</header>

		<div class="grid min-h-[47rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
			<main class="min-w-0">
				<section class="grid border-b border-border md:grid-cols-4">
					<div class="border-b border-border px-4 py-4 md:border-b-0 md:border-r">
						<p class="text-xs text-muted-fg">Selected</p>
						<p class="mt-1 text-2xl font-semibold">{{ selectedCount }}</p>
					</div>
					<div class="border-b border-border px-4 py-4 md:border-b-0 md:border-r">
						<p class="text-xs text-muted-fg">Monthly value</p>
						<p class="mt-1 text-2xl font-semibold">{{ formatCurrency(selectedRevenue) }}</p>
					</div>
					<div class="border-b border-border px-4 py-4 md:border-b-0 md:border-r">
						<p class="text-xs text-muted-fg">End users</p>
						<p class="mt-1 text-2xl font-semibold">{{ selectedUsers }}</p>
					</div>
					<div class="px-4 py-4">
						<p class="text-xs text-muted-fg">High risk</p>
						<p class="mt-1 text-2xl font-semibold">{{ highRiskCount }}</p>
					</div>
				</section>

				<section class="border-b border-border px-4 py-5 sm:px-6">
					<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
						<div>
							<label class="text-sm font-semibold" for="bulk-action">Bulk action</label>
							<DomNativeSelect id="bulk-action" v-model="selectedAction" :options="bulkActions" class="mt-2 w-full" />
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ actionRecord.description }}</p>
						</div>
						<div class="rounded-xl border border-border bg-secondary/40 p-4">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Impact type</p>
							<p class="mt-2 text-sm font-semibold">{{ actionRecord.impact }}</p>
							<p class="mt-2 text-xs leading-5 text-muted-fg">
								{{ needsApproval ? 'Approval is required before execution.' : 'This action can be queued directly.' }}
							</p>
						</div>
					</div>

					<div class="mt-5">
						<label class="text-sm font-semibold" for="reason">Reason for audit log</label>
						<textarea
							id="reason"
							v-model="reason"
							class="mt-2 min-h-24 w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
							placeholder="Describe why this batch change is needed."
						></textarea>
					</div>

					<div class="mt-4 grid gap-3 md:grid-cols-3">
						<label class="flex items-center justify-between gap-4 rounded-xl border border-border px-3 py-3">
							<span>
								<span class="block text-sm font-medium">Dry run first</span>
								<span class="block text-xs text-muted-fg">Preview impact before queueing.</span>
							</span>
							<DomToggle v-model="dryRun" aria-label="Dry run first" />
						</label>
						<label class="flex items-center justify-between gap-4 rounded-xl border border-border px-3 py-3">
							<span>
								<span class="block text-sm font-medium">Notify customers</span>
								<span class="block text-xs text-muted-fg">Send account owner email.</span>
							</span>
							<DomToggle v-model="notifyCustomers" aria-label="Notify customers" />
						</label>
						<label class="flex items-center justify-between gap-4 rounded-xl border border-border px-3 py-3">
							<span>
								<span class="block text-sm font-medium">Require approval</span>
								<span class="block text-xs text-muted-fg">Route before execution.</span>
							</span>
							<DomToggle v-model="requireApproval" aria-label="Require approval" />
						</label>
					</div>
				</section>

				<section class="overflow-hidden">
					<div class="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
						<div>
							<h4 class="font-semibold tracking-tight">Selected records</h4>
							<p class="mt-1 text-sm text-muted-fg">Toggle records to adjust the batch before generating the job.</p>
						</div>
						<p class="text-sm font-medium text-muted-fg">{{ summaryText }}</p>
					</div>
					<div class="divide-y divide-border">
						<label
							v-for="account in accounts"
							:key="account.id"
							class="grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-secondary/50 sm:px-6 lg:grid-cols-[2rem_minmax(0,1.2fr)_0.8fr_0.8fr_0.7fr]"
						>
							<span class="flex items-center">
								<input
									type="checkbox"
									class="size-4 rounded border-border accent-primary"
									:checked="selectedIds.includes(account.id)"
									:aria-label="`Select ${account.name}`"
									@change="toggleAccount(account.id)"
								>
							</span>
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ account.name }}</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ account.owner }} / {{ account.lastSeen }}</span>
							</span>
							<span class="text-sm">
								<span class="block font-medium">{{ account.plan }}</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ account.status }}</span>
							</span>
							<span class="text-sm">
								<span class="block font-medium">{{ formatCurrency(account.revenue) }}</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ account.users }} users</span>
							</span>
							<span class="flex items-start lg:justify-end">
								<span class="rounded-full px-2 py-1 text-xs font-semibold" :class="riskClass(account.risk)">
									{{ account.risk }}
								</span>
							</span>
						</label>
					</div>
				</section>
			</main>

			<aside class="border-t border-border skin-card xl:border-l xl:border-t-0">
				<div class="border-b border-border px-4 py-5">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p>
					<h4 class="mt-1 text-lg font-semibold">Safety checks</h4>
					<div class="mt-4 space-y-3">
						<div
							v-for="check in safetyChecks"
							:key="check.label"
							class="rounded-xl border border-border bg-canvas p-3"
						>
							<div class="flex items-start justify-between gap-3">
								<p class="text-sm font-semibold">{{ check.label }}</p>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="checkClass(check.status)">
									{{ check.status }}
								</span>
							</div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
						</div>
					</div>
				</div>

				<div class="border-b border-border px-4 py-5">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Execution</p>
					<h4 class="mt-1 text-lg font-semibold">{{ dryRun ? 'Generate preview' : 'Queue job' }}</h4>
					<div class="mt-4 rounded-xl border border-border bg-canvas p-4 text-sm">
						<div class="flex justify-between gap-4">
							<span class="text-muted-fg">Action</span>
							<span class="font-medium">{{ actionRecord.label }}</span>
						</div>
						<div class="mt-3 flex justify-between gap-4">
							<span class="text-muted-fg">Accounts</span>
							<span class="font-medium">{{ selectedCount }}</span>
						</div>
						<div class="mt-3 flex justify-between gap-4">
							<span class="text-muted-fg">Value affected</span>
							<span class="font-medium">{{ formatCurrency(selectedRevenue) }}</span>
						</div>
						<div class="mt-3 flex justify-between gap-4">
							<span class="text-muted-fg">Approval</span>
							<span class="font-medium">{{ needsApproval ? 'Required' : 'Not required' }}</span>
						</div>
					</div>
					<DomButton class="mt-4 w-full justify-center" :disabled="!canExecute">
						{{ dryRun ? 'Run dry preview' : 'Queue bulk job' }}
					</DomButton>
					<p class="mt-3 text-xs leading-5 text-muted-fg">
						Disabled until records are selected and a specific audit reason is present.
					</p>
				</div>

				<div class="px-4 py-5">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Activity</p>
					<div class="mt-4 space-y-4">
						<div v-for="event in activity" :key="event.label" class="border-l border-border pl-3">
							<p class="text-sm font-medium">{{ event.label }}</p>
							<p class="mt-1 text-xs text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</template>
