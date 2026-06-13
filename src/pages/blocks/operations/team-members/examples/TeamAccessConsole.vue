<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCard, DomEmailInput, DomNativeSelect, DomTabs, DomTextInput, DomToggle } from '@getdom/studio/vue';

const tabs = [
	{ key: 'members', label: 'Members' },
	{ key: 'invites', label: 'Invites' },
	{ key: 'security', label: 'Security' },
];

const roleOptions = [
	{ label: 'Owner', value: 'Owner' },
	{ label: 'Admin', value: 'Admin' },
	{ label: 'Editor', value: 'Editor' },
	{ label: 'Viewer', value: 'Viewer' },
	{ label: 'Billing only', value: 'Billing only' },
];

const accessPolicies = ref([
	{ label: 'Require SSO', detail: 'Members must authenticate through the company identity provider.', enabled: true },
	{ label: 'Block personal email invites', detail: 'Only approved workspace domains can receive invites.', enabled: true },
	{ label: 'Review inactive admins', detail: 'Create a task when admins have not signed in for 30 days.', enabled: false },
]);

const inviteForm = ref({
	email: 'lena@northstar.example',
	role: 'Editor',
	message: 'Welcome to the growth workspace. Start with the launch dashboard and campaign backlog.',
});
const activeTab = ref('members');
const search = ref('');
const showOnlyRisk = ref(false);

const members = ref([
	{
		id: 1,
		name: 'Amelia Hart',
		email: 'amelia@northstar.example',
		initials: 'AH',
		role: 'Owner',
		team: 'Leadership',
		status: 'Active',
		lastSeen: '6 min ago',
		mfa: true,
		seat: 'Paid',
	},
	{
		id: 2,
		name: 'Marcus Chen',
		email: 'marcus@northstar.example',
		initials: 'MC',
		role: 'Admin',
		team: 'Operations',
		status: 'Active',
		lastSeen: 'Today',
		mfa: true,
		seat: 'Paid',
	},
	{
		id: 3,
		name: 'Priya Raman',
		email: 'priya@northstar.example',
		initials: 'PR',
		role: 'Editor',
		team: 'Growth',
		status: 'Active',
		lastSeen: 'Yesterday',
		mfa: true,
		seat: 'Paid',
	},
	{
		id: 4,
		name: 'Jon Bell',
		email: 'jon@agency.example',
		initials: 'JB',
		role: 'Viewer',
		team: 'Agency',
		status: 'Guest',
		lastSeen: '5 days ago',
		mfa: false,
		seat: 'Guest',
	},
	{
		id: 5,
		name: 'Nadia Stone',
		email: 'nadia@northstar.example',
		initials: 'NS',
		role: 'Billing only',
		team: 'Finance',
		status: 'Inactive',
		lastSeen: '41 days ago',
		mfa: true,
		seat: 'Free',
	},
]);

const invites = ref([
	{
		id: 1,
		email: 'lena@northstar.example',
		role: 'Editor',
		sent: '2 hours ago',
		expires: '7 days',
		status: 'Pending',
	},
	{
		id: 2,
		email: 'finance@northstar.example',
		role: 'Billing only',
		sent: 'Yesterday',
		expires: '6 days',
		status: 'Pending',
	},
	{
		id: 3,
		email: 'contractor@agency.example',
		role: 'Viewer',
		sent: 'May 29',
		expires: 'Expired',
		status: 'Expired',
	},
]);

const auditEvents = [
	{ actor: 'Amelia Hart', action: 'changed Marcus Chen to Admin', time: '18 min ago' },
	{ actor: 'Marcus Chen', action: 'resent invite to finance@northstar.example', time: '1 hour ago' },
	{ actor: 'System', action: 'flagged Jon Bell because MFA is not enabled', time: 'Today' },
	{ actor: 'Priya Raman', action: 'invited lena@northstar.example as Editor', time: 'Today' },
];

const usedSeats = computed(() => members.value.filter((member) => member.seat === 'Paid').length + invites.value.filter((invite) => invite.status === 'Pending').length);
const seatLimit = 12;
const seatPercent = computed(() => Math.round((usedSeats.value / seatLimit) * 100));
const activeCount = computed(() => members.value.filter((member) => member.status === 'Active').length);
const riskCount = computed(() => members.value.filter(isRiskyMember).length);
const pendingInviteCount = computed(() => invites.value.filter((invite) => invite.status === 'Pending').length);
const filteredMembers = computed(() => {
	const term = search.value.trim().toLowerCase();
	return members.value.filter((member) => {
		const matchesTerm = !term || [member.name, member.email, member.role, member.team].some((value) => value.toLowerCase().includes(term));
		const matchesRisk = !showOnlyRisk.value || isRiskyMember(member);
		return matchesTerm && matchesRisk;
	});
});

function isRiskyMember(member) {
	return !member.mfa || member.status === 'Inactive';
}

function statusClasses(status) {
	return {
		Active: 'bg-success/15 text-success',
		Guest: 'bg-primary/15 text-primary',
		Inactive: 'bg-warning/15 text-warning',
		Pending: 'bg-primary/15 text-primary',
		Expired: 'bg-destructive/15 text-destructive',
	}[status] || 'bg-secondary text-muted-fg';
}

function inviteMember() {
	if (!inviteForm.value.email) return;
	invites.value.unshift({
		id: Date.now(),
		email: inviteForm.value.email,
		role: inviteForm.value.role,
		sent: 'Just now',
		expires: '7 days',
		status: 'Pending',
	});
	inviteForm.value.email = '';
	activeTab.value = 'invites';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Workspace access</p>
					<h3 class="mt-1 text-xl font-semibold tracking-tight">Team members</h3>
					<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
						Invite teammates, tune roles, and keep risky account states visible before they become admin work.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<DomButton variant="secondary" size="sm">Export audit</DomButton>
					<DomButton size="sm" @click="inviteMember">Send invite</DomButton>
				</div>
			</div>

			<div class="mt-5 grid gap-3 md:grid-cols-4">
				<div class="rounded-xl border border-border bg-canvas p-3">
					<p class="text-xs font-medium text-muted-fg">Paid seats</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ usedSeats }}/{{ seatLimit }}</p>
					<div class="mt-3 h-2 rounded-full bg-secondary">
						<div class="h-full rounded-full bg-primary" :style="{ width: `${seatPercent}%` }"></div>
					</div>
				</div>
				<div class="rounded-xl border border-border bg-canvas p-3">
					<p class="text-xs font-medium text-muted-fg">Active members</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ activeCount }}</p>
					<p class="mt-2 text-xs text-muted-fg">Across 4 teams</p>
				</div>
				<div class="rounded-xl border border-border bg-canvas p-3">
					<p class="text-xs font-medium text-muted-fg">Pending invites</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ pendingInviteCount }}</p>
					<p class="mt-2 text-xs text-muted-fg">Expires after 7 days</p>
				</div>
				<div class="rounded-xl border border-border bg-canvas p-3">
					<p class="text-xs font-medium text-muted-fg">Access review</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ riskCount }}</p>
					<p class="mt-2 text-xs text-muted-fg">Members need attention</p>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
			<main class="min-w-0 border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
				<DomTabs v-model="activeTab" :tabs="tabs">
					<template #members>
						<div class="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem]">
							<DomTextInput v-model="search" label="Search members" placeholder="Name, email, role, or team" />
							<div class="rounded-xl border border-border bg-canvas px-3 py-2">
								<DomToggle v-model="showOnlyRisk" label="Needs review" />
							</div>
						</div>

						<div class="overflow-hidden rounded-xl border border-border">
							<div class="hidden grid-cols-[minmax(15rem,1.4fr)_9rem_8rem_9rem_6rem] gap-3 border-b border-border skin-card px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg lg:grid">
								<span>Member</span>
								<span>Role</span>
								<span>Status</span>
								<span>Last seen</span>
								<span>MFA</span>
							</div>
							<div
								v-for="member in filteredMembers"
								:key="member.id"
								class="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(15rem,1.4fr)_9rem_8rem_9rem_6rem] lg:items-center"
							>
								<div class="flex min-w-0 items-center gap-3">
									<div class="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
										{{ member.initials }}
									</div>
									<div class="min-w-0">
										<p class="truncate font-semibold">{{ member.name }}</p>
										<p class="truncate text-sm text-muted-fg">{{ member.email }}</p>
										<p class="mt-1 text-xs text-muted-fg lg:hidden">{{ member.team }} / {{ member.lastSeen }}</p>
									</div>
								</div>
								<DomNativeSelect
									v-model="member.role"
									:options="roleOptions"
									:aria-label="`Role for ${member.name}`"
								/>
								<div>
									<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClasses(member.status)">
										{{ member.status }}
									</span>
								</div>
								<p class="hidden text-sm text-muted-fg lg:block">{{ member.lastSeen }}</p>
								<div class="flex items-center gap-2 text-sm">
									<span class="size-2 rounded-full" :class="member.mfa ? 'bg-success' : 'bg-warning'"></span>
									<span>{{ member.mfa ? 'On' : 'Off' }}</span>
								</div>
							</div>
						</div>
					</template>

					<template #invites>
						<div class="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
							<DomCard padding="sm">
								<h4 class="text-sm font-semibold">Invite teammate</h4>
								<div class="mt-4 space-y-3">
									<DomEmailInput v-model="inviteForm.email" label="Email" placeholder="name@company.com" />
									<DomNativeSelect v-model="inviteForm.role" label="Role" :options="roleOptions" />
									<label class="block text-sm">
										<span class="font-medium">Message</span>
										<textarea v-model="inviteForm.message" class="skin-input mt-2 min-h-24 w-full resize-none" />
									</label>
									<DomButton class="w-full" @click="inviteMember">Send invite</DomButton>
								</div>
							</DomCard>

							<div class="space-y-3">
								<div
									v-for="invite in invites"
									:key="invite.id"
									class="rounded-xl border border-border bg-canvas p-4"
								>
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate font-semibold">{{ invite.email }}</p>
											<p class="mt-1 text-sm text-muted-fg">{{ invite.role }} / sent {{ invite.sent }} / expires {{ invite.expires }}</p>
										</div>
										<span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClasses(invite.status)">
											{{ invite.status }}
										</span>
									</div>
									<div class="mt-4 flex flex-wrap gap-2">
										<DomButton variant="secondary" size="sm">Resend</DomButton>
										<DomButton variant="ghost" size="sm">Copy link</DomButton>
										<DomButton variant="ghost" size="sm">Cancel</DomButton>
									</div>
								</div>
							</div>
						</div>
					</template>

					<template #security>
						<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
							<div class="space-y-3">
								<div
									v-for="policy in accessPolicies"
									:key="policy.label"
									class="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-canvas p-4"
								>
									<div class="max-w-xl">
										<p class="font-semibold">{{ policy.label }}</p>
										<p class="mt-1 text-sm leading-6 text-muted-fg">{{ policy.detail }}</p>
									</div>
									<DomToggle v-model="policy.enabled" :label="policy.enabled ? 'On' : 'Off'" />
								</div>
							</div>

							<DomCard padding="sm">
								<h4 class="text-sm font-semibold">Recent access events</h4>
								<div class="mt-4 space-y-4">
									<div
										v-for="event in auditEvents"
										:key="`${event.actor}-${event.action}`"
										class="border-b border-border pb-3 last:border-b-0 last:pb-0"
									>
										<p class="text-sm font-semibold">{{ event.actor }}</p>
										<p class="mt-1 text-sm leading-5 text-muted-fg">{{ event.action }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ event.time }}</p>
									</div>
								</div>
							</DomCard>
						</div>
					</template>
				</DomTabs>
			</main>

			<aside class="space-y-4 skin-card p-4 sm:p-6">
				<DomCard padding="sm">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h4 class="text-sm font-semibold">Role summary</h4>
							<p class="mt-1 text-xs text-muted-fg">Use server-side policy checks for every action.</p>
						</div>
						<span class="rounded-full bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">SSO</span>
					</div>
					<div class="mt-4 space-y-3 text-sm">
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Owners</span>
							<span class="font-semibold">1</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Admins</span>
							<span class="font-semibold">1</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Editors</span>
							<span class="font-semibold">2 pending</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Guests</span>
							<span class="font-semibold">1</span>
						</div>
					</div>
				</DomCard>

				<DomCard padding="sm">
					<h4 class="text-sm font-semibold">Review queue</h4>
					<div class="mt-3 space-y-3">
						<div class="rounded-xl border border-border bg-canvas p-3">
							<p class="text-sm font-semibold">MFA missing</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">Jon Bell can view reports without a second factor.</p>
						</div>
						<div class="rounded-xl border border-border bg-canvas p-3">
							<p class="text-sm font-semibold">Inactive billing user</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">Nadia Stone has not signed in for 41 days.</p>
						</div>
					</div>
				</DomCard>

				<DomCard padding="sm">
					<h4 class="text-sm font-semibold">Domain policy</h4>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Invites are restricted to northstar.example unless an owner approves a guest domain.
					</p>
					<DomButton class="mt-4 w-full" variant="secondary">Manage domains</DomButton>
				</DomCard>
			</aside>
		</div>
	</div>
</template>
