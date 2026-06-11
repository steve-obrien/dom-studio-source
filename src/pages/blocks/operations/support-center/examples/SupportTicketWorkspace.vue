<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCard, DomNativeSelect, DomTabs } from '@getdom/studio/vue';

const queueFilters = [
	{ label: 'Open', value: 'open' },
	{ label: 'Escalated', value: 'escalated' },
	{ label: 'Waiting', value: 'waiting' },
];

const tabs = [
	{ key: 'reply', label: 'Reply' },
	{ key: 'notes', label: 'Notes' },
];

const tickets = [
	{
		id: 'T-2048',
		subject: 'Cannot invite the design team',
		customer: 'Northstar Labs',
		contact: 'Priya Shah',
		contactInitials: 'PS',
		plan: 'Scale',
		status: 'Waiting on support',
		priority: 'High',
		sla: '42m left',
		health: 'At risk',
		arr: 'GBP 42k',
		lastSeen: '8 minutes ago',
		tags: ['Access', 'Workspace'],
		messages: [
			{ author: 'Priya Shah', role: 'Customer', time: '09:24', body: 'The invite button fails for two teammates. Both are on the same company domain.' },
			{ author: 'Maya Chen', role: 'Support', time: '09:31', body: 'I found a workspace policy mismatch and I am checking whether the domain rule is blocking them.' },
		],
	},
	{
		id: 'T-2042',
		subject: 'Invoice export is missing tax IDs',
		customer: 'Harbor Finance',
		contact: 'Jon Bell',
		contactInitials: 'JB',
		plan: 'Business',
		status: 'Escalated',
		priority: 'Urgent',
		sla: '12m left',
		health: 'Healthy',
		arr: 'GBP 18k',
		lastSeen: '22 minutes ago',
		tags: ['Billing', 'Exports'],
		messages: [
			{ author: 'Jon Bell', role: 'Customer', time: '08:58', body: 'The CSV export works, but the tax IDs are blank for our German customers.' },
			{ author: 'Finance Ops', role: 'Internal', time: '09:05', body: 'Confirmed the field exists in billing metadata. Needs export mapping review.' },
		],
	},
	{
		id: 'T-2039',
		subject: 'Webhook retries after successful deploy',
		customer: 'Atlas Robotics',
		contact: 'Remy Ford',
		contactInitials: 'RF',
		plan: 'Enterprise',
		status: 'Engineering review',
		priority: 'Medium',
		sla: '3h left',
		health: 'Expansion',
		arr: 'GBP 96k',
		lastSeen: '1 hour ago',
		tags: ['API', 'Webhook'],
		messages: [
			{ author: 'Remy Ford', role: 'Customer', time: 'Yesterday', body: 'We receive duplicate retry events even after returning a 200 response.' },
			{ author: 'Sam Lee', role: 'Support', time: '09:12', body: 'I added the request IDs to the engineering handoff and linked the replay logs.' },
		],
	},
];

const selectedTicketId = ref(tickets[0].id);
const activeTab = ref('reply');
const queueFilter = ref('open');
const replyDraft = ref('Hi Priya, I found the workspace invite policy that is blocking those teammates. I can update the allowed domain rule now, then you should be able to resend both invites.');

const selectedTicket = computed(() => tickets.find((ticket) => ticket.id === selectedTicketId.value) || tickets[0]);
const selectedMessageCount = computed(() => selectedTicket.value.messages.length);
const activeIndex = computed(() => tickets.findIndex((ticket) => ticket.id === selectedTicket.value.id));

function priorityClasses(priority) {
	return {
		Urgent: 'bg-destructive/15 text-destructive',
		High: 'bg-warning/15 text-warning',
		Medium: 'bg-primary/15 text-primary',
	}[priority] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border skin-raised px-4 py-4 sm:px-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Support center</p>
				<h3 class="mt-1 text-xl font-semibold tracking-tight">Ticket triage</h3>
			</div>
			<div class="flex items-center gap-2">
				<DomNativeSelect v-model="queueFilter" :options="queueFilters" class="w-32" />
				<DomButton size="sm">
					<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					</svg>
					Macro
				</DomButton>
			</div>
		</header>

		<div class="grid min-h-[42rem] lg:grid-cols-[19rem_minmax(0,1fr)_18rem]">
			<aside class="border-b border-border skin-raised p-3 lg:border-b-0 lg:border-r">
				<div class="mb-3 grid grid-cols-3 gap-2 text-center">
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">18</p>
						<p class="text-[11px] text-muted-fg">Open</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">4</p>
						<p class="text-[11px] text-muted-fg">SLA</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">91%</p>
						<p class="text-[11px] text-muted-fg">CSAT</p>
					</div>
				</div>

				<div class="space-y-2">
					<button
						v-for="ticket in tickets"
						:key="ticket.id"
						type="button"
						class="w-full rounded-xl border p-3 text-left transition hover:border-primary/40"
						:class="ticket.id === selectedTicket.id ? 'border-primary/50 bg-primary/10' : 'border-border bg-background'"
						@click="selectedTicketId = ticket.id"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ ticket.subject }}</p>
								<p class="mt-1 truncate text-xs text-muted-fg">{{ ticket.customer }} / {{ ticket.contact }}</p>
							</div>
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="priorityClasses(ticket.priority)">
								{{ ticket.priority }}
							</span>
						</div>
						<div class="mt-3 flex items-center justify-between text-xs text-muted-fg">
							<span>{{ ticket.status }}</span>
							<span>{{ ticket.sla }}</span>
						</div>
					</button>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<section class="border-b border-border px-4 py-4 sm:px-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">{{ selectedTicket.id }}</span>
								<span class="rounded-full px-2 py-1 text-xs font-semibold" :class="priorityClasses(selectedTicket.priority)">
									{{ selectedTicket.priority }}
								</span>
							</div>
							<h4 class="mt-3 text-2xl font-semibold tracking-tight">{{ selectedTicket.subject }}</h4>
							<p class="mt-1 text-sm text-muted-fg">{{ selectedTicket.customer }} has {{ selectedTicket.sla }} before SLA breach.</p>
						</div>
						<DomButton variant="secondary" size="sm">Assign</DomButton>
					</div>
				</section>

				<section class="space-y-4 p-4 sm:p-5">
					<div class="space-y-3">
						<article
							v-for="message in selectedTicket.messages"
							:key="`${selectedTicket.id}-${message.author}-${message.time}`"
							class="rounded-xl border border-border bg-background p-4"
						>
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm font-semibold">{{ message.author }}</p>
									<p class="text-xs text-muted-fg">{{ message.role }} / {{ message.time }}</p>
								</div>
								<span v-if="message.role === 'Internal'" class="rounded-full bg-warning/15 px-2 py-1 text-[11px] font-semibold text-warning">Internal</span>
							</div>
							<p class="mt-3 text-sm leading-6 text-muted-fg">{{ message.body }}</p>
						</article>
					</div>

					<DomCard padding="sm">
						<DomTabs v-model="activeTab" :tabs="tabs">
							<template #reply>
								<textarea
									v-model="replyDraft"
									rows="5"
									class="block w-full resize-none rounded-xl border border-input bg-background p-3 text-sm leading-6 text-fg outline-none transition placeholder:text-muted-fg focus:border-primary"
									placeholder="Write a clear, useful response..."
								></textarea>
								<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
									<p class="text-xs text-muted-fg">{{ replyDraft.length }} characters / {{ selectedMessageCount }} previous messages</p>
									<div class="flex gap-2">
										<DomButton variant="secondary" size="sm">Save draft</DomButton>
										<DomButton size="sm">Send reply</DomButton>
									</div>
								</div>
							</template>
							<template #notes>
								<div class="rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-sm leading-6 text-muted-fg">
									Customer is blocked on teammate rollout. Mention the policy change, then confirm the new invite path before closing.
								</div>
							</template>
						</DomTabs>
					</DomCard>
				</section>
			</main>

			<aside class="space-y-3 skin-raised p-4">
				<DomCard padding="sm">
					<div class="flex items-center gap-3">
						<div class="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-fg">
							{{ selectedTicket.contactInitials }}
						</div>
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold">{{ selectedTicket.contact }}</p>
							<p class="truncate text-xs text-muted-fg">{{ selectedTicket.customer }}</p>
						</div>
					</div>
					<dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
						<div>
							<dt class="text-xs text-muted-fg">Plan</dt>
							<dd class="font-semibold">{{ selectedTicket.plan }}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted-fg">ARR</dt>
							<dd class="font-semibold">{{ selectedTicket.arr }}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted-fg">Health</dt>
							<dd class="font-semibold">{{ selectedTicket.health }}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted-fg">Seen</dt>
							<dd class="font-semibold">{{ selectedTicket.lastSeen }}</dd>
						</div>
					</dl>
				</DomCard>

				<DomCard padding="sm">
					<h5 class="text-sm font-semibold">Resolution checklist</h5>
					<div class="mt-3 space-y-2">
						<label class="flex items-start gap-2 text-sm text-muted-fg">
							<input type="checkbox" checked class="mt-1 size-4 rounded border-input accent-current" />
							<span>Confirm account and plan entitlement</span>
						</label>
						<label class="flex items-start gap-2 text-sm text-muted-fg">
							<input type="checkbox" checked class="mt-1 size-4 rounded border-input accent-current" />
							<span>Attach relevant product logs</span>
						</label>
						<label class="flex items-start gap-2 text-sm text-muted-fg">
							<input type="checkbox" class="mt-1 size-4 rounded border-input accent-current" />
							<span>Send response and set follow-up reminder</span>
						</label>
					</div>
				</DomCard>

				<DomCard padding="sm">
					<h5 class="text-sm font-semibold">Tags</h5>
					<div class="mt-3 flex flex-wrap gap-2">
						<span
							v-for="tag in selectedTicket.tags"
							:key="tag"
							class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg"
						>
							{{ tag }}
						</span>
					</div>
					<p class="mt-4 text-xs leading-5 text-muted-fg">
						Queue position {{ activeIndex + 1 }} of {{ tickets.length }}. Use this panel for CRM links, ownership, macros, and related incidents.
					</p>
				</DomCard>
			</aside>
		</div>
	</div>
</template>
