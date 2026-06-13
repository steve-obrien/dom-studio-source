<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomBadge,
	DomButton,
	DomCodeInput,
	DomCombobox,
	DomDrawer,
	DomRadioGroup,
	DomRangeInput,
	DomStatusPill,
	DomTagCombobox,
	DomToggleButtonGroup,
	DomTreeView,
} from '@getdom/studio/vue';
import TraceMetric from '../components/TraceMetric.vue';
import TraceSpanRow from '../components/TraceSpanRow.vue';

const runOptions = [
	{
		label: 'Support triage handoff',
		value: 'support-triage',
		app: 'Customer support agent',
		status: 'warning',
		statusLabel: 'Needs review',
		durationMs: 6840,
		cost: '$0.183',
		description: 'Classified a ticket, looked up account context, and drafted a handoff with one guarded tool call.',
	},
	{
		label: 'Invoice recovery agent',
		value: 'invoice-recovery',
		app: 'Billing operations',
		status: 'ok',
		statusLabel: 'Completed',
		durationMs: 4920,
		cost: '$0.097',
		description: 'Found payment history, checked invoice state, and sent a recovery recommendation to finance.',
	},
	{
		label: 'Workspace risk review',
		value: 'risk-review',
		app: 'Trust workflow',
		status: 'failed',
		statusLabel: 'Failed',
		durationMs: 7210,
		cost: '$0.211',
		description: 'Stopped during a policy check because the moderation service returned a scoped timeout.',
	},
];

const traceSpansByRun = {
	'support-triage': [
		{
			id: 'support-root',
			parentId: null,
			type: 'agent',
			name: 'Support triage agent',
			status: 'warning',
			statusLabel: 'Needs review',
			startMs: 0,
			durationMs: 6840,
			cost: '$0.183',
			tokens: '7.8k',
			description: 'Routes the incoming enterprise ticket and prepares a human handoff.',
			tags: ['agent', 'prod', 'handoff'],
			input: { ticketId: 'tic_9182', workspaceId: 'wrk_northstar', channel: 'priority-support' },
			output: { queue: 'enterprise-success', confidence: 0.82, escalation: true },
		},
		{
			id: 'support-classify',
			parentId: 'support-root',
			type: 'model',
			name: 'Classify ticket intent',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 220,
			durationMs: 1160,
			cost: '$0.044',
			tokens: '2.1k',
			description: 'Identifies billing-impact urgency and extracts customer promises from the thread.',
			tags: ['model', 'classification'],
			input: { model: 'gpt-4.1-mini', promptVersion: 'support-triage-v17' },
			output: { intent: 'billing-access-risk', urgency: 'high', confidence: 0.89 },
		},
		{
			id: 'support-lookup',
			parentId: 'support-root',
			type: 'tool',
			name: 'lookup_customer',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 1480,
			durationMs: 620,
			cost: '$0.002',
			tokens: '0',
			description: 'Reads plan, renewal date, account owner, and open escalation context.',
			tags: ['tool', 'crm'],
			input: { customerId: 'cus_northstar', include: ['plan', 'owner', 'risk'] },
			output: { plan: 'Enterprise', renewal: '2026-07-01', owner: 'Ari Patel', risk: 'low' },
		},
		{
			id: 'support-guardrail',
			parentId: 'support-root',
			type: 'guardrail',
			name: 'PII redaction check',
			status: 'warning',
			statusLabel: 'Masked output',
			startMs: 2280,
			durationMs: 780,
			cost: '$0.009',
			tokens: '840',
			description: 'Masks contract terms before the draft is sent into a shared queue.',
			tags: ['safety', 'redaction'],
			input: { policy: 'customer-data-v4', fields: ['contractMinimum', 'billingEmail'] },
			output: { maskedFields: 2, publishable: true },
		},
		{
			id: 'support-draft',
			parentId: 'support-root',
			type: 'model',
			name: 'Draft human handoff',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 3280,
			durationMs: 2440,
			cost: '$0.116',
			tokens: '4.9k',
			description: 'Writes the escalation summary, next best action, and customer-safe notes.',
			tags: ['model', 'handoff'],
			input: { model: 'gpt-4.1', format: 'support_handoff' },
			output: { sections: 4, action: 'assign_success_manager', confidence: 0.86 },
		},
		{
			id: 'support-queue',
			parentId: 'support-root',
			type: 'tool',
			name: 'create_queue_item',
			status: 'ok',
			statusLabel: 'Queued',
			startMs: 5940,
			durationMs: 510,
			cost: '$0.001',
			tokens: '0',
			description: 'Creates a queue item with masked context and audit metadata.',
			tags: ['tool', 'queue'],
			input: { queue: 'enterprise-success', priority: 'high' },
			output: { itemId: 'queue_7741', sla: '2h' },
		},
	],
	'invoice-recovery': [
		{
			id: 'invoice-root',
			parentId: null,
			type: 'agent',
			name: 'Invoice recovery agent',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 0,
			durationMs: 4920,
			cost: '$0.097',
			tokens: '4.6k',
			description: 'Reviews overdue invoice context and prepares a finance-safe recovery action.',
			tags: ['agent', 'billing'],
			input: { invoiceId: 'in_2048', workspaceId: 'wrk_boreal' },
			output: { recommendation: 'send_manager_note', confidence: 0.91 },
		},
		{
			id: 'invoice-load',
			parentId: 'invoice-root',
			type: 'tool',
			name: 'get_invoice_state',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 260,
			durationMs: 530,
			cost: '$0.001',
			tokens: '0',
			description: 'Checks invoice balance, dunning state, payment method, and credits.',
			tags: ['tool', 'billing-api'],
			input: { invoiceId: 'in_2048' },
			output: { balance: 2280, dunning: 'paused', credits: 400 },
		},
		{
			id: 'invoice-policy',
			parentId: 'invoice-root',
			type: 'guardrail',
			name: 'Collections policy',
			status: 'ok',
			statusLabel: 'Passed',
			startMs: 940,
			durationMs: 480,
			cost: '$0.006',
			tokens: '620',
			description: 'Confirms outreach is permitted for the customer tier and invoice age.',
			tags: ['safety', 'finance'],
			input: { policy: 'collections-v2', invoiceAgeDays: 18 },
			output: { permitted: true, tone: 'collaborative' },
		},
		{
			id: 'invoice-compose',
			parentId: 'invoice-root',
			type: 'model',
			name: 'Compose recovery note',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 1540,
			durationMs: 2200,
			cost: '$0.086',
			tokens: '3.9k',
			description: 'Drafts a payment-resolution note with account context and approved language.',
			tags: ['model', 'copy'],
			input: { model: 'gpt-4.1-mini', promptVersion: 'invoice-recovery-v9' },
			output: { tone: 'helpful', links: 2, approvalRequired: false },
		},
	],
	'risk-review': [
		{
			id: 'risk-root',
			parentId: null,
			type: 'agent',
			name: 'Workspace risk review',
			status: 'failed',
			statusLabel: 'Failed',
			startMs: 0,
			durationMs: 7210,
			cost: '$0.211',
			tokens: '8.3k',
			description: 'Reviews suspicious workspace activity before allowing a bulk invite campaign.',
			tags: ['agent', 'trust'],
			input: { workspaceId: 'wrk_kite', action: 'bulk_invite' },
			output: { stoppedAt: 'policy_lookup', retryable: true },
		},
		{
			id: 'risk-profile',
			parentId: 'risk-root',
			type: 'tool',
			name: 'load_workspace_profile',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 180,
			durationMs: 840,
			cost: '$0.002',
			tokens: '0',
			description: 'Loads workspace age, verified domain, seats, and recent invite volume.',
			tags: ['tool', 'workspace'],
			input: { workspaceId: 'wrk_kite' },
			output: { seats: 42, domainVerified: false, inviteSpike: true },
		},
		{
			id: 'risk-model',
			parentId: 'risk-root',
			type: 'model',
			name: 'Assess campaign risk',
			status: 'ok',
			statusLabel: 'Completed',
			startMs: 1240,
			durationMs: 2860,
			cost: '$0.164',
			tokens: '6.8k',
			description: 'Scores invite behavior and recommends whether to pause the campaign.',
			tags: ['model', 'risk'],
			input: { model: 'gpt-4.1', examples: 12 },
			output: { riskScore: 78, recommendation: 'manual_review' },
		},
		{
			id: 'risk-policy',
			parentId: 'risk-root',
			type: 'guardrail',
			name: 'moderation_policy_lookup',
			status: 'failed',
			statusLabel: 'Timed out',
			startMs: 4340,
			durationMs: 2540,
			cost: '$0.031',
			tokens: '420',
			description: 'Policy service timeout stopped the run before it could write an enforcement decision.',
			tags: ['safety', 'policy', 'timeout'],
			input: { policy: 'bulk-invite-v5', timeoutMs: 2400 },
			output: { error: 'policy_service_timeout', retryAfterMs: 30000 },
		},
	],
};

const statusOptions = [
	{ label: 'All', value: 'all' },
	{ label: 'OK', value: 'ok' },
	{ label: 'Warnings', value: 'warning' },
	{ label: 'Failed', value: 'failed' },
];

const retryOptions = [
	{
		label: 'Replay from selected span',
		value: 'span',
		description: 'Reuses prior successful context and starts from this span.',
	},
	{
		label: 'Replay full run',
		value: 'full',
		description: 'Runs the agent from the original input with current tools.',
	},
	{
		label: 'Create eval case',
		value: 'eval',
		description: 'Turns this run into a regression test before retrying.',
	},
];

const selectedRunId = ref('support-triage');
const selectedSpanId = ref('support-guardrail');
const statusFilter = ref('all');
const activeTags = ref(['model', 'tool']);
const minDuration = ref(0);
const jumpSpanId = ref('');
const retryMode = ref('span');
const isInspectorOpen = ref(false);
const replayCount = ref(3);
const lastAction = ref('No replay queued');

const selectedRun = computed(() => runOptions.find((run) => run.value === selectedRunId.value) || runOptions[0]);
const allSpans = computed(() => traceSpansByRun[selectedRunId.value] || []);
const tagOptions = computed(() => {
	const tags = new Map();
	for (const span of allSpans.value) {
		for (const tag of span.tags || []) {
			tags.set(tag, {
				label: tag,
				value: tag,
				description: `${allSpans.value.filter((candidate) => candidate.tags?.includes(tag)).length} matching spans`,
			});
		}
	}
	return [...tags.values()].sort((a, b) => a.label.localeCompare(b.label));
});
const spanOptions = computed(() => allSpans.value.map((span) => ({
	label: span.name,
	value: span.id,
	description: `${span.type} / ${span.durationMs}ms / ${span.statusLabel}`,
	status: span.status,
})));
const traceItems = computed(() => filterTree(buildTree(allSpans.value)));
const visibleSpans = computed(() => flattenSpans(traceItems.value));
const selectedSpan = computed(() => allSpans.value.find((span) => span.id === selectedSpanId.value) || visibleSpans.value[0] || allSpans.value[0]);
const totalDuration = computed(() => Math.max(1, ...allSpans.value.map((span) => span.startMs + span.durationMs)));
const failedCount = computed(() => allSpans.value.filter((span) => span.status === 'failed').length);
const warningCount = computed(() => allSpans.value.filter((span) => span.status === 'warning').length);
const modelSpanCount = computed(() => allSpans.value.filter((span) => span.type === 'model').length);
const criticalPath = computed(() => allSpans.value.reduce((longest, span) => span.durationMs > longest.durationMs ? span : longest, allSpans.value[0] || {}));
const inspectorPayload = computed(() => JSON.stringify({
	runId: selectedRun.value.value,
	spanId: selectedSpan.value?.id,
	type: selectedSpan.value?.type,
	status: selectedSpan.value?.status,
	timing: {
		startMs: selectedSpan.value?.startMs,
		durationMs: selectedSpan.value?.durationMs,
	},
	input: selectedSpan.value?.input,
	output: selectedSpan.value?.output,
	retry: {
		mode: retryMode.value,
		replayCount: replayCount.value,
	},
}, null, 2));

watch(traceItems, (items) => {
	const spans = flattenSpans(items);
	if (!spans.length) return;
	if (!spans.some((span) => span.id === selectedSpanId.value)) selectedSpanId.value = spans[0].id;
}, { immediate: true });

watch(selectedRunId, () => {
	statusFilter.value = 'all';
	activeTags.value = [];
	minDuration.value = 0;
	jumpSpanId.value = '';
	isInspectorOpen.value = false;
});

function buildTree(spans) {
	const nodes = new Map(spans.map((span) => [span.id, {
		...span,
		label: span.name,
		open: true,
		draggable: false,
		children: [],
	}]));
	const roots = [];

	for (const span of spans) {
		const node = nodes.get(span.id);
		if (span.parentId && nodes.has(span.parentId)) nodes.get(span.parentId).children.push(node);
		else roots.push(node);
	}

	return roots;
}

function filterTree(nodes) {
	return nodes
		.map((node) => {
			const children = filterTree(node.children || []);
			if (spanMatches(node) || children.length) return { ...node, children };
			return null;
		})
		.filter(Boolean);
}

function spanMatches(span) {
	const statusMatches = statusFilter.value === 'all' || span.status === statusFilter.value;
	const tagsMatch = !activeTags.value.length || activeTags.value.some((tag) => span.tags?.includes(tag));
	const durationMatches = Number(span.durationMs) >= Number(minDuration.value || 0);

	return statusMatches && tagsMatch && durationMatches;
}

function flattenSpans(nodes) {
	return nodes.flatMap((node) => [node, ...flattenSpans(node.children || [])]);
}

function selectSpan(value) {
	if (!value) return;
	selectedSpanId.value = value;
	jumpSpanId.value = value;
	isInspectorOpen.value = true;
}

function inspectCurrentSpan() {
	if (!selectedSpan.value) return;
	isInspectorOpen.value = true;
}

function queueReplay() {
	replayCount.value += 1;
	lastAction.value = `${retryMode.value === 'eval' ? 'Eval case' : 'Replay'} queued for ${selectedSpan.value?.name || 'selected span'}`;
	isInspectorOpen.value = false;
}

function exportTrace() {
	lastAction.value = `Trace export prepared for ${selectedRun.value.label}`;
}

function toneForStatus(status) {
	return {
		ok: 'success',
		warning: 'warning',
		failed: 'danger',
		running: 'info',
	}[status] || 'neutral';
}
</script>

<template>
	<div class="w-[86rem] max-w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-5">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-xs font-semibold uppercase text-muted-fg">AI observability</p>
						<DomStatusPill :tone="toneForStatus(selectedRun.status)" size="sm" :pulse="selectedRun.status === 'running'">
							{{ selectedRun.statusLabel }}
						</DomStatusPill>
					</div>
					<h3 class="mt-1 text-xl font-semibold">Agent run trace</h3>
					<p class="mt-1 max-w-3xl text-sm leading-6 text-muted-fg">
						Inspect model calls, tool spans, safety checks, latency, and retry decisions from one nested trace.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomButton variant="secondary" size="sm" @click="exportTrace">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						Export
					</DomButton>
					<DomButton size="sm" @click="inspectCurrentSpan">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M6 5h12v14H6V5Zm3 4h6M9 13h6M9 17h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						Inspect span
					</DomButton>
				</div>
			</div>

			<div class="mt-4 grid gap-3 lg:grid-cols-[minmax(17rem,0.9fr)_minmax(0,1.2fr)_minmax(12rem,0.6fr)]">
				<DomCombobox v-model="selectedRunId" :options="runOptions" label="Run" placeholder="Pick a run">
					<template #item="{ item }">
						<div class="min-w-0">
							<div class="flex items-center justify-between gap-3">
								<span class="truncate font-medium text-canvas-fg">{{ item.label }}</span>
								<DomBadge :tone="toneForStatus(item.status)" size="sm">{{ item.statusLabel }}</DomBadge>
							</div>
							<p class="mt-1 truncate text-xs text-muted-fg">{{ item.app }} / {{ item.durationMs }}ms / {{ item.cost }}</p>
						</div>
					</template>
				</DomCombobox>

				<DomCombobox v-model="jumpSpanId" :options="spanOptions" label="Jump to span" placeholder="Search spans..." @select="selectSpan($event.value)">
					<template #item="{ item }">
						<div class="flex min-w-0 items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate font-medium text-canvas-fg">{{ item.label }}</p>
								<p class="mt-1 truncate text-xs text-muted-fg">{{ item.description }}</p>
							</div>
							<span class="size-2 shrink-0 rounded-full" :class="{
								'bg-success': item.status === 'ok',
								'bg-warning': item.status === 'warning',
								'bg-destructive': item.status === 'failed',
								'bg-primary': item.status === 'running',
							}"></span>
						</div>
					</template>
				</DomCombobox>

				<DomRangeInput v-model="minDuration" label="Minimum duration" :min="0" :max="3000" :step="100" suffix="ms" />
			</div>

			<div class="mt-4 grid gap-3 xl:grid-cols-[minmax(15rem,0.45fr)_minmax(0,1fr)]">
				<DomToggleButtonGroup v-model="statusFilter" :options="statusOptions" label="Status" size="sm" chrome="none" />
				<DomTagCombobox
					v-model="activeTags"
					:options="tagOptions"
					label="Trace tags"
					placeholder="Filter by model, tool, safety..."
					clearable
				>
					<template #item="{ item }">
						<div class="min-w-0">
							<p class="truncate font-medium text-canvas-fg">{{ item.label }}</p>
							<p class="truncate text-xs text-muted-fg">{{ item.description }}</p>
						</div>
					</template>
					<template #tag="{ label, remove }">
						<span class="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-1 text-xs font-medium text-canvas-fg">
							{{ label }}
							<button type="button" class="rounded-full text-muted-fg hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" :aria-label="`Remove ${label}`" @click="remove">
								<svg viewBox="0 0 16 16" class="size-3" fill="none" aria-hidden="true">
									<path d="M5 5l6 6m0-6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
							</button>
						</span>
					</template>
				</DomTagCombobox>
			</div>
		</header>

		<main class="grid gap-4 p-4 lg:p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
			<section class="min-w-0 rounded-2xl border border-border bg-canvas">
				<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
					<div>
						<p class="text-sm font-semibold text-canvas-fg">{{ selectedRun.label }}</p>
						<p class="mt-1 text-xs text-muted-fg">{{ selectedRun.description }}</p>
					</div>
					<div class="flex flex-wrap items-center gap-2 text-xs text-muted-fg">
						<DomBadge variant="outline">{{ visibleSpans.length }} visible spans</DomBadge>
						<span>{{ lastAction }}</span>
					</div>
				</div>

				<div class="grid grid-cols-[minmax(15rem,0.95fr)_minmax(14rem,1fr)] gap-3 border-b border-border bg-secondary/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-fg">
					<span>Span</span>
					<div class="grid grid-cols-4">
						<span>0ms</span>
						<span class="text-center">{{ Math.round(totalDuration * 0.33) }}ms</span>
						<span class="text-center">{{ Math.round(totalDuration * 0.66) }}ms</span>
						<span class="text-right">{{ totalDuration }}ms</span>
					</div>
				</div>

				<div class="max-h-[34rem] overflow-auto p-2">
					<DomTreeView
						v-if="traceItems.length"
						v-model="selectedSpanId"
						:items="traceItems"
						:draggable="false"
						:chrome="false"
						label="Agent run trace spans"
						@select="selectSpan($event.value)"
					>
						<template #row="{ item, open, selected, toggle }">
							<TraceSpanRow
								:item="item"
								:open="open"
								:selected="selected"
								:toggle="toggle"
								:total-duration="totalDuration"
							/>
						</template>
					</DomTreeView>
					<div v-else class="rounded-2xl border border-dashed border-border p-8 text-center">
						<p class="text-sm font-semibold text-canvas-fg">No spans match these filters</p>
						<p class="mt-1 text-sm text-muted-fg">Clear a status, tag, or duration filter to bring the trace back.</p>
					</div>
				</div>
			</section>

			<aside class="grid content-start gap-3">
				<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
					<TraceMetric label="Duration" :value="`${selectedRun.durationMs}ms`" :detail="`${allSpans.length} spans captured`" tone="info" />
					<TraceMetric label="Model spans" :value="modelSpanCount" :detail="`${criticalPath.name || 'No span'} is the critical path`" />
					<TraceMetric label="Review load" :value="warningCount + failedCount" :detail="`${warningCount} warnings, ${failedCount} failures`" :tone="failedCount ? 'danger' : warningCount ? 'warning' : 'success'" />
					<TraceMetric label="Run cost" :value="selectedRun.cost" detail="Estimated model and tool cost" tone="success" />
				</div>

				<div class="rounded-2xl border border-border skin-card p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-canvas-fg">Selected span</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ selectedSpan?.description }}</p>
						</div>
						<DomStatusPill :tone="toneForStatus(selectedSpan?.status)" size="sm">
							{{ selectedSpan?.statusLabel }}
						</DomStatusPill>
					</div>
					<dl class="mt-4 grid grid-cols-2 gap-3 text-xs">
						<div>
							<dt class="text-muted-fg">Type</dt>
							<dd class="mt-1 font-medium text-canvas-fg">{{ selectedSpan?.type }}</dd>
						</div>
						<div>
							<dt class="text-muted-fg">Tokens</dt>
							<dd class="mt-1 font-medium text-canvas-fg">{{ selectedSpan?.tokens }}</dd>
						</div>
						<div>
							<dt class="text-muted-fg">Cost</dt>
							<dd class="mt-1 font-medium text-canvas-fg">{{ selectedSpan?.cost }}</dd>
						</div>
						<div>
							<dt class="text-muted-fg">Start</dt>
							<dd class="mt-1 font-medium text-canvas-fg">{{ selectedSpan?.startMs }}ms</dd>
						</div>
					</dl>
					<DomButton class="mt-4 w-full" variant="secondary" size="sm" @click="inspectCurrentSpan">Open inspector</DomButton>
				</div>
			</aside>
		</main>

		<DomDrawer v-model="isInspectorOpen" side="bottom" title="Span inspector" width="var(--container-5xl)">
			<div v-if="selectedSpan" class="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<section class="min-w-0">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">{{ selectedRun.label }}</p>
							<h4 class="mt-1 text-lg font-semibold text-canvas-fg">{{ selectedSpan.name }}</h4>
							<p class="mt-1 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedSpan.description }}</p>
						</div>
						<DomStatusPill :tone="toneForStatus(selectedSpan.status)">{{ selectedSpan.statusLabel }}</DomStatusPill>
					</div>

					<div class="mt-4 grid gap-3 sm:grid-cols-3">
						<TraceMetric label="Duration" :value="`${selectedSpan.durationMs}ms`" :detail="`Started at ${selectedSpan.startMs}ms`" />
						<TraceMetric label="Tokens" :value="selectedSpan.tokens" detail="Prompt plus completion" />
						<TraceMetric label="Cost" :value="selectedSpan.cost" detail="Estimated span cost" />
					</div>

					<div class="mt-4">
						<DomCodeInput v-model="inspectorPayload" label="Span payload" lang="json" :rows="12" :editor="false" read-only />
					</div>
				</section>

				<aside class="rounded-2xl border border-border skin-card p-4">
					<DomRadioGroup v-model="retryMode" :options="retryOptions" label="Retry policy">
						<template #option="{ option }">
							<div class="min-w-0">
								<p class="font-medium text-canvas-fg">{{ option.label }}</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">{{ option.description }}</p>
							</div>
						</template>
					</DomRadioGroup>

					<div class="mt-4 rounded-2xl border border-border bg-canvas p-3 text-sm leading-6 text-muted-fg">
						<p class="font-medium text-canvas-fg">Replay guardrails</p>
						<p class="mt-1">Replay requests should include operator identity, selected span id, prompt version, trace redaction state, and a reason visible in audit logs.</p>
					</div>
				</aside>
			</div>
			<template #footer>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<p class="text-sm text-muted-fg">{{ lastAction }}</p>
					<div class="flex items-center gap-2">
						<DomButton data-close variant="ghost" size="sm">Close</DomButton>
						<DomButton size="sm" @click="queueReplay">Queue action</DomButton>
					</div>
				</div>
			</template>
		</DomDrawer>
	</div>
</template>
