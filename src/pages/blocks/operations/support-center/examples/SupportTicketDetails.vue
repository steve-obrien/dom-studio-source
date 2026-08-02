<script setup>
import { computed } from 'vue';
import {
	DomAvatar,
	DomBadge,
	DomButton,
	DomProgress,
	DomSelect,
	DomStatusPill,
} from '@getdom/studio/vue';

const props = defineProps({
	ticket: {
		type: Object,
		default: null,
	},
	catalogs: {
		type: Object,
		default: () => ({ assignees: [], priorities: [] }),
	},
	busy: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update-routing', 'resolve', 'reopen']);

const selectedAssignee = computed(() => props.catalogs.assignees?.find((option) => option.value === props.ticket?.assigneeId) || null);
const selectedPriority = computed(() => props.catalogs.priorities?.find((option) => option.value === props.ticket?.priority) || null);
const isResolved = computed(() => props.ticket?.state === 'resolved');
const failedDeliveryCount = computed(() => props.ticket?.messages?.filter((message) => message.status === 'failed').length || 0);

/**
 * Emits one exact routing patch to the owning support workspace.
 *
 * @param {Record<string, string>} patch Assignment or priority patch.
 * @returns {void}
 */
function updateRouting(patch) {
	emit('update-routing', patch);
}

/**
 * Returns a semantic tone for the current ticket lifecycle.
 *
 * @returns {string} DOM Studio status tone.
 */
function ticketTone() {
	if (isResolved.value) return 'success';
	if (failedDeliveryCount.value) return 'danger';
	if (props.ticket?.sla?.state === 'breached') return 'danger';
	return 'info';
}
</script>

<template>
	<aside v-if="ticket" class="flex h-full min-h-0 flex-col bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border px-4 py-4">
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Ticket details</p>
					<p class="mt-1 font-semibold">{{ ticket.id }}</p>
				</div>
				<DomStatusPill :tone="ticketTone()" size="sm">
					{{ isResolved ? 'Resolved' : failedDeliveryCount ? 'Delivery failed' : 'Active' }}
				</DomStatusPill>
			</div>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto">
			<section class="border-b border-border px-4 py-5">
				<div class="flex items-start gap-3">
					<DomAvatar :name="ticket.customer.name" :initials="ticket.customer.initials" size="md" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{{ ticket.customer.name }}</p>
						<p class="mt-0.5 truncate text-xs text-muted-fg">{{ ticket.customer.company }}</p>
						<p class="mt-2 break-all text-xs text-muted-fg">{{ ticket.customer.email }}</p>
					</div>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					<DomBadge size="sm" tone="primary">{{ ticket.customer.plan }}</DomBadge>
					<DomBadge size="sm" tone="neutral">{{ ticket.customer.value }}</DomBadge>
				</div>
				<dl class="mt-4 grid grid-cols-2 gap-4 text-xs">
					<div>
						<dt class="text-muted-fg">Account health</dt>
						<dd class="mt-1 font-medium">{{ ticket.customer.health }}</dd>
					</div>
					<div>
						<dt class="text-muted-fg">Locale</dt>
						<dd class="mt-1 font-medium">{{ ticket.customer.locale }}</dd>
					</div>
				</dl>
			</section>

			<section class="space-y-4 border-b border-border px-4 py-5">
				<div>
					<div class="flex items-center justify-between gap-3 text-xs">
						<span class="font-semibold uppercase tracking-[0.14em] text-muted-fg">SLA progress</span>
						<span :class="ticket.sla.state === 'breached' ? 'text-destructive' : 'text-muted-fg'">{{ ticket.sla.label }}</span>
					</div>
					<DomProgress class="mt-2" :value="ticket.sla.progress" :max="100" :tone="ticket.sla.state === 'breached' ? 'danger' : 'primary'" size="sm" />
				</div>

				<DomSelect
					:model-value="ticket.assigneeId"
					label="Assigned teammate"
					:options="catalogs.assignees"
					width="min-w-[18rem]"
					:disabled="busy || isResolved"
					@update:model-value="updateRouting({ assigneeId: $event })"
				>
					<template #value>
						<span v-if="selectedAssignee" class="flex min-w-0 items-center gap-2">
							<DomAvatar :name="selectedAssignee.label" :initials="selectedAssignee.initials" size="xs" />
							<span class="truncate">{{ selectedAssignee.label }}</span>
						</span>
					</template>
					<template #option="{ option }">
						<span class="flex items-start gap-3">
							<DomAvatar :name="option.label" :initials="option.initials" size="sm" />
							<span class="min-w-0">
								<span class="block font-semibold">{{ option.label }}</span>
								<span class="mt-0.5 block text-xs opacity-70">{{ option.description }}</span>
							</span>
						</span>
					</template>
				</DomSelect>

				<DomSelect
					:model-value="ticket.priority"
					label="Priority"
					:options="catalogs.priorities"
					width="min-w-[18rem]"
					:disabled="busy || isResolved"
					@update:model-value="updateRouting({ priority: $event })"
				>
					<template #value>
						<span v-if="selectedPriority" class="flex min-w-0 items-center justify-between gap-2">
							<span class="truncate">{{ selectedPriority.label }}</span>
							<DomStatusPill :tone="selectedPriority.tone" size="sm">{{ selectedPriority.label }}</DomStatusPill>
						</span>
					</template>
					<template #option="{ option }">
						<span class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block font-semibold">{{ option.label }}</span>
								<span class="mt-0.5 block text-xs opacity-70">{{ option.description }}</span>
							</span>
							<DomStatusPill :tone="option.tone" size="sm">{{ option.label }}</DomStatusPill>
						</span>
					</template>
				</DomSelect>
			</section>

			<section class="border-b border-border px-4 py-5">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer tags</p>
					<DomBadge size="sm" tone="neutral">{{ ticket.tags.length }}</DomBadge>
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					<DomBadge v-for="tag in ticket.tags" :key="tag" size="sm" tone="neutral">{{ tag }}</DomBadge>
				</div>
			</section>

			<section class="px-4 py-5">
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent operations</p>
				<ol class="mt-4 space-y-4">
					<li v-for="entry in ticket.activity.slice(0, 5)" :key="entry.id" class="border-l-2 border-primary/30 pl-3 text-xs">
						<p class="font-semibold">{{ entry.action }}</p>
						<p class="mt-1 leading-5 text-muted-fg">{{ entry.detail }}</p>
						<p class="mt-1 text-[11px] text-muted-fg">{{ entry.actor }} · {{ entry.time }}</p>
					</li>
				</ol>
			</section>
		</div>

		<footer class="shrink-0 border-t border-border p-4">
			<DomButton
				class="w-full justify-center"
				:variant="isResolved ? 'secondary' : 'primary'"
				:loading="busy"
				@click="emit(isResolved ? 'reopen' : 'resolve')"
			>
				{{ isResolved ? 'Reopen ticket' : 'Resolve ticket' }}
			</DomButton>
			<p class="mt-2 text-center text-[11px] leading-5 text-muted-fg">Lifecycle actions are revision checked and saved through the demo API.</p>
		</footer>
	</aside>
</template>
