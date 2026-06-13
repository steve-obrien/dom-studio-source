<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomCheckbox, DomEmailInput, DomNativeSelect, DomTabs, DomToggle } from '@getdom/studio/vue';

const roleOptions = [
	{ label: 'Owner', value: 'Owner' },
	{ label: 'Can edit', value: 'Can edit' },
	{ label: 'Can comment', value: 'Can comment' },
	{ label: 'Can view', value: 'Can view' },
];

const linkAccessOptions = [
	{ label: 'Restricted', value: 'restricted' },
	{ label: 'Workspace can view', value: 'workspace' },
	{ label: 'Anyone with link', value: 'public' },
];

const expiryOptions = [
	{ label: 'No expiry', value: 'none' },
	{ label: '7 days', value: '7d' },
	{ label: '30 days', value: '30d' },
];

const resources = [
	{
		id: 'report_q3_pipeline',
		name: 'Q3 enterprise pipeline review',
		type: 'Report',
		owner: 'Maya Chen',
		workspace: 'Revenue operations',
		sensitivity: 'Internal',
		linkAccess: 'restricted',
		lastShared: 'Today 10:24',
		views: 184,
	},
	{
		id: 'roadmap_ai_assist',
		name: 'AI assist rollout plan',
		type: 'Roadmap',
		owner: 'Jon Bell',
		workspace: 'Product delivery',
		sensitivity: 'Confidential',
		linkAccess: 'workspace',
		lastShared: 'Yesterday',
		views: 97,
	},
	{
		id: 'brief_client_alpha',
		name: 'Client Alpha success brief',
		type: 'Client brief',
		owner: 'Ari Grant',
		workspace: 'Customer success',
		sensitivity: 'External ready',
		linkAccess: 'restricted',
		lastShared: 'Jun 08, 2026',
		views: 42,
	},
];

const collaboratorSeeds = {
	report_q3_pipeline: [
		{ id: 'maya', name: 'Maya Chen', email: 'maya@getdom.studio', role: 'Owner', source: 'Owner', status: 'Active', avatar: 'MC', external: false },
		{ id: 'jon', name: 'Jon Bell', email: 'jon@getdom.studio', role: 'Can edit', source: 'Direct', status: 'Active', avatar: 'JB', external: false },
		{ id: 'revops', name: 'Revenue team', email: '12 members', role: 'Can view', source: 'Group', status: 'Active', avatar: 'RT', external: false },
		{ id: 'client', name: 'Elena Ramos', email: 'elena@northstar.example', role: 'Can comment', source: 'Direct', status: 'External', avatar: 'ER', external: true },
	],
	roadmap_ai_assist: [
		{ id: 'jon', name: 'Jon Bell', email: 'jon@getdom.studio', role: 'Owner', source: 'Owner', status: 'Active', avatar: 'JB', external: false },
		{ id: 'product', name: 'Product leads', email: '8 members', role: 'Can edit', source: 'Group', status: 'Active', avatar: 'PL', external: false },
		{ id: 'support', name: 'Support managers', email: '5 members', role: 'Can comment', source: 'Group', status: 'Active', avatar: 'SM', external: false },
	],
	brief_client_alpha: [
		{ id: 'ari', name: 'Ari Grant', email: 'ari@getdom.studio', role: 'Owner', source: 'Owner', status: 'Active', avatar: 'AG', external: false },
		{ id: 'clientteam', name: 'Client Alpha team', email: '4 guests', role: 'Can view', source: 'Guest group', status: 'External', avatar: 'CA', external: true },
	],
};

const inviteSeeds = {
	report_q3_pipeline: [
		{ id: 'invite_finance', email: 'finance-leads@getdom.studio', role: 'Can view', expiresAt: 'Jun 17, 2026', status: 'Sent' },
	],
	roadmap_ai_assist: [
		{ id: 'invite_legal', email: 'legal-review@getdom.studio', role: 'Can comment', expiresAt: 'Jun 13, 2026', status: 'Pending approval' },
	],
	brief_client_alpha: [
		{ id: 'invite_sponsor', email: 'sponsor@client-alpha.example', role: 'Can view', expiresAt: 'Jun 20, 2026', status: 'Sent' },
	],
};

const activitySeeds = {
	report_q3_pipeline: [
		{ label: 'Link access changed to restricted', actor: 'Maya Chen', time: 'Today 10:24' },
		{ label: 'Elena Ramos added as commenter', actor: 'Jon Bell', time: 'Yesterday' },
		{ label: 'Revenue team granted view access', actor: 'Maya Chen', time: 'Jun 07, 2026' },
	],
	roadmap_ai_assist: [
		{ label: 'Workspace link enabled', actor: 'Jon Bell', time: 'Yesterday' },
		{ label: 'Support managers added', actor: 'Maya Chen', time: 'Jun 08, 2026' },
	],
	brief_client_alpha: [
		{ label: 'Guest group added', actor: 'Ari Grant', time: 'Jun 08, 2026' },
		{ label: 'Download permission disabled', actor: 'Ari Grant', time: 'Jun 08, 2026' },
	],
};

const tabs = [
	{ key: 'people', label: 'People' },
	{ key: 'pending', label: 'Pending' },
	{ key: 'activity', label: 'Activity' },
];

const selectedResourceId = ref(resources[0].id);
const activeTab = ref('people');
const inviteEmail = ref('');
const inviteRole = ref('Can comment');
const linkAccess = ref(resources[0].linkAccess);
const linkExpiry = ref('30d');
const requireApproval = ref(true);
const allowDownload = ref(false);
const notifyPeople = ref(true);
const collaborators = ref(cloneList(collaboratorSeeds[resources[0].id]));
const pendingInvites = ref(cloneList(inviteSeeds[resources[0].id]));

const selectedResource = computed(() => resources.find((resource) => resource.id === selectedResourceId.value) || resources[0]);
const activeCollaborators = computed(() => collaborators.value.filter((person) => person.status === 'Active').length);
const externalCollaborators = computed(() => collaborators.value.filter((person) => person.external).length);
const editableCollaborators = computed(() => collaborators.value.filter((person) => ['Owner', 'Can edit'].includes(person.role)).length);
const accessScore = computed(() => {
	let score = 72;
	if (linkAccess.value === 'restricted') score += 16;
	if (linkAccess.value === 'public') score -= 24;
	if (requireApproval.value) score += 8;
	if (allowDownload.value) score -= 10;
	if (externalCollaborators.value > 0) score -= 8;
	return Math.max(28, Math.min(100, score));
});
const policyChecks = computed(() => [
	{
		label: 'External collaborator review',
		detail: externalCollaborators.value ? `${externalCollaborators.value} external collaborator requires owner visibility.` : 'No external collaborators on direct access.',
		status: externalCollaborators.value ? 'warning' : 'ready',
	},
	{
		label: 'Link exposure',
		detail: linkAccess.value === 'public' ? 'Anyone with the link can open this resource.' : 'Link access is limited to approved viewers.',
		status: linkAccess.value === 'public' ? 'danger' : 'ready',
	},
	{
		label: 'Download control',
		detail: allowDownload.value ? 'People with access can export this resource.' : 'Exports are disabled for non-owners.',
		status: allowDownload.value ? 'warning' : 'ready',
	},
]);
const accessSummary = computed(() => {
	if (linkAccess.value === 'restricted') return 'Only listed people and groups can open this resource.';
	if (linkAccess.value === 'workspace') return 'Everyone in this workspace can open the shared link.';
	return 'Anyone with the link can open this resource.';
});
const selectedActivity = computed(() => activitySeeds[selectedResource.value.id] || []);

watch(selectedResource, (resource) => {
	linkAccess.value = resource.linkAccess;
	activeTab.value = 'people';
	collaborators.value = cloneList(collaboratorSeeds[resource.id]);
	pendingInvites.value = cloneList(inviteSeeds[resource.id]);
});

function cloneList(list) {
	return list.map((item) => ({ ...item }));
}

function selectResource(resource) {
	selectedResourceId.value = resource.id;
}

function addInvite() {
	const email = inviteEmail.value.trim();
	if (!email) return;

	pendingInvites.value = [
		{
			id: `invite_${Date.now()}`,
			email,
			role: inviteRole.value,
			expiresAt: 'Jun 24, 2026',
			status: requireApproval.value ? 'Pending approval' : 'Sent',
		},
		...pendingInvites.value,
	];
	inviteEmail.value = '';
	activeTab.value = 'pending';
}

function revokeInvite(inviteId) {
	pendingInvites.value = pendingInvites.value.filter((invite) => invite.id !== inviteId);
}

function roleClasses(role) {
	return {
		Owner: 'bg-primary/15 text-primary',
		'Can edit': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		'Can comment': 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
		'Can view': 'bg-secondary text-muted-fg',
	}[role] || 'bg-secondary text-muted-fg';
}

function policyClasses(status) {
	return {
		ready: 'bg-emerald-500',
		warning: 'bg-warning',
		danger: 'bg-destructive',
	}[status] || 'bg-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border skin-card px-4 py-4 sm:px-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Object sharing</p>
				<h3 class="mt-1 text-xl font-semibold tracking-tight">Share permissions</h3>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<DomButton variant="ghost" size="sm">
					<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M8 12h8M12 8v8M5 5h14v14H5V5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					Copy link
				</DomButton>
				<DomButton size="sm">Apply changes</DomButton>
			</div>
		</header>

		<div class="grid min-h-[45rem] lg:grid-cols-[18rem_minmax(0,1fr)_19rem]">
			<aside class="border-b border-border skin-card p-3 lg:border-b-0 lg:border-r">
				<div class="mb-3 grid grid-cols-3 gap-2 text-center">
					<div class="rounded-lg border border-border bg-canvas p-2">
						<p class="text-lg font-semibold">{{ activeCollaborators }}</p>
						<p class="text-[11px] text-muted-fg">Active</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-2">
						<p class="text-lg font-semibold">{{ pendingInvites.length }}</p>
						<p class="text-[11px] text-muted-fg">Invites</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-2">
						<p class="text-lg font-semibold">{{ accessScore }}</p>
						<p class="text-[11px] text-muted-fg">Safety</p>
					</div>
				</div>

				<div class="space-y-2">
					<button
						v-for="resource in resources"
						:key="resource.id"
						type="button"
						class="w-full rounded-lg border p-3 text-left transition hover:border-primary/50"
						:class="resource.id === selectedResource.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-canvas'"
						@click="selectResource(resource)"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ resource.name }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ resource.type }} / {{ resource.workspace }}</p>
							</div>
							<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">
								{{ resource.sensitivity }}
							</span>
						</div>
						<div class="mt-3 flex items-center justify-between text-xs text-muted-fg">
							<span>{{ resource.owner }}</span>
							<span>{{ resource.views }} views</span>
						</div>
					</button>
				</div>
			</aside>

			<main class="min-w-0">
				<section class="border-b border-border p-4 sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="text-lg font-semibold">{{ selectedResource.name }}</h4>
								<span class="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-fg">{{ selectedResource.type }}</span>
								<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{{ selectedResource.sensitivity }}</span>
							</div>
							<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
								Owned by {{ selectedResource.owner }} in {{ selectedResource.workspace }}. Last shared {{ selectedResource.lastShared }}.
							</p>
						</div>
						<div class="grid grid-cols-3 gap-3 text-right text-sm">
							<div>
								<p class="font-semibold">{{ collaborators.length }}</p>
								<p class="text-xs text-muted-fg">Grants</p>
							</div>
							<div>
								<p class="font-semibold">{{ editableCollaborators }}</p>
								<p class="text-xs text-muted-fg">Editors</p>
							</div>
							<div>
								<p class="font-semibold">{{ externalCollaborators }}</p>
								<p class="text-xs text-muted-fg">External</p>
							</div>
						</div>
					</div>
				</section>

				<section class="border-b border-border p-4 sm:p-5">
					<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
						<div>
							<h4 class="font-semibold">Invite people</h4>
							<p class="mt-1 text-sm text-muted-fg">Invite a person or group, then choose the role they receive after policy checks pass.</p>
							<div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
								<DomEmailInput v-model="inviteEmail" placeholder="name@company.com" aria-label="Invite email" />
								<DomNativeSelect v-model="inviteRole" :options="roleOptions.filter((role) => role.value !== 'Owner')" />
								<DomButton @click="addInvite">Invite</DomButton>
							</div>
						</div>
						<div class="rounded-xl bg-secondary/60 p-3">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current access</p>
							<p class="mt-2 text-sm leading-6">{{ accessSummary }}</p>
						</div>
					</div>
				</section>

				<section class="border-b border-border p-4 sm:p-5">
					<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem] md:items-end">
						<label class="block text-sm font-medium">
							Link access
							<DomNativeSelect v-model="linkAccess" :options="linkAccessOptions" class="mt-2 w-full" />
						</label>
						<label class="block text-sm font-medium">
							Link expiry
							<DomNativeSelect v-model="linkExpiry" :options="expiryOptions" class="mt-2 w-full" />
						</label>
					</div>
					<div class="mt-4 grid gap-3 md:grid-cols-3">
						<label class="flex items-start gap-3 rounded-xl bg-secondary/50 p-3 text-sm">
							<DomCheckbox v-model="requireApproval" aria-label="Require approval" />
							<span>
								<span class="block font-medium">Require approval</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">External invites wait for owner approval.</span>
							</span>
						</label>
						<label class="flex items-start gap-3 rounded-xl bg-secondary/50 p-3 text-sm">
							<DomCheckbox v-model="allowDownload" aria-label="Allow downloads" />
							<span>
								<span class="block font-medium">Allow downloads</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">Viewers can export files and reports.</span>
							</span>
						</label>
						<label class="flex items-start justify-between gap-3 rounded-xl bg-secondary/50 p-3 text-sm">
							<span>
								<span class="block font-medium">Notify people</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">Send email when access changes.</span>
							</span>
							<DomToggle v-model="notifyPeople" aria-label="Notify people" />
						</label>
					</div>
				</section>

				<section class="p-4 sm:p-5">
					<div class="border-b border-border">
						<DomTabs v-model="activeTab" :tabs="tabs" />
					</div>

					<div v-if="activeTab === 'people'" class="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
						<div
							v-for="person in collaborators"
							:key="person.id"
							class="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem] sm:items-center"
						>
							<div class="flex min-w-0 items-center gap-3">
								<div class="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{{ person.avatar }}</div>
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<p class="truncate text-sm font-semibold">{{ person.name }}</p>
										<span v-if="person.external" class="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">External</span>
									</div>
									<p class="truncate text-xs text-muted-fg">{{ person.email }} / {{ person.source }}</p>
								</div>
							</div>
							<span class="w-fit rounded-full px-2 py-0.5 text-xs font-semibold" :class="roleClasses(person.role)">
								{{ person.role }}
							</span>
							<DomNativeSelect
								v-model="person.role"
								:options="roleOptions"
								:disabled="person.role === 'Owner'"
								aria-label="Change role"
							/>
						</div>
					</div>

					<div v-else-if="activeTab === 'pending'" class="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
						<div
							v-for="invite in pendingInvites"
							:key="invite.id"
							class="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto] sm:items-center"
						>
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ invite.email }}</p>
								<p class="mt-1 text-xs text-muted-fg">Expires {{ invite.expiresAt }}</p>
							</div>
							<span class="w-fit rounded-full px-2 py-0.5 text-xs font-semibold" :class="roleClasses(invite.role)">
								{{ invite.role }}
							</span>
							<span class="text-sm text-muted-fg">{{ invite.status }}</span>
							<DomButton variant="ghost" size="sm" @click="revokeInvite(invite.id)">Revoke</DomButton>
						</div>
						<div v-if="!pendingInvites.length" class="p-6 text-center text-sm text-muted-fg">
							No pending invites for this resource.
						</div>
					</div>

					<div v-else class="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
						<div
							v-for="event in selectedActivity"
							:key="`${event.label}-${event.time}`"
							class="flex items-start justify-between gap-3 p-3"
						>
							<div>
								<p class="text-sm font-medium">{{ event.label }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
							</div>
							<p class="shrink-0 text-xs text-muted-fg">{{ event.time }}</p>
						</div>
					</div>
				</section>
			</main>

			<aside class="border-t border-border skin-card p-4 lg:border-l lg:border-t-0">
				<div class="space-y-5">
					<section>
						<div class="flex items-center justify-between gap-3">
							<h4 class="font-semibold">Safety review</h4>
							<span class="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-muted-fg">{{ accessScore }}%</span>
						</div>
						<div class="mt-3 h-2 rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${accessScore}%` }" />
						</div>
						<div class="mt-4 space-y-3">
							<div
								v-for="check in policyChecks"
								:key="check.label"
								class="flex gap-3 text-sm"
							>
								<span class="mt-1.5 size-2 shrink-0 rounded-full" :class="policyClasses(check.status)" />
								<span>
									<span class="block font-medium">{{ check.label }}</span>
									<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ check.detail }}</span>
								</span>
							</div>
						</div>
					</section>

					<section class="border-t border-border pt-5">
						<h4 class="font-semibold">Role guide</h4>
						<div class="mt-3 space-y-2 text-sm">
							<div class="flex justify-between gap-3">
								<span class="text-muted-fg">Owner</span>
								<span class="font-medium">Full control</span>
							</div>
							<div class="flex justify-between gap-3">
								<span class="text-muted-fg">Can edit</span>
								<span class="font-medium">Change content</span>
							</div>
							<div class="flex justify-between gap-3">
								<span class="text-muted-fg">Can comment</span>
								<span class="font-medium">Discuss only</span>
							</div>
							<div class="flex justify-between gap-3">
								<span class="text-muted-fg">Can view</span>
								<span class="font-medium">Read only</span>
							</div>
						</div>
					</section>

					<section class="border-t border-border pt-5">
						<h4 class="font-semibold">Recommended next step</h4>
						<p class="mt-2 text-sm leading-6 text-muted-fg">
							Save changes after reviewing external access and download controls. Broad links should create an audit event and notify the owner.
						</p>
						<DomButton class="mt-4 w-full">Save permission changes</DomButton>
					</section>
				</div>
			</aside>
		</div>
	</div>
</template>
