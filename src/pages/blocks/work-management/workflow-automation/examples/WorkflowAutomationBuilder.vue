<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomPopover, DomRangeInput, DomTabs, DomTextInput, DomToggle, DomTooltip } from '@getdom/studio/vue';

const statusOptions = [
	{ label: 'All workflows', value: 'All workflows' },
	{ label: 'Active', value: 'Active' },
	{ label: 'Draft', value: 'Draft' },
	{ label: 'Paused', value: 'Paused' },
];

const triggerOptions = [
	{ label: 'Trial becomes inactive', value: 'Trial becomes inactive' },
	{ label: 'Invoice payment fails', value: 'Invoice payment fails' },
	{ label: 'Priority ticket opened', value: 'Priority ticket opened' },
	{ label: 'Feature usage drops', value: 'Feature usage drops' },
];

const ownerOptions = [
	{ label: 'Lifecycle team', value: 'Lifecycle team' },
	{ label: 'Revenue operations', value: 'Revenue operations' },
	{ label: 'Support leadership', value: 'Support leadership' },
	{ label: 'Product operations', value: 'Product operations' },
];

const conditionFields = [
	{
		label: 'Plan fit',
		operators: ['is', 'is not'],
		values: ['Enterprise', 'Growth', 'Starter'],
	},
	{
		label: 'Last active',
		operators: ['older than', 'within'],
		values: ['3 days', '5 days', '14 days'],
	},
	{
		label: 'Account health',
		operators: ['is', 'is not'],
		values: ['Healthy', 'At risk', 'Critical'],
	},
	{
		label: 'Ticket priority',
		operators: ['is', 'is not'],
		values: ['Urgent', 'High', 'Normal'],
	},
];

const actionTypes = [
	{ label: 'Send email', value: 'Send email' },
	{ label: 'Create task', value: 'Create task' },
	{ label: 'Post Slack alert', value: 'Post Slack alert' },
	{ label: 'Update account field', value: 'Update account field' },
];

const tabs = [
	{ key: 'test', label: 'Test run' },
	{ key: 'activity', label: 'Activity' },
];

const automations = [
	{
		id: 'trial-rescue',
		name: 'Trial rescue sequence',
		description: 'Nudge promising trials when usage drops before conversion.',
		status: 'Active',
		owner: 'Lifecycle team',
		trigger: 'Trial becomes inactive',
		audience: 'Self-serve trials',
		throttleHours: 24,
		enabled: true,
		conditions: [
			{ id: 'cond_plan', field: 'Plan fit', operator: 'is', value: 'Growth' },
			{ id: 'cond_activity', field: 'Last active', operator: 'older than', value: '5 days' },
		],
		actions: [
			{ id: 'act_email', type: 'Send email', detail: 'Nudge template', enabled: true },
			{ id: 'act_task', type: 'Create task', detail: 'Owner follow-up', enabled: true },
		],
		metrics: { runs: 1240, successRate: '98.8%', savedHours: '42h' },
		history: [
			{ label: 'Email copy tightened', actor: 'Maya Chen', time: 'Today 10:18' },
			{ label: 'Throttle raised to 24 hours', actor: 'Lifecycle bot', time: 'Yesterday' },
			{ label: 'Workflow published', actor: 'Maya Chen', time: 'Jun 04, 2026' },
		],
	},
	{
		id: 'payment-recovery',
		name: 'Payment recovery',
		description: 'Create owner tasks and customer reminders after failed payments.',
		status: 'Draft',
		owner: 'Revenue operations',
		trigger: 'Invoice payment fails',
		audience: 'Paid workspaces',
		throttleHours: 12,
		enabled: false,
		conditions: [
			{ id: 'cond_health', field: 'Account health', operator: 'is not', value: 'Critical' },
			{ id: 'cond_plan_enterprise', field: 'Plan fit', operator: 'is', value: 'Enterprise' },
		],
		actions: [
			{ id: 'act_task_revenue', type: 'Create task', detail: 'Finance follow-up', enabled: true },
			{ id: 'act_slack_revenue', type: 'Post Slack alert', detail: '#revops-alerts', enabled: true },
		],
		metrics: { runs: 0, successRate: 'Draft', savedHours: '0h' },
		history: [
			{ label: 'Draft created from template', actor: 'Jon Bell', time: 'Today 09:31' },
			{ label: 'Finance approver added', actor: 'Ari Grant', time: 'Today 09:44' },
		],
	},
	{
		id: 'urgent-ticket-handoff',
		name: 'Urgent ticket handoff',
		description: 'Escalate priority support issues and update account context.',
		status: 'Paused',
		owner: 'Support leadership',
		trigger: 'Priority ticket opened',
		audience: 'Enterprise accounts',
		throttleHours: 4,
		enabled: false,
		conditions: [
			{ id: 'cond_priority', field: 'Ticket priority', operator: 'is', value: 'Urgent' },
			{ id: 'cond_health_ticket', field: 'Account health', operator: 'is', value: 'At risk' },
		],
		actions: [
			{ id: 'act_slack_support', type: 'Post Slack alert', detail: '#support-war-room', enabled: true },
			{ id: 'act_update_health', type: 'Update account field', detail: 'Escalation status', enabled: false },
		],
		metrics: { runs: 312, successRate: '94.2%', savedHours: '18h' },
		history: [
			{ label: 'Paused while escalation policy changes', actor: 'Nora Lee', time: 'Yesterday' },
			{ label: 'Slack destination changed', actor: 'Support bot', time: 'Jun 08, 2026' },
		],
	},
];

const selectedStatus = ref('All workflows');
const selectedAutomationId = ref(automations[0].id);
const workflowName = ref(automations[0].name);
const trigger = ref(automations[0].trigger);
const owner = ref(automations[0].owner);
const audience = ref(automations[0].audience);
const throttleHours = ref(automations[0].throttleHours);
const enabled = ref(automations[0].enabled);
const conditions = ref(cloneItems(automations[0].conditions));
const actions = ref(cloneItems(automations[0].actions));
const activeTab = ref('test');
const sampleRecord = ref('Northstar Labs');
const testRunCount = ref(7);
const testMessage = ref('Ready to test against a sample record before publishing.');

const filteredAutomations = computed(() => automations.filter((automation) => {
	return selectedStatus.value === 'All workflows' || automation.status === selectedStatus.value;
}));
const selectedAutomation = computed(() => automations.find((automation) => automation.id === selectedAutomationId.value) || filteredAutomations.value[0] || automations[0]);
const activeActions = computed(() => actions.value.filter((action) => action.enabled));
const readinessChecks = computed(() => [
	{ label: 'Trigger selected', passed: Boolean(trigger.value) },
	{ label: 'At least one condition', passed: conditions.value.length > 0 },
	{ label: 'Action sequence enabled', passed: activeActions.value.length > 0 },
	{ label: 'Throttle protects repeat runs', passed: Number(throttleHours.value) >= 4 },
	{ label: 'Named owner assigned', passed: owner.value !== '' },
]);
const passedChecks = computed(() => readinessChecks.value.filter((check) => check.passed).length);
const readinessPercent = computed(() => Math.round((passedChecks.value / readinessChecks.value.length) * 100));
const workflowSummary = computed(() => {
	return `${trigger.value} for ${audience.value || 'selected records'}, then run ${activeActions.value.length} action${activeActions.value.length === 1 ? '' : 's'}.`;
});

watch(selectedStatus, () => {
	const first = filteredAutomations.value[0];
	if (first) selectAutomation(first);
});

watch(selectedAutomation, (automation) => {
	workflowName.value = automation.name;
	trigger.value = automation.trigger;
	owner.value = automation.owner;
	audience.value = automation.audience;
	throttleHours.value = automation.throttleHours;
	enabled.value = automation.enabled;
	conditions.value = cloneItems(automation.conditions);
	actions.value = cloneItems(automation.actions);
	activeTab.value = 'test';
	testMessage.value = 'Ready to test against a sample record before publishing.';
});

function cloneItems(items) {
	return items.map((item) => ({ ...item }));
}

function selectAutomation(automation) {
	selectedAutomationId.value = automation.id;
}

function fieldConfig(field) {
	return conditionFields.find((item) => item.label === field) || conditionFields[0];
}

function updateConditionField(condition, field) {
	const nextField = fieldConfig(field);
	condition.field = nextField.label;
	condition.operator = nextField.operators[0];
	condition.value = nextField.values[0];
}

function addCondition() {
	const field = conditionFields.find((item) => !conditions.value.some((condition) => condition.field === item.label)) || conditionFields[0];
	conditions.value = [
		...conditions.value,
		{
			id: `cond_${Date.now()}`,
			field: field.label,
			operator: field.operators[0],
			value: field.values[0],
		},
	];
}

function removeCondition(conditionId) {
	if (conditions.value.length === 1) return;
	conditions.value = conditions.value.filter((condition) => condition.id !== conditionId);
}

function addAction() {
	actions.value = [
		...actions.value,
		{
			id: `act_${Date.now()}`,
			type: actionTypes[0].value,
			detail: 'Configure destination',
			enabled: true,
		},
	];
}

function removeAction(actionId) {
	if (actions.value.length === 1) return;
	actions.value = actions.value.filter((action) => action.id !== actionId);
}

function runTest() {
	testRunCount.value += 1;
	activeTab.value = 'test';
	testMessage.value = `${sampleRecord.value || 'Sample record'} matched ${conditions.value.length} condition${conditions.value.length === 1 ? '' : 's'} and would run ${activeActions.value.length} action${activeActions.value.length === 1 ? '' : 's'}.`;
}

function statusClasses(status) {
	return {
		Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Draft: 'bg-primary/10 text-primary',
		Paused: 'bg-warning/15 text-warning',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Automation workspace</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Workflow builder</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Compose event triggers, conditional logic, action sequences, and dry-run checks before publishing product automations.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomTooltip text="Runs this workflow against sample data without executing actions.">
						<DomButton variant="ghost" size="sm" @click="runTest">Dry run</DomButton>
					</DomTooltip>
					<DomButton size="sm">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						New workflow
					</DomButton>
				</div>
			</div>

			<div class="mt-4 grid divide-y divide-border border-t border-border pt-0 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
				<div class="py-3 sm:pr-4">
					<p class="text-xs font-medium text-muted-fg">Runs this month</p>
					<p class="mt-1 text-2xl font-semibold">{{ selectedAutomation.metrics.runs.toLocaleString() }}</p>
				</div>
				<div class="py-3 sm:px-4">
					<p class="text-xs font-medium text-muted-fg">Success rate</p>
					<p class="mt-1 text-2xl font-semibold">{{ selectedAutomation.metrics.successRate }}</p>
				</div>
				<div class="py-3 sm:pl-4">
					<p class="text-xs font-medium text-muted-fg">Time saved</p>
					<p class="mt-1 text-2xl font-semibold">{{ selectedAutomation.metrics.savedHours }}</p>
				</div>
			</div>
		</header>

		<div class="grid min-h-[50rem] lg:grid-cols-[18rem_minmax(0,1fr)_21rem]">
			<aside class="border-b border-border skin-raised lg:border-b-0 lg:border-r">
				<div class="border-b border-border p-3">
					<DomNativeSelect v-model="selectedStatus" :options="statusOptions" class="w-full" />
				</div>

				<div class="divide-y divide-border">
					<button
						v-for="automation in filteredAutomations"
						:key="automation.id"
						type="button"
						class="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-secondary/60"
						:class="automation.id === selectedAutomation.id ? 'bg-primary/5' : 'bg-transparent'"
						@click="selectAutomation(automation)"
					>
						<span class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ automation.name }}</span>
								<span class="mt-1 block line-clamp-2 text-xs leading-5 text-muted-fg">{{ automation.description }}</span>
							</span>
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClasses(automation.status)">
								{{ automation.status }}
							</span>
						</span>
						<span class="flex items-center justify-between gap-2 text-xs text-muted-fg">
							<span>{{ automation.owner }}</span>
							<span>{{ automation.metrics.successRate }}</span>
						</span>
					</button>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border lg:border-b-0">
				<section class="border-b border-border p-4 sm:p-5">
					<div class="flex flex-col gap-4 xl:flex-row xl:items-end">
						<DomTextInput v-model="workflowName" label="Workflow name" class="w-full" />
						<div class="grid w-full gap-3 sm:grid-cols-2 xl:w-[28rem]">
							<DomNativeSelect v-model="owner" label="Owner" :options="ownerOptions" />
							<label class="grid gap-2 text-sm font-medium">
								Enabled
								<span class="flex h-10 items-center rounded-lg border border-border px-3">
									<DomToggle v-model="enabled" aria-label="Enable workflow" />
								</span>
							</label>
						</div>
					</div>
					<p class="mt-3 text-sm leading-6 text-muted-fg">{{ workflowSummary }}</p>
				</section>

				<section class="grid border-b border-border lg:grid-cols-[minmax(0,1fr)_16rem]">
					<div class="p-4 sm:p-5">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">When</p>
								<h4 class="mt-1 font-semibold">Choose a trigger event</h4>
							</div>
							<DomPopover width="w-[20rem]" padding="p-0" label="Variables">
								<template #trigger>
									<DomButton variant="ghost" size="sm">Payload variables</DomButton>
								</template>
								<div class="divide-y divide-border text-sm">
									<div class="p-3">
										<p class="font-semibold">Available from trigger</p>
										<p class="mt-1 text-xs leading-5 text-muted-fg">Use these values in conditions, messages, or action payloads.</p>
									</div>
									<div class="grid gap-2 p-3 font-mono text-xs">
										<span>{account.name}</span>
										<span>{account.owner}</span>
										<span>{event.created_at}</span>
										<span>{workspace.plan}</span>
									</div>
								</div>
							</DomPopover>
						</div>
						<div class="mt-4 grid gap-3 sm:grid-cols-2">
							<DomNativeSelect v-model="trigger" label="Trigger" :options="triggerOptions" />
							<DomTextInput v-model="audience" label="Audience" />
						</div>
					</div>
					<div class="border-t border-border p-4 sm:p-5 lg:border-l lg:border-t-0">
						<DomRangeInput v-model="throttleHours" label="Minimum wait between runs" :min="1" :max="72" :step="1" suffix="h" />
						<p class="mt-3 text-xs leading-5 text-muted-fg">Prevents repeat messages, duplicate tasks, and noisy alerts for the same record.</p>
					</div>
				</section>

				<section class="border-b border-border p-4 sm:p-5">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">If</p>
							<h4 class="mt-1 font-semibold">Match conditions</h4>
						</div>
						<DomButton variant="ghost" size="sm" @click="addCondition">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							</svg>
							Add condition
						</DomButton>
					</div>

					<div class="mt-4 divide-y divide-border rounded-xl border border-border">
						<div
							v-for="(condition, index) in conditions"
							:key="condition.id"
							class="grid gap-3 p-3 lg:grid-cols-[2rem_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] lg:items-end"
						>
							<div class="grid size-8 place-items-center rounded-full bg-secondary text-sm font-semibold text-muted-fg">{{ index + 1 }}</div>
							<DomNativeSelect
								:model-value="condition.field"
								label="Field"
								:options="conditionFields.map((field) => field.label)"
								@update:model-value="updateConditionField(condition, $event)"
							/>
							<DomNativeSelect v-model="condition.operator" label="Operator" :options="fieldConfig(condition.field).operators" />
							<DomNativeSelect v-model="condition.value" label="Value" :options="fieldConfig(condition.field).values" />
							<DomButton variant="ghost" size="sm" :disabled="conditions.length === 1" @click="removeCondition(condition.id)">Remove</DomButton>
						</div>
					</div>
				</section>

				<section class="p-4 sm:p-5">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Then</p>
							<h4 class="mt-1 font-semibold">Run actions in order</h4>
						</div>
						<DomButton variant="ghost" size="sm" @click="addAction">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							</svg>
							Add action
						</DomButton>
					</div>

					<div class="mt-4 divide-y divide-border rounded-xl border border-border">
						<div
							v-for="(action, index) in actions"
							:key="action.id"
							class="grid gap-3 p-3 lg:grid-cols-[2rem_minmax(0,0.9fr)_minmax(0,1fr)_auto_auto] lg:items-end"
						>
							<div class="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{{ index + 1 }}</div>
							<DomNativeSelect v-model="action.type" label="Action" :options="actionTypes" />
							<DomTextInput v-model="action.detail" label="Details" />
							<label class="grid gap-2 text-sm font-medium">
								On
								<span class="flex h-10 items-center rounded-lg border border-border px-3">
									<DomToggle v-model="action.enabled" :aria-label="`Toggle ${action.type}`" />
								</span>
							</label>
							<DomButton variant="ghost" size="sm" :disabled="actions.length === 1" @click="removeAction(action.id)">Remove</DomButton>
						</div>
					</div>
				</section>
			</main>

			<aside class="skin-raised p-4 lg:border-l">
				<section class="border-b border-border pb-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold">Publish readiness</h4>
							<p class="mt-1 text-xs text-muted-fg">{{ passedChecks }}/{{ readinessChecks.length }} checks passed</p>
						</div>
						<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{{ readinessPercent }}%</span>
					</div>
					<div class="mt-4 h-2 rounded-full bg-secondary">
						<div class="h-full rounded-full bg-primary" :style="{ width: `${readinessPercent}%` }" />
					</div>
					<div class="mt-4 space-y-3">
						<div
							v-for="check in readinessChecks"
							:key="check.label"
							class="flex items-center justify-between gap-3 text-sm"
						>
							<span>{{ check.label }}</span>
							<span
								class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
								:class="check.passed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-warning/15 text-warning'"
							>
								{{ check.passed ? 'Passed' : 'Review' }}
							</span>
						</div>
					</div>
				</section>

				<section class="border-b border-border py-4">
					<h4 class="font-semibold">Sample record</h4>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Dry runs should use backend fixture data from the same schema as production events.</p>
					<DomTextInput v-model="sampleRecord" label="Record name" class="mt-3" />
					<DomButton class="mt-3 w-full justify-center" size="sm" @click="runTest">Run dry test</DomButton>
				</section>

				<section class="py-4">
					<DomTabs v-model="activeTab" :tabs="tabs" />
					<div v-if="activeTab === 'test'" class="pt-4">
						<div class="rounded-xl border border-border bg-background p-4">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Last dry run</p>
							<p class="mt-3 text-sm leading-6">{{ testMessage }}</p>
							<div class="mt-4 grid grid-cols-3 divide-x divide-border text-center text-xs">
								<div>
									<p class="text-base font-semibold">{{ testRunCount }}</p>
									<p class="text-muted-fg">Runs</p>
								</div>
								<div>
									<p class="text-base font-semibold">{{ conditions.length }}</p>
									<p class="text-muted-fg">Checks</p>
								</div>
								<div>
									<p class="text-base font-semibold">{{ activeActions.length }}</p>
									<p class="text-muted-fg">Actions</p>
								</div>
							</div>
						</div>
					</div>

					<div v-else class="divide-y divide-border pt-2">
						<div
							v-for="event in selectedAutomation.history"
							:key="`${event.label}-${event.time}`"
							class="flex items-start justify-between gap-3 py-3"
						>
							<div>
								<p class="text-sm font-medium">{{ event.label }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
							</div>
							<p class="shrink-0 text-xs text-muted-fg">{{ event.time }}</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
