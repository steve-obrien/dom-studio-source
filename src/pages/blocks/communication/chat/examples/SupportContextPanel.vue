<script setup>
import { computed } from 'vue';
import {
	DomAvatar,
	DomBadge,
	DomButton,
	DomIconButton,
	DomSelect,
	DomStatusPill,
} from '@getdom/studio/vue';

const props = defineProps({
	conversation: {
		type: Object,
		default: null,
	},
	agents: {
		type: Array,
		default: () => [],
	},
	priorityOptions: {
		type: Array,
		default: () => [],
	},
	busy: {
		type: Boolean,
		default: false,
	},
	closable: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['close', 'update-agent', 'update-priority', 'resolve', 'reopen', 'retry']);

const agentOptions = computed(() => props.agents.map((agent) => ({
	...agent,
	value: agent.id,
	label: agent.name,
	description: agent.role,
})));
const selectedAgent = computed(() => props.agents.find((agent) => agent.id === props.conversation?.agentId) || null);
const selectedPriority = computed(() => props.priorityOptions.find((option) => option.value === props.conversation?.priority) || null);
const isResolved = computed(() => props.conversation?.ticketState === 'resolved');
const hasFailedResponse = computed(() => props.conversation?.status === 'error');
const ticketTone = computed(() => isResolved.value ? 'success' : hasFailedResponse.value ? 'danger' : 'info');

/**
 * Emits a specialist assignment update.
 *
 * @param {string} agentId Agent identifier.
 * @returns {void}
 */
function updateAgent(agentId) {
	emit('update-agent', agentId);
}

/**
 * Emits a priority update.
 *
 * @param {string} priority Priority identifier.
 * @returns {void}
 */
function updatePriority(priority) {
	emit('update-priority', priority);
}
</script>

<template>
	<aside class="flex h-full min-h-0 flex-col bg-canvas text-canvas-fg">
		<header class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4">
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Ticket context</p>
					<DomStatusPill :tone="ticketTone" size="sm">{{ isResolved ? 'Resolved' : hasFailedResponse ? 'Needs retry' : 'Open' }}</DomStatusPill>
				</div>
				<h2 class="mt-1 truncate text-sm font-semibold">{{ conversation?.ticketId || 'No ticket selected' }}</h2>
			</div>
			<DomIconButton
				v-if="closable"
				label="Close ticket context"
				size="sm"
				variant="ghost"
				icon="M6 6l12 12M18 6 6 18"
				@click="emit('close')"
			/>
		</header>

		<div v-if="conversation" class="min-h-0 flex-1 overflow-y-auto">
			<section class="border-b border-border px-4 py-5">
				<div class="flex items-start gap-3">
					<DomAvatar :name="conversation.customer.name" :initials="conversation.customer.initials" size="md" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{{ conversation.customer.name }}</p>
						<p class="mt-0.5 truncate text-xs text-muted-fg">{{ conversation.customer.company }}</p>
						<p class="mt-2 break-all text-xs text-muted-fg">{{ conversation.customer.email }}</p>
					</div>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					<DomBadge size="sm" tone="primary">{{ conversation.customer.plan }}</DomBadge>
					<DomBadge size="sm" tone="neutral">{{ conversation.customer.accountValue }}</DomBadge>
				</div>
				<dl class="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-xs">
					<div>
						<dt class="text-muted-fg">Locale</dt>
						<dd class="mt-1 font-medium text-canvas-fg">{{ conversation.customer.locale }}</dd>
					</div>
					<div>
						<dt class="text-muted-fg">SLA</dt>
						<dd class="mt-1 font-medium" :class="conversation.priority === 'urgent' ? 'text-destructive' : 'text-canvas-fg'">{{ conversation.slaLabel }}</dd>
					</div>
				</dl>
			</section>

			<section class="space-y-4 border-b border-border px-4 py-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Routing</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Switch specialists without losing the conversation or tool history.</p>
				</div>
				<DomSelect
					:model-value="conversation.agentId"
					:options="agentOptions"
					label="Assigned copilot"
					width="w-full"
					:disabled="busy || isResolved"
					@update:model-value="updateAgent"
				>
					<template #value>
						<span v-if="selectedAgent" class="flex min-w-0 items-center gap-2">
							<DomAvatar :name="selectedAgent.name" :initials="selectedAgent.initials" size="xs" />
							<span class="truncate">{{ selectedAgent.name }}</span>
							<DomStatusPill :tone="selectedAgent.tone" size="sm">{{ selectedAgent.model }}</DomStatusPill>
						</span>
					</template>
					<template #option="{ option }">
						<span class="flex items-start gap-3">
							<DomAvatar :name="option.label" :initials="option.initials" size="sm" />
							<span class="min-w-0">
								<span class="block font-medium">{{ option.label }}</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
							</span>
						</span>
					</template>
				</DomSelect>

				<DomSelect
					:model-value="conversation.priority"
					:options="priorityOptions"
					label="Priority"
					width="w-full"
					:disabled="busy || isResolved"
					@update:model-value="updatePriority"
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
								<span class="block font-medium">{{ option.label }}</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
							</span>
							<DomStatusPill :tone="option.tone" size="sm">{{ option.label }}</DomStatusPill>
						</span>
					</template>
				</DomSelect>
			</section>

			<section class="border-b border-border px-4 py-5">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent activity</p>
					<DomBadge size="sm" tone="neutral">{{ conversation.activity.length }}</DomBadge>
				</div>
				<ol class="mt-4 space-y-4">
					<li v-for="entry in conversation.activity.slice(0, 4)" :key="entry.id" class="relative pl-4 text-xs before:absolute before:left-0 before:top-1.5 before:size-1.5 before:rounded-full before:bg-primary">
						<p class="font-medium text-canvas-fg">{{ entry.action }}</p>
						<p class="mt-1 leading-5 text-muted-fg">{{ entry.detail }}</p>
						<p class="mt-1 text-[11px] text-muted-fg">{{ entry.actor }} · {{ entry.time }}</p>
					</li>
				</ol>
			</section>

			<section class="space-y-3 px-4 py-5">
				<DomButton
					v-if="hasFailedResponse"
					class="w-full justify-center"
					variant="danger"
					:loading="busy"
					@click="emit('retry')"
				>
					Retry failed lookup
				</DomButton>
				<DomButton
					v-else-if="isResolved"
					class="w-full justify-center"
					variant="secondary"
					:loading="busy"
					@click="emit('reopen')"
				>
					Reopen ticket
				</DomButton>
				<DomButton
					v-else
					class="w-full justify-center"
					variant="primary"
					:loading="busy"
					@click="emit('resolve')"
				>
					Resolve ticket
				</DomButton>
				<p class="text-center text-[11px] leading-5 text-muted-fg">Actions are saved through the demo API and survive a page reload while the server is running.</p>
			</section>
		</div>
	</aside>
</template>
