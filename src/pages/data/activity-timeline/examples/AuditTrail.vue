<script setup>
import { ref } from 'vue';
import { DomActivityTimeline, DomBadge, DomButton } from '../../../lib/vue';

const inspectedReceipt = ref('');
const auditRows = [
	{
		id: 'audit-9824',
		action: 'Access policy published',
		detail: 'The reviewed policy revision became active for production workspaces.',
		occurredAt: 'Today, 11:08',
		principal: 'Maya Chen',
		outcome: 'published',
		severity: 'success',
		receipt: 'rcpt_policy_9824',
	},
	{
		id: 'audit-9823',
		action: 'Exception requested',
		detail: 'Owen requested temporary billing-export access with a 24-hour expiry.',
		occurredAt: 'Today, 10:41',
		principal: 'Owen Reed',
		outcome: 'review required',
		severity: 'warning',
		receipt: 'rcpt_exception_9823',
	},
	{
		id: 'audit-9822',
		action: 'Evidence snapshot retained',
		detail: 'Role assignments, policy checks, and the request checksum were stored together.',
		occurredAt: 'Today, 10:39',
		principal: 'Policy worker',
		outcome: 'retained',
		severity: 'neutral',
		receipt: 'rcpt_evidence_9822',
	},
];

/**
 * Records the receipt selected by the application-owned action slot.
 *
 * @param {Record<string, unknown>} row Original audit resource row.
 * @returns {void}
 */
function inspectReceipt(row) {
	inspectedReceipt.value = String(row.receipt || 'Receipt unavailable');
}
</script>

<template>
	<div class="w-full min-w-0 rounded-xl border border-border skin-card p-4 sm:p-5" data-testid="audit-activity-timeline">
		<DomActivityTimeline
			:rows="auditRows"
			title-key="action"
			description-key="detail"
			timestamp-key="occurredAt"
			meta-key="principal"
			status-key="outcome"
			tone-key="severity"
			density="compact"
			aria-label="Access policy audit trail"
		>
			<template #actions="{ row }">
				<DomButton size="sm" variant="ghost" @click="inspectReceipt(row)">Inspect receipt</DomButton>
			</template>
		</DomActivityTimeline>

		<div v-if="inspectedReceipt" class="mt-1 flex flex-wrap items-center gap-2 border-t border-border pt-4" aria-live="polite">
			<DomBadge tone="neutral" variant="outline">Receipt</DomBadge>
			<code class="text-xs text-muted-fg">{{ inspectedReceipt }}</code>
		</div>
	</div>
</template>
