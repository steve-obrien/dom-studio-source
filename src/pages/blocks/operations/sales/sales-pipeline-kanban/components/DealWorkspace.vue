<script setup>
import { computed, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomJsonViewer,
	DomProgress,
	DomStatusPill,
	DomTabs,
} from '@getdom/studio/vue';

const props = defineProps({
	deal: {
		type: Object,
		required: true,
	},
	activity: {
		type: Array,
		default: () => [],
	},
	forecastProvider: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(['review-transition', 'log-activity']);
const activeTab = ref('overview');
const tabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'activity', label: 'Activity' },
	{ key: 'evidence', label: 'Evidence' },
];

const dealActivity = computed(() => props.activity.filter((item) => !item.dealId || item.dealId === props.deal.id));
const evidence = computed(() => ({
	deal: props.deal.evidence,
	forecastProvider: props.forecastProvider,
}));

/**
 * Formats an integer currency value for pipeline display.
 *
 * @param {number} value Currency value in dollars.
 * @returns {string} Formatted currency label.
 */
function money(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value || 0);
}

/**
 * Formats an ISO date as a concise sales close date.
 *
 * @param {string} value ISO date.
 * @returns {string} Formatted date label.
 */
function formatDate(value) {
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

/**
 * Formats an activity timestamp for the local viewer.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Formatted time label.
 */
function formatTime(value) {
	return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
</script>

<template>
	<div class="flex h-full min-h-0 flex-col bg-canvas">
		<header class="shrink-0 border-b border-border px-4 py-4">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ deal.owner.label }} · {{ deal.region.label }}</p>
					<h2 class="mt-1 truncate text-xl font-semibold">{{ deal.account }}</h2>
					<p class="mt-1 truncate text-sm text-muted-fg">{{ deal.description }}</p>
				</div>
				<DomStatusPill :tone="deal.forecastMeta.tone" :label="deal.forecastMeta.label" size="sm" />
			</div>
			<div class="mt-4 grid grid-cols-3 divide-x divide-border border-y border-border text-sm">
				<div class="py-3 pr-2"><p class="text-xs text-muted-fg">Value</p><p class="mt-1 font-semibold">{{ money(deal.value) }}</p></div>
				<div class="px-2 py-3"><p class="text-xs text-muted-fg">Weighted</p><p class="mt-1 font-semibold">{{ money(deal.weightedValue) }}</p></div>
				<div class="py-3 pl-2"><p class="text-xs text-muted-fg">Close</p><p class="mt-1 font-semibold">{{ formatDate(deal.closeDate) }}</p></div>
			</div>
		</header>

		<DomTabs v-model="activeTab" :tabs="tabs" variant="page" fill class="min-h-0 flex-1">
			<template #overview>
				<div class="h-full min-h-0 overflow-y-auto p-4">
					<DomAlert
						v-if="['overdue', 'missing'].includes(deal.activityState)"
						:tone="deal.activityMeta.tone"
						variant="soft"
						:title="deal.activityMeta.label"
						:description="deal.activityState === 'missing' ? 'Log a next activity before this opportunity goes quiet.' : `${deal.lastActivity}. Update the next action or record the outcome.`"
					/>

					<div class="flex items-center justify-between gap-3" :class="['overdue', 'missing'].includes(deal.activityState) ? 'mt-5' : ''">
						<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current stage</p><p class="mt-1 font-semibold">{{ deal.stageMeta.label }}</p></div>
						<DomBadge :tone="deal.stageHealth === 'stale' ? 'warning' : 'success'" variant="soft">{{ deal.daysInStage }} days</DomBadge>
					</div>
					<DomProgress class="mt-3" :value="deal.probability" size="sm" />
					<p class="mt-2 text-xs text-muted-fg">{{ deal.probability }}% seller probability · {{ deal.stageMeta.probability }}% stage default</p>

					<div class="mt-5 border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Next step</p>
						<p class="mt-2 text-sm font-semibold">{{ deal.nextStep }}</p>
						<p class="mt-2 text-xs leading-5 text-muted-fg">Last activity: {{ deal.lastActivity }}</p>
					</div>

					<div class="mt-5 border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Close plan</p>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ deal.closePlan }}</p>
					</div>

					<div class="mt-5 border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Buying group</p>
						<div class="mt-3 flex flex-wrap gap-2"><DomBadge v-for="person in deal.stakeholders" :key="person" tone="neutral" variant="soft">{{ person }}</DomBadge></div>
						<div v-if="deal.risks.length" class="mt-3 flex flex-wrap gap-2"><DomBadge v-for="risk in deal.risks" :key="risk" tone="warning" variant="soft">{{ risk }}</DomBadge></div>
					</div>

					<div class="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5">
						<DomButton @click="emit('review-transition')">Review transition</DomButton>
						<DomButton variant="secondary" @click="emit('log-activity')">Log activity</DomButton>
					</div>
				</div>
			</template>

			<template #activity>
				<div class="h-full min-h-0 overflow-y-auto px-4 py-2">
					<div v-for="item in dealActivity" :key="item.id" class="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-b border-border py-4 last:border-b-0">
						<p class="text-[11px] text-muted-fg">{{ formatTime(item.createdAt) }}</p>
						<div><div class="flex items-center gap-2"><p class="text-sm font-semibold">{{ item.title }}</p><DomStatusPill :tone="item.tone" label="" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p><p class="mt-2 font-mono text-[10px] text-muted-fg">{{ item.providerReceipt || item.actor }}</p></div>
					</div>
				</div>
			</template>

			<template #evidence>
				<div class="h-full min-h-0 overflow-y-auto p-4"><DomJsonViewer :value="evidence" title="CRM and qualification evidence" :filename="`${deal.id}-evidence.json`" density="compact" :preview-lines="24" /></div>
			</template>
		</DomTabs>
	</div>
</template>
