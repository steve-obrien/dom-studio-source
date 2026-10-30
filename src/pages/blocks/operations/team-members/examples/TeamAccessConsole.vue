<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppTopBar,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomDrawer,
	DomEmailInput,
	DomEmptyState,
	DomIconButton,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const workspaceRevision = ref(0);
const workspace = ref(null);
const catalogs = ref({ views: [], roles: [], teams: [], inviteExpiry: [] });
const summary = ref({ active: 0, paidSeats: 0, seatLimit: 0, pendingInvites: 0, needsReview: 0, suspended: 0 });
const members = ref([]);
const invites = ref([]);
const policies = ref([]);
const events = ref([]);
const activeMember = ref(null);
const selectedMemberId = ref('');
const selectedView = ref('review');
const searchQuery = ref('');
const mobileView = ref('people');
const compactViewport = ref(false);
const loadingWorkspace = ref(true);
const loadingMember = ref(false);
const busyAction = ref('');
const actionError = ref('');
const fieldErrors = ref({});
const detailsDrawerOpen = ref(false);
const inviteDialogOpen = ref(false);
const roleDialogOpen = ref(false);
const suspendDialogOpen = ref(false);
const policyDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const exportReceipt = ref(null);
const rolePreview = ref(null);
const selectedRole = ref('member');
const roleAcknowledged = ref(false);
const suspensionReason = ref('Access is no longer required for the current engagement.');
const suspensionAcknowledged = ref(false);
const pendingPolicy = ref(null);
const policyAcknowledged = ref(false);
const inviteDraft = ref(createInviteDraft());

let viewportQuery = null;

const selectableRoles = computed(() => catalogs.value.roles.filter((role) => role.selectable));
const filteredMembers = computed(() => members.value.filter(matchesSelectedView).filter(matchesSearch));
const seatPercent = computed(() => summary.value.seatLimit ? Math.round((summary.value.paidSeats / summary.value.seatLimit) * 100) : 0);
const selectedRoleDefinition = computed(() => roleDefinition(activeMember.value?.role));
const selectedTeamLabels = computed(() => activeMember.value?.teams?.map(teamLabel).join(', ') || 'No team assigned');
const externalInvite = computed(() => {
	const domain = inviteDraft.value.email.split('@')[1]?.toLowerCase();
	return Boolean(domain && workspace.value?.approvedDomain && domain !== workspace.value.approvedDomain);
});
const viewOptions = computed(() => catalogs.value.views.map((view) => ({
	...view,
	label: `${view.label} · ${viewCount(view.value)}`,
})));
const mobileNavigation = computed(() => [
	{ value: 'people', label: 'People', badge: String(filteredMembers.value.length || '') },
	{ value: 'access', label: 'Access', badge: activeMember.value?.risks?.length ? String(activeMember.value.risks.length) : '' },
	{ value: 'invites', label: 'Invites', badge: String(invites.value.filter((invite) => invite.status !== 'cancelled').length || '') },
]);

onMounted(initializeWorkspace);
onBeforeUnmount(disposeWorkspace);

/**
 * Initializes responsive state and loads the team-access API workspace.
 *
 * @returns {Promise<void>} Resolves when the first member is hydrated.
 */
async function initializeWorkspace() {
	viewportQuery = window.matchMedia('(max-width: 767px)');
	syncViewport(viewportQuery);
	viewportQuery.addEventListener('change', syncViewport);
	await loadWorkspace();
}

/**
 * Removes the responsive media-query listener.
 *
 * @returns {void}
 */
function disposeWorkspace() {
	viewportQuery?.removeEventListener('change', syncViewport);
}

/**
 * Synchronizes mobile destinations with the current viewport.
 *
 * @param {MediaQueryList|MediaQueryListEvent} query Media query state.
 * @returns {void}
 */
function syncViewport(query) {
	compactViewport.value = Boolean(query.matches);
	if (!compactViewport.value) mobileView.value = 'access';
}

/**
 * Loads the directory workspace and hydrates a preferred member.
 *
 * @param {string} preferredMemberId Optional member selection to preserve.
 * @returns {Promise<void>} Resolves when workspace state is ready.
 */
async function loadWorkspace(preferredMemberId = '') {
	loadingWorkspace.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/team-access/workspace');
		applyWorkspace(payload);
		const firstReviewMemberId = payload.members?.find((member) => member.risks?.length)?.id;
		const memberId = preferredMemberId || selectedMemberId.value || firstReviewMemberId || payload.selectedMemberId || payload.members?.[0]?.id;
		if (memberId) await loadMember(memberId, false);
	} catch (error) {
		actionError.value = error.message;
	} finally {
		loadingWorkspace.value = false;
	}
}

/**
 * Loads one member with sessions, capabilities, and risk evidence.
 *
 * @param {string} memberId Member identifier.
 * @param {boolean} focusAccess Whether to focus the mobile access destination.
 * @returns {Promise<void>} Resolves after member state is applied.
 */
async function loadMember(memberId, focusAccess = true) {
	if (!memberId) return;
	loadingMember.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/team-access/members/${encodeURIComponent(memberId)}`);
		workspaceRevision.value = payload.workspaceRevision;
		activeMember.value = payload.member;
		selectedMemberId.value = payload.member.id;
		if (focusAccess && compactViewport.value) mobileView.value = 'access';
	} catch (error) {
		actionError.value = error.message;
	} finally {
		loadingMember.value = false;
	}
}

/**
 * Selects a directory member and opens their access record on mobile.
 *
 * @param {string} memberId Member identifier.
 * @returns {Promise<void>} Resolves after the selection is ready.
 */
async function selectMember(memberId) {
	if (memberId === selectedMemberId.value && activeMember.value) {
		if (compactViewport.value) mobileView.value = 'access';
		return;
	}
	await loadMember(memberId);
}

/**
 * Creates a workspace invitation using server-owned domain and seat rules.
 *
 * @returns {Promise<void>} Resolves after invitation persistence.
 */
async function sendInvite() {
	if (busyAction.value) return;
	busyAction.value = 'invite';
	actionError.value = '';
	fieldErrors.value = {};
	try {
		const payload = await requestJson('/api/block-demos/team-access/invites', {
			method: 'POST',
			body: JSON.stringify({
				workspaceRevision: workspaceRevision.value,
				...inviteDraft.value,
			}),
		});
		applyWorkspace(payload);
		inviteDraft.value = createInviteDraft();
		inviteDialogOpen.value = false;
		mobileView.value = 'invites';
	} catch (error) {
		handleMutationError(error);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Retries an existing invitation without creating a duplicate.
 *
 * @param {Record<string, unknown>} invite Invitation summary.
 * @returns {Promise<void>} Resolves after provider acceptance.
 */
async function resendInvite(invite) {
	if (busyAction.value) return;
	busyAction.value = `resend-${invite.id}`;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/team-access/invites/${encodeURIComponent(invite.id)}/resend`, {
			method: 'POST',
			body: JSON.stringify({ workspaceRevision: workspaceRevision.value, inviteVersion: invite.version }),
		});
		applyWorkspace(payload);
	} catch (error) {
		await handleMutationError(error, selectedMemberId.value);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Cancels an invitation while preserving the server audit event.
 *
 * @param {Record<string, unknown>} invite Invitation summary.
 * @returns {Promise<void>} Resolves after removal from the active queue.
 */
async function cancelInvite(invite) {
	if (busyAction.value) return;
	busyAction.value = `cancel-${invite.id}`;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/team-access/invites/${encodeURIComponent(invite.id)}`, {
			method: 'DELETE',
			body: JSON.stringify({ workspaceRevision: workspaceRevision.value, inviteVersion: invite.version }),
		});
		applyWorkspace(payload);
	} catch (error) {
		await handleMutationError(error, selectedMemberId.value);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Opens the role-change review with a sensible alternative role.
 *
 * @returns {void}
 */
function openRoleDialog() {
	selectedRole.value = selectableRoles.value.find((role) => role.value !== activeMember.value?.role)?.value || 'member';
	rolePreview.value = null;
	roleAcknowledged.value = false;
	fieldErrors.value = {};
	roleDialogOpen.value = true;
}

/**
 * Requests a versioned preview for a proposed member role.
 *
 * @returns {Promise<void>} Resolves after access impact is calculated.
 */
async function previewRoleChange() {
	if (!activeMember.value || busyAction.value) return;
	busyAction.value = 'preview-role';
	actionError.value = '';
	fieldErrors.value = {};
	try {
		const payload = await requestJson(`/api/block-demos/team-access/members/${encodeURIComponent(activeMember.value.id)}/role/preview`, {
			method: 'POST',
			body: JSON.stringify(memberMutationPayload({ role: selectedRole.value })),
		});
		rolePreview.value = payload.preview;
	} catch (error) {
		handleMutationError(error);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Commits the exact role preview after explicit acknowledgement.
 *
 * @returns {Promise<void>} Resolves after the role is persisted.
 */
async function commitRoleChange() {
	if (!activeMember.value || !rolePreview.value || busyAction.value) return;
	busyAction.value = 'commit-role';
	actionError.value = '';
	fieldErrors.value = {};
	try {
		const payload = await requestJson(`/api/block-demos/team-access/members/${encodeURIComponent(activeMember.value.id)}/role/commit`, {
			method: 'POST',
			body: JSON.stringify(memberMutationPayload({ previewId: rolePreview.value.id, acknowledged: roleAcknowledged.value })),
		});
		applyMemberMutation(payload);
		roleDialogOpen.value = false;
	} catch (error) {
		await handleMutationError(error, activeMember.value.id);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Opens the guarded suspension dialog with a reusable reason.
 *
 * @returns {void}
 */
function openSuspendDialog() {
	suspensionReason.value = 'Access is no longer required for the current engagement.';
	suspensionAcknowledged.value = false;
	fieldErrors.value = {};
	suspendDialogOpen.value = true;
}

/**
 * Suspends the selected member and records revoked access evidence.
 *
 * @returns {Promise<void>} Resolves after access revocation.
 */
async function suspendMember() {
	if (!activeMember.value || busyAction.value) return;
	busyAction.value = 'suspend';
	actionError.value = '';
	fieldErrors.value = {};
	try {
		const payload = await requestJson(`/api/block-demos/team-access/members/${encodeURIComponent(activeMember.value.id)}/suspend`, {
			method: 'POST',
			body: JSON.stringify(memberMutationPayload({ reason: suspensionReason.value, acknowledged: suspensionAcknowledged.value })),
		});
		applyMemberMutation(payload);
		suspendDialogOpen.value = false;
	} catch (error) {
		await handleMutationError(error, activeMember.value.id);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reactivates a suspended member through current seat and SSO policy.
 *
 * @returns {Promise<void>} Resolves after reactivation.
 */
async function reactivateMember() {
	if (!activeMember.value || busyAction.value) return;
	busyAction.value = 'reactivate';
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/team-access/members/${encodeURIComponent(activeMember.value.id)}/reactivate`, {
			method: 'POST',
			body: JSON.stringify(memberMutationPayload()),
		});
		applyMemberMutation(payload);
	} catch (error) {
		await handleMutationError(error, activeMember.value.id);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Applies a routine policy immediately or opens confirmation for SSO removal.
 *
 * @param {Record<string, unknown>} policy Access policy.
 * @param {boolean} enabled Requested state.
 * @returns {Promise<void>|void} Policy result or dialog setup.
 */
function requestPolicyChange(policy, enabled) {
	if (policy.id === 'require-sso' && !enabled) {
		pendingPolicy.value = { policy, enabled };
		policyAcknowledged.value = false;
		fieldErrors.value = {};
		policyDialogOpen.value = true;
		return;
	}
	return savePolicy(policy, enabled, false);
}

/**
 * Persists a versioned workspace policy change.
 *
 * @param {Record<string, unknown>} policy Access policy.
 * @param {boolean} enabled Requested state.
 * @param {boolean} acknowledged Whether a risky downgrade was acknowledged.
 * @returns {Promise<void>} Resolves after policy persistence.
 */
async function savePolicy(policy, enabled, acknowledged) {
	if (!policy || busyAction.value) return;
	busyAction.value = `policy-${policy.id}`;
	actionError.value = '';
	fieldErrors.value = {};
	try {
		const payload = await requestJson(`/api/block-demos/team-access/policies/${encodeURIComponent(policy.id)}`, {
			method: 'PATCH',
			body: JSON.stringify({
				workspaceRevision: workspaceRevision.value,
				policyVersion: policy.version,
				enabled,
				acknowledged,
			}),
		});
		applyWorkspace(payload);
		policyDialogOpen.value = false;
		pendingPolicy.value = null;
	} catch (error) {
		await handleMutationError(error, selectedMemberId.value);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Confirms the pending high-impact access-policy change.
 *
 * @returns {Promise<void>} Resolves after policy persistence.
 */
async function confirmPolicyChange() {
	if (!pendingPolicy.value) return;
	await savePolicy(pendingPolicy.value.policy, pendingPolicy.value.enabled, policyAcknowledged.value);
}

/**
 * Downloads the API-generated directory CSV and surfaces its receipt.
 *
 * @returns {Promise<void>} Resolves after the browser download is initiated.
 */
async function exportMembers() {
	if (busyAction.value) return;
	busyAction.value = 'export';
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/team-access/export');
		const blob = new Blob([payload.content], { type: payload.mediaType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = payload.filename;
		link.click();
		URL.revokeObjectURL(url);
		exportReceipt.value = payload;
	} catch (error) {
		actionError.value = error.message;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Restores the deterministic directory and selects its default member.
 *
 * @returns {Promise<void>} Resolves after reset state is hydrated.
 */
async function resetDemo() {
	if (busyAction.value) return;
	busyAction.value = 'reset';
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/team-access/reset', { method: 'POST' });
		applyWorkspace(payload);
		selectedView.value = 'review';
		searchQuery.value = '';
		exportReceipt.value = null;
		await loadMember(payload.members?.find((member) => member.risks?.length)?.id || payload.selectedMemberId || payload.members?.[0]?.id, false);
		resetDialogOpen.value = false;
	} catch (error) {
		actionError.value = error.message;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Applies a complete team-access workspace payload.
 *
 * @param {Record<string, unknown>} payload API workspace payload.
 * @returns {void}
 */
function applyWorkspace(payload) {
	workspaceRevision.value = payload.workspaceRevision;
	workspace.value = payload.workspace || workspace.value;
	catalogs.value = payload.catalogs || catalogs.value;
	summary.value = payload.summary || summary.value;
	members.value = payload.members || members.value;
	invites.value = payload.invites || invites.value;
	policies.value = payload.policies || policies.value;
	events.value = payload.events || events.value;
	fieldErrors.value = {};
}

/**
 * Applies a member mutation to workspace summaries and member evidence.
 *
 * @param {Record<string, unknown>} payload API member-mutation payload.
 * @returns {void}
 */
function applyMemberMutation(payload) {
	applyWorkspace(payload);
	activeMember.value = payload.member;
	selectedMemberId.value = payload.member.id;
}

/**
 * Handles field validation and exact-revision conflict recovery.
 *
 * @param {Error & { status?: number, fieldErrors?: object }} error Request error.
 * @param {string} memberId Optional member selection to preserve.
 * @returns {Promise<void>} Resolves after optional conflict recovery.
 */
async function handleMutationError(error, memberId = '') {
	fieldErrors.value = error.fieldErrors || {};
	actionError.value = error.message;
	if (error.status === 409) await loadWorkspace(memberId);
}

/**
 * Creates revision fields required by member mutations.
 *
 * @param {Record<string, unknown>} values Additional mutation values.
 * @returns {Record<string, unknown>} Versioned mutation payload.
 */
function memberMutationPayload(values = {}) {
	return {
		workspaceRevision: workspaceRevision.value,
		memberVersion: activeMember.value?.version,
		...values,
	};
}

/**
 * Checks one member against the selected saved view.
 *
 * @param {Record<string, unknown>} member Member summary.
 * @returns {boolean} True when the member belongs in the view.
 */
function matchesSelectedView(member) {
	if (selectedView.value === 'admins') return ['owner', 'admin'].includes(member.role);
	if (selectedView.value === 'guests') return member.role === 'guest';
	if (selectedView.value === 'review') return member.risks.length > 0;
	if (selectedView.value === 'suspended') return member.status === 'suspended';
	return true;
}

/**
 * Checks one member against the current directory search.
 *
 * @param {Record<string, unknown>} member Member summary.
 * @returns {boolean} True when a searchable field contains the query.
 */
function matchesSearch(member) {
	const needle = searchQuery.value.trim().toLowerCase();
	if (!needle) return true;
	return [member.name, member.email, member.title, roleLabel(member.role), ...member.teams.map(teamLabel)]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(needle));
}

/**
 * Returns the live member count for a saved directory view.
 *
 * @param {string} view View identifier.
 * @returns {number} Matching member count.
 */
function viewCount(view) {
	if (view === 'admins') return members.value.filter((member) => ['owner', 'admin'].includes(member.role)).length;
	if (view === 'guests') return members.value.filter((member) => member.role === 'guest').length;
	if (view === 'review') return summary.value.needsReview;
	if (view === 'suspended') return summary.value.suspended;
	return members.value.length;
}

/**
 * Resolves a role catalog definition.
 *
 * @param {string} role Role identifier.
 * @returns {Record<string, unknown>} Role catalog entry.
 */
function roleDefinition(role) {
	return catalogs.value.roles.find((option) => option.value === role) || { label: role || 'Unknown', tone: 'neutral', description: '' };
}

/**
 * Resolves a role identifier to its human-readable label.
 *
 * @param {string} role Role identifier.
 * @returns {string} Role label.
 */
function roleLabel(role) {
	return roleDefinition(role).label;
}

/**
 * Resolves a team identifier to its human-readable label.
 *
 * @param {string} teamId Team identifier.
 * @returns {string} Team label.
 */
function teamLabel(teamId) {
	return catalogs.value.teams.find((team) => team.value === teamId)?.label || teamId;
}

/**
 * Resolves a member status to a DOM Studio tone.
 *
 * @param {string} status Member status.
 * @returns {string} Status tone.
 */
function memberTone(status) {
	return status === 'active' ? 'success' : 'neutral';
}

/**
 * Resolves invitation state to a DOM Studio tone.
 *
 * @param {string} status Invitation status.
 * @returns {string} Status tone.
 */
function inviteTone(status) {
	return { pending: 'info', failed: 'danger', expired: 'warning' }[status] || 'neutral';
}

/**
 * Creates default values for a new workspace invitation.
 *
 * @returns {Record<string, unknown>} Invitation draft.
 */
function createInviteDraft() {
	return {
		email: '',
		role: 'member',
		teamId: 'product',
		expiryDays: '7',
		externalAcknowledged: false,
	};
}

/**
 * Clears stale server field errors after an administrator edits a dialog value.
 *
 * @returns {void}
 */
function clearFieldErrors() {
	fieldErrors.value = {};
}

/**
 * Requests JSON and converts non-success responses into actionable errors.
 *
 * @param {string} path API path.
 * @param {RequestInit} init Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(path, init = {}) {
	const response = await fetch(path, {
		headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
		...init,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(payload.error || `Team access request failed with ${response.status}.`);
		error.status = response.status;
		error.fieldErrors = payload.fieldErrors || {};
		throw error;
	}
	return payload;
}
</script>

<template>
	<section class="relative flex h-dvh min-h-[40rem] w-full min-w-0 flex-col overflow-hidden bg-canvas text-canvas-fg">
		<DomAppTopBar
			class="md:hidden"
			:title="mobileView === 'people' ? 'People' : mobileView === 'invites' ? 'Invitations' : activeMember?.name || 'Access'"
			:subtitle="mobileView === 'people' ? `${summary.active} active · ${summary.needsReview} need review` : mobileView === 'invites' ? `${summary.pendingInvites} pending · ${summary.paidSeats}/${summary.seatLimit} seats` : activeMember ? `${roleLabel(activeMember.role)} · ${activeMember.email}` : 'Loading member'"
		>
			<template #trailing>
				<DomIconButton v-if="mobileView === 'people'" label="Invite a teammate" size="sm" variant="ghost" icon="M12 5v14M5 12h14" @click="inviteDialogOpen = true" />
				<DomIconButton v-else-if="mobileView === 'access' && activeMember" label="Open access activity" size="sm" variant="ghost" icon="M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" @click="detailsDrawerOpen = true" />
			</template>
		</DomAppTopBar>

		<header class="hidden h-16 shrink-0 items-center justify-between border-b border-border px-4 md:flex">
			<div class="flex min-w-0 items-center gap-3">
				<DomAvatar :name="workspace?.name || 'Northstar Labs'" initials="N" size="sm" />
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold">{{ workspace?.name || 'Team access' }}</p>
					<p class="truncate text-[11px] text-muted-fg">People directory · live demo API</p>
				</div>
			</div>
			<div class="flex items-center gap-5 text-xs">
				<div class="w-28"><div class="mb-1 flex justify-between text-[10px] text-muted-fg"><span>Paid seats</span><strong class="text-canvas-fg">{{ summary.paidSeats }}/{{ summary.seatLimit }}</strong></div><DomProgress :value="seatPercent" label="Paid seat commitment" :show-label="false" size="sm" /></div>
				<span class="text-muted-fg"><strong class="text-canvas-fg">{{ summary.active }}</strong> active</span>
				<span class="text-muted-fg"><strong :class="summary.needsReview ? 'text-warning' : 'text-canvas-fg'">{{ summary.needsReview }}</strong> review</span>
				<DomButton variant="secondary" size="sm" @click="inviteDialogOpen = true">Invite person</DomButton>
				<DomAvatar name="Amelia Hart" initials="AH" size="sm" />
			</div>
		</header>

		<div v-if="loadingWorkspace && !members.length" class="grid min-h-0 flex-1 md:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_21rem]">
			<div class="space-y-4 border-r border-border p-4"><DomSkeleton variant="text" :lines="2" /><DomSkeleton v-for="index in 5" :key="index" height="4.75rem" /></div>
			<div class="space-y-5 p-5"><DomSkeleton variant="text" :lines="3" /><DomSkeleton height="9rem" /><DomSkeleton height="12rem" /></div>
			<div class="hidden border-l border-border p-4 xl:block"><DomSkeleton variant="text" :lines="8" /></div>
		</div>

		<DomEmptyState v-else-if="!members.length" class="m-auto max-w-lg" title="People directory unavailable" description="The repository-local API did not return any workspace members.">
			<DomButton @click="loadWorkspace">Retry directory</DomButton>
		</DomEmptyState>

		<div v-else class="grid min-h-0 flex-1 md:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_21rem]">
			<aside v-show="!compactViewport || mobileView === 'people'" class="flex min-h-0 flex-col border-border bg-canvas md:border-r">
				<div class="shrink-0 space-y-3 border-b border-border p-3">
					<DomSelect v-model="selectedView" label="Directory view" :options="viewOptions" width="min-w-[18rem]">
						<template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
					</DomSelect>
					<DomTextInput v-model="searchQuery" type="search" label="Find a person" placeholder="Name, role, team, or email" />
					<div class="grid grid-cols-3 gap-px overflow-hidden border-y border-border bg-border text-center">
						<div class="bg-canvas px-2 py-2"><p class="text-sm font-semibold">{{ summary.active }}</p><p class="text-[10px] text-muted-fg">Active</p></div>
						<div class="bg-canvas px-2 py-2"><p class="text-sm font-semibold" :class="summary.needsReview ? 'text-warning' : ''">{{ summary.needsReview }}</p><p class="text-[10px] text-muted-fg">Review</p></div>
						<div class="bg-canvas px-2 py-2"><p class="text-sm font-semibold">{{ summary.suspended }}</p><p class="text-[10px] text-muted-fg">Suspended</p></div>
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto">
					<DomEmptyState v-if="!filteredMembers.length" title="No people in this view" description="Try another view or clear the directory search.">
						<DomButton variant="secondary" size="sm" @click="searchQuery = ''; selectedView = 'all'">Show everyone</DomButton>
					</DomEmptyState>
					<DomAppListItem
						v-for="member in filteredMembers"
						v-else
						:key="member.id"
						:label="member.name"
						:description="`${roleLabel(member.role)} · ${member.email}`"
						:selected="member.id === selectedMemberId"
						@click="selectMember(member.id)"
					>
						<template #icon><DomAvatar :name="member.name" :initials="member.initials" size="sm" /></template>
					</DomAppListItem>
				</div>

				<footer class="hidden shrink-0 items-center justify-between border-t border-border px-3 py-2 md:flex">
					<p class="text-[11px] text-muted-fg">{{ filteredMembers.length }} visible · revision {{ workspaceRevision }}</p>
					<DomButton variant="ghost" size="sm" @click="resetDialogOpen = true">Reset demo</DomButton>
				</footer>
			</aside>

			<main v-show="!compactViewport || mobileView === 'access'" class="flex min-h-0 min-w-0 flex-col bg-canvas">
				<DomAlert v-if="actionError" class="m-3 shrink-0" tone="danger" variant="soft" title="Access action needs attention" :description="actionError" dismissible @dismiss="actionError = ''" />
				<div v-if="loadingMember && !activeMember" class="space-y-5 p-5"><DomSkeleton variant="text" :lines="3" /><DomSkeleton height="9rem" /><DomSkeleton height="12rem" /></div>
				<DomEmptyState v-else-if="!activeMember" class="m-auto" title="Choose a person" description="Select somebody from the directory to review their workspace access." />
				<template v-else>
					<header class="hidden shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 md:flex">
						<div class="flex min-w-0 items-center gap-3">
							<DomAvatar :name="activeMember.name" :initials="activeMember.initials" size="lg" />
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2"><h1 class="truncate text-lg font-semibold tracking-tight">{{ activeMember.name }}</h1><DomStatusPill :tone="memberTone(activeMember.status)" size="sm">{{ activeMember.status }}</DomStatusPill><DomBadge v-if="activeMember.id === workspace?.currentMemberId" size="sm">You</DomBadge></div>
								<p class="mt-1 truncate text-xs text-muted-fg">{{ activeMember.title }} · {{ activeMember.email }}</p>
							</div>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<DomButton class="xl:hidden" variant="secondary" size="sm" @click="detailsDrawerOpen = true">Activity</DomButton>
							<DomButton v-if="activeMember.status === 'suspended'" variant="secondary" size="sm" :loading="busyAction === 'reactivate'" @click="reactivateMember">Reactivate</DomButton>
							<DomButton v-else-if="activeMember.capabilities.canSuspend" variant="secondary" size="sm" @click="openSuspendDialog">Suspend</DomButton>
							<DomButton v-if="activeMember.capabilities.canChangeRole" size="sm" @click="openRoleDialog">Change role</DomButton>
						</div>
					</header>

					<div class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
						<div class="mx-auto max-w-3xl space-y-7">
							<section class="md:hidden">
								<div class="flex items-center gap-3"><DomAvatar :name="activeMember.name" :initials="activeMember.initials" size="lg" /><div class="min-w-0"><div class="flex items-center gap-2"><h1 class="truncate text-lg font-semibold">{{ activeMember.name }}</h1><DomStatusPill :tone="memberTone(activeMember.status)" size="sm">{{ activeMember.status }}</DomStatusPill></div><p class="mt-1 truncate text-xs text-muted-fg">{{ activeMember.title }}</p></div></div>
								<div class="mt-4 flex gap-2"><DomButton v-if="activeMember.capabilities.canChangeRole" class="flex-1" size="sm" @click="openRoleDialog">Change role</DomButton><DomButton v-if="activeMember.status === 'suspended'" class="flex-1" variant="secondary" size="sm" :loading="busyAction === 'reactivate'" @click="reactivateMember">Reactivate</DomButton><DomButton v-else-if="activeMember.capabilities.canSuspend" class="flex-1" variant="secondary" size="sm" @click="openSuspendDialog">Suspend</DomButton></div>
							</section>

							<DomAlert v-if="activeMember.suspension" tone="neutral" title="Workspace access is suspended" :description="`${activeMember.suspension.reason} ${activeMember.suspension.revokedSessions} sessions and ${activeMember.suspension.revokedApiTokens} API tokens were revoked.`" />
							<DomAlert v-else-if="activeMember.risks.length" :tone="activeMember.risks[0].tone" :title="activeMember.risks[0].label" :description="activeMember.risks[0].detail" />

							<section>
								<div class="flex items-center justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Workspace access</p><h2 class="mt-1 text-base font-semibold">{{ selectedRoleDefinition.label }}</h2></div><DomBadge :tone="selectedRoleDefinition.tone">{{ selectedRoleDefinition.seatKind === 'paid' ? 'Paid seat' : 'Guest seat' }}</DomBadge></div>
								<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ selectedRoleDefinition.description }}</p>
								<dl class="mt-5 grid grid-cols-2 border-y border-border sm:grid-cols-4">
									<div class="py-3 pr-3"><dt class="text-[10px] uppercase tracking-wide text-muted-fg">Teams</dt><dd class="mt-1 text-sm font-medium">{{ selectedTeamLabels }}</dd></div>
									<div class="border-l border-border py-3 pl-3"><dt class="text-[10px] uppercase tracking-wide text-muted-fg">MFA</dt><dd class="mt-1 text-sm font-medium" :class="activeMember.mfaEnabled ? 'text-success' : 'text-destructive'">{{ activeMember.mfaEnabled ? 'Enabled' : 'Missing' }}</dd></div>
									<div class="border-t border-border py-3 pr-3 sm:border-l sm:border-t-0 sm:pl-3"><dt class="text-[10px] uppercase tracking-wide text-muted-fg">Last active</dt><dd class="mt-1 text-sm font-medium">{{ activeMember.lastSeenLabel }}</dd></div>
									<div class="border-l border-t border-border py-3 pl-3 sm:border-t-0"><dt class="text-[10px] uppercase tracking-wide text-muted-fg">Joined</dt><dd class="mt-1 text-sm font-medium">{{ activeMember.joinedAt }}</dd></div>
								</dl>
							</section>

							<section>
								<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Sign-in evidence</p><h2 class="mt-1 text-base font-semibold">Sessions and credentials</h2></div><DomStatusPill :tone="activeMember.sessions.some((session) => session.status === 'active') ? 'success' : 'neutral'" size="sm">{{ activeMember.sessions.filter((session) => session.status === 'active').length }} active</DomStatusPill></div>
								<div class="mt-3 divide-y divide-border border-y border-border">
									<div v-for="session in activeMember.sessions" :key="session.id" class="flex items-start justify-between gap-4 py-3">
										<div><p class="text-sm font-medium">{{ session.device }}</p><p class="mt-1 text-xs text-muted-fg">{{ session.location }} · {{ session.lastActive }}</p></div>
										<DomStatusPill :tone="session.status === 'active' ? 'success' : 'neutral'" size="sm">{{ session.status }}</DomStatusPill>
									</div>
								</div>
								<p class="mt-3 text-xs text-muted-fg">{{ activeMember.apiTokenCount }} API tokens · role and suspension changes are versioned against member {{ activeMember.version }}.</p>
							</section>

							<DomAlert v-if="activeMember.lastReceipt" tone="success" title="Access change persisted" :description="`${activeMember.lastReceipt.event} · ${activeMember.lastReceipt.id}`" />
						</div>
					</div>
				</template>
			</main>

			<aside v-show="compactViewport && mobileView === 'invites'" class="min-h-0 overflow-y-auto md:hidden">
				<div class="border-b border-border p-4"><div class="flex items-center justify-between gap-3"><div><p class="text-sm font-semibold">Invitation queue</p><p class="mt-1 text-xs text-muted-fg">Delivery status and seat commitment from the API.</p></div><DomButton size="sm" @click="inviteDialogOpen = true">Invite</DomButton></div></div>
				<div class="divide-y divide-border">
					<article v-for="invite in invites" :key="invite.id" class="p-4">
						<div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ invite.email }}</p><p class="mt-1 text-xs text-muted-fg">{{ roleLabel(invite.role) }} · {{ teamLabel(invite.teamId) }} · {{ invite.displayTime }}</p></div><DomStatusPill :tone="inviteTone(invite.status)" size="sm">{{ invite.status }}</DomStatusPill></div>
						<DomAlert v-if="invite.deliveryFailure" class="mt-3" tone="danger" title="Delivery failed" :description="invite.deliveryFailure" />
						<div class="mt-3 flex gap-2"><DomButton variant="secondary" size="sm" :loading="busyAction === `resend-${invite.id}`" @click="resendInvite(invite)">{{ invite.status === 'failed' ? 'Retry delivery' : 'Resend' }}</DomButton><DomButton variant="ghost" size="sm" :loading="busyAction === `cancel-${invite.id}`" @click="cancelInvite(invite)">Cancel</DomButton></div>
					</article>
				</div>
			</aside>

			<aside class="hidden min-h-0 flex-col border-l border-border xl:flex">
				<div class="min-h-0 flex-1 overflow-y-auto">
					<section class="border-b border-border p-4">
						<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Security policy</p><h2 class="mt-1 text-sm font-semibold">Access guardrails</h2></div><DomBadge>{{ workspace?.plan }}</DomBadge></div>
						<div class="mt-4 divide-y divide-border border-y border-border">
							<div v-for="policy in policies" :key="policy.id" class="flex items-start justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ policy.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ policy.description }}</p></div><DomToggle :model-value="policy.enabled" :label="policy.enabled ? 'On' : 'Off'" :disabled="Boolean(busyAction)" @update:model-value="requestPolicyChange(policy, $event)" /></div>
						</div>
						<DomAlert v-if="workspace?.scimStatus === 'not-connected'" class="mt-4" tone="info" title="Directory sync is not connected" description="A production adapter can hand member lifecycle ownership to the identity provider." />
					</section>

					<section class="border-b border-border p-4">
						<div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Invitation queue</p><DomButton variant="ghost" size="sm" @click="inviteDialogOpen = true">New</DomButton></div>
						<div class="mt-3 divide-y divide-border border-y border-border">
							<article v-for="invite in invites" :key="invite.id" class="py-3">
								<div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-medium">{{ invite.email }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ roleLabel(invite.role) }} · {{ invite.expiresLabel }}</p></div><DomStatusPill :tone="inviteTone(invite.status)" size="sm">{{ invite.status }}</DomStatusPill></div>
								<p v-if="invite.deliveryFailure" class="mt-2 text-xs leading-5 text-destructive">{{ invite.deliveryFailure }}</p>
								<div class="mt-2 flex gap-1"><DomButton variant="ghost" size="sm" :loading="busyAction === `resend-${invite.id}`" @click="resendInvite(invite)">{{ invite.status === 'failed' ? 'Retry' : 'Resend' }}</DomButton><DomButton variant="ghost" size="sm" :loading="busyAction === `cancel-${invite.id}`" @click="cancelInvite(invite)">Cancel</DomButton></div>
							</article>
						</div>
					</section>

					<section class="p-4">
						<p class="text-sm font-semibold">Recent access activity</p>
						<div class="mt-3 space-y-4">
							<div v-for="event in events" :key="event.id" class="border-l-2 border-border pl-3"><div class="flex items-center justify-between gap-2"><p class="text-xs font-semibold">{{ event.actor }}</p><DomStatusPill :tone="event.tone" size="sm">{{ event.time }}</DomStatusPill></div><p class="mt-1 text-sm">{{ event.action }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p></div>
						</div>
					</section>
				</div>
				<footer class="shrink-0 border-t border-border p-3"><div class="flex gap-2"><DomButton class="flex-1" variant="secondary" size="sm" :loading="busyAction === 'export'" @click="exportMembers">Export CSV</DomButton><DomButton variant="ghost" size="sm" @click="resetDialogOpen = true">Reset</DomButton></div><p v-if="exportReceipt" class="mt-2 truncate font-mono text-[10px] text-success">{{ exportReceipt.rowCount }} rows · {{ exportReceipt.receipt.id }}</p></footer>
			</aside>
		</div>

		<DomAppBottomNav v-if="compactViewport && members.length" v-model="mobileView" class="shrink-0 md:hidden" :items="mobileNavigation" />

		<DomDrawer v-model="detailsDrawerOpen" title="Access activity" side="right" width="min(94vw, 24rem)">
			<div class="space-y-6 p-1">
				<section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Security policy</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="policy in policies" :key="policy.id" class="flex items-start justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ policy.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ policy.description }}</p></div><DomToggle :model-value="policy.enabled" :label="policy.enabled ? 'On' : 'Off'" :disabled="Boolean(busyAction)" @update:model-value="requestPolicyChange(policy, $event)" /></div></div></section>
				<section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent activity</p><div class="mt-3 space-y-4"><div v-for="event in events" :key="event.id" class="border-l-2 border-border pl-3"><p class="text-xs font-semibold">{{ event.actor }} · {{ event.time }}</p><p class="mt-1 text-sm">{{ event.action }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p></div></div></section>
			</div>
		</DomDrawer>

		<DomDialog v-model="inviteDialogOpen" title="Invite a workspace member" description="The API validates the email domain, seat capacity, role, team, and invitation expiry." width="min(94vw, 38rem)">
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="sm:col-span-2"><DomEmailInput v-model="inviteDraft.email" label="Work email" placeholder="person@northstar.example" :errors="fieldErrors.email || []" @update:model-value="clearFieldErrors" /></div>
				<DomSelect v-model="inviteDraft.role" label="Workspace role" :options="selectableRoles" :errors="fieldErrors.role || []" @update:model-value="clearFieldErrors"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
				<DomSelect v-model="inviteDraft.teamId" label="Starting team" :options="catalogs.teams" :errors="fieldErrors.teamId || []" @update:model-value="clearFieldErrors"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
				<div class="sm:col-span-2"><DomSelect v-model="inviteDraft.expiryDays" label="Invitation window" :options="catalogs.inviteExpiry" :errors="fieldErrors.expiryDays || []" @update:model-value="clearFieldErrors"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
				<div v-if="externalInvite" class="sm:col-span-2"><DomAlert tone="warning" title="External collaborator" :description="`Only the selected team will be visible because the email is outside ${workspace.approvedDomain}.`" /><DomCheckbox v-model="inviteDraft.externalAcknowledged" class="mt-3" label="I approve team-scoped guest access for this external domain" :errors="fieldErrors.externalAcknowledged || []" @update:model-value="clearFieldErrors" /></div>
			</div>
			<template #footer><DomButton variant="secondary" :disabled="busyAction === 'invite'" @click="inviteDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'invite'" @click="sendInvite">Send invitation</DomButton></template>
		</DomDialog>

		<DomDialog v-model="roleDialogOpen" title="Change workspace role" :description="activeMember ? `${activeMember.name} · exact member version ${activeMember.version}` : ''" width="min(94vw, 38rem)">
			<div v-if="!rolePreview" class="space-y-4">
				<DomSelect v-model="selectedRole" label="Proposed role" :options="selectableRoles" :errors="fieldErrors.role || []"><template #option="{ option }"><div><div class="flex items-center gap-2"><p class="font-semibold">{{ option.label }}</p><DomBadge :tone="option.tone" size="sm">{{ option.seatKind }} seat</DomBadge></div><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
				<DomAlert tone="info" title="Review before commit" description="The API creates an immutable preview against the current member and workspace revision. No role changes in this step." />
			</div>
			<div v-else class="space-y-4">
				<div class="flex items-center justify-between border-y border-border py-4"><div><p class="text-xs text-muted-fg">Current role</p><p class="mt-1 font-semibold">{{ rolePreview.fromLabel }}</p></div><span class="text-muted-fg">→</span><div class="text-right"><p class="text-xs text-muted-fg">New role</p><p class="mt-1 font-semibold">{{ rolePreview.toLabel }}</p></div></div>
				<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Access impact</p><ul class="mt-2 space-y-2 text-sm"><li v-for="change in rolePreview.accessChanges" :key="change" class="border-l-2 border-primary/40 pl-3">{{ change }}</li></ul></div>
				<DomAlert :tone="rolePreview.seatDelta > 0 ? 'warning' : 'info'" title="Seat impact" :description="rolePreview.seatDelta > 0 ? 'This role consumes one additional paid seat.' : rolePreview.seatDelta < 0 ? 'This change releases one paid seat.' : 'Paid seat commitment is unchanged.'" />
				<DomCheckbox v-model="roleAcknowledged" label="I reviewed the capability and billing impact" :errors="fieldErrors.acknowledged || []" />
			</div>
			<template #footer><DomButton variant="secondary" :disabled="Boolean(busyAction)" @click="roleDialogOpen = false">Cancel</DomButton><DomButton v-if="!rolePreview" :loading="busyAction === 'preview-role'" @click="previewRoleChange">Review change</DomButton><DomButton v-else :loading="busyAction === 'commit-role'" @click="commitRoleChange">Apply role</DomButton></template>
		</DomDialog>

		<DomDialog v-model="suspendDialogOpen" title="Suspend workspace access?" :description="activeMember ? `${activeMember.name} will be signed out and active API tokens will be revoked.` : ''" width="min(94vw, 36rem)">
			<div class="space-y-4"><DomTextareaInput v-model="suspensionReason" label="Audit reason" description="Recorded with the suspension receipt." :rows="4" :errors="fieldErrors.reason || []" /><DomCheckbox v-model="suspensionAcknowledged" label="Revoke active sessions and API tokens now" :errors="fieldErrors.acknowledged || []" /></div>
			<template #footer><DomButton variant="secondary" :disabled="busyAction === 'suspend'" @click="suspendDialogOpen = false">Keep active</DomButton><DomButton variant="danger" :loading="busyAction === 'suspend'" @click="suspendMember">Suspend access</DomButton></template>
		</DomDialog>

		<DomDialog v-model="policyDialogOpen" title="Allow password and social login?" description="Disabling required SSO changes the authentication boundary for every workspace member." width="min(94vw, 34rem)">
			<div class="space-y-4"><DomAlert tone="warning" title="Identity policy downgrade" description="Members will be able to sign in without the company identity provider until SSO is required again." /><DomCheckbox v-model="policyAcknowledged" label="I understand password and social login will be allowed" :errors="fieldErrors.acknowledged || []" /></div>
			<template #footer><DomButton variant="secondary" :disabled="Boolean(busyAction)" @click="policyDialogOpen = false">Keep SSO required</DomButton><DomButton variant="danger" :loading="busyAction === 'policy-require-sso'" @click="confirmPolicyChange">Disable required SSO</DomButton></template>
		</DomDialog>

		<DomDialog v-model="resetDialogOpen" title="Reset the people directory?" description="Restore seeded members, invitations, policies, activity, and version counters for this process-local demo.">
			<template #footer><DomButton variant="secondary" :disabled="busyAction === 'reset'" @click="resetDialogOpen = false">Keep workspace</DomButton><DomButton variant="danger" :loading="busyAction === 'reset'" @click="resetDemo">Reset demo</DomButton></template>
		</DomDialog>
	</section>
</template>
