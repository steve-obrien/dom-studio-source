<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomDialog,
	DomEmailInput,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomToggle,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';

const emptyResource = {
	id: 'report_q3_pipeline',
	name: 'Loading shared item',
	type: 'Resource',
	owner: 'Loading owner',
	workspace: 'Loading workspace',
	sensitivity: 'Loading',
	linkAccess: 'restricted',
	lastShared: '',
};

const resources = ref([]);

const inviteRoleOptions = [
	{ value: 'Can edit', label: 'Can edit', description: 'Change content and invite collaborators.' },
	{ value: 'Can comment', label: 'Can comment', description: 'Add feedback without changing content.' },
	{ value: 'Can view', label: 'Can view', description: 'Open and read this item.' },
];

const memberRoleOptions = [
	{ value: 'Owner', label: 'Owner', description: 'Transfer ownership in a dedicated owner workflow.', disabled: true },
	...inviteRoleOptions,
];

const expiryOptions = [
	{ value: 'none', label: 'No expiry', description: 'Access remains active until it is changed.' },
	{ value: '7d', label: '7 days', description: 'The link expires automatically next week.' },
	{ value: '30d', label: '30 days', description: 'The link expires automatically next month.' },
];

const mobileSectionOptions = [
	{ value: 'people', label: 'People' },
	{ value: 'access', label: 'Access' },
];

const selectedResourceId = ref(emptyResource.id);
const resourceDetail = ref(null);
const activeTab = ref('people');
const mobileSection = ref('people');
const inviteEmail = ref('');
const inviteRole = ref('Can comment');
const linkAccess = ref(emptyResource.linkAccess);
const linkExpiry = ref('30d');
const requireApproval = ref(true);
const allowDownload = ref(false);
const notifyPeople = ref(true);
const collaborators = ref([]);
const pendingInvites = ref([]);
const activityEvents = ref([]);
const pendingChanges = ref([]);
const feedback = ref(null);
const reviewDialogOpen = ref(false);
const savedPermissionState = ref(createPermissionSnapshot());
const isLoading = ref(true);
const isSaving = ref(false);
const isInviting = ref(false);
const revokingInviteId = ref('');
const loadError = ref('');
let resourceRequestSequence = 0;

const selectedResource = computed(() => resourceDetail.value || resources.value.find((resource) => resource.id === selectedResourceId.value) || emptyResource);
const resourceOptions = computed(() => resources.value.map((resource) => ({
	value: resource.id,
	label: resource.name,
	description: `${resource.type} · ${resource.workspace}`,
	sensitivity: resource.sensitivity,
})));
const linkAccessOptions = computed(() => [
	{ value: 'restricted', label: 'Restricted', description: 'Only people and groups listed here can open it.' },
	{ value: 'workspace', label: selectedResource.value.workspace, description: `Anyone in ${selectedResource.value.workspace} with the link can view.` },
	{ value: 'public', label: 'Anyone with the link', description: 'No sign-in required. Use only for approved content.' },
]);
const externalCollaborators = computed(() => collaborators.value.filter((person) => person.external).length);
const sectionTabs = computed(() => [
	{ key: 'people', label: `People ${collaborators.value.length}` },
	{ key: 'pending', label: `Pending ${pendingInvites.value.length}` },
	{ key: 'activity', label: 'Activity' },
]);
const hasChanges = computed(() => pendingChanges.value.length > 0);
const accessScore = computed(() => {
	let score = 78;
	if (linkAccess.value === 'restricted') score += 14;
	if (linkAccess.value === 'public') score -= 30;
	if (requireApproval.value) score += 8;
	if (allowDownload.value) score -= 10;
	if (externalCollaborators.value > 0) score -= 8;
	return Math.max(24, Math.min(100, score));
});
const accessTone = computed(() => {
	if (linkAccess.value === 'public') return 'danger';
	if (externalCollaborators.value > 0 || allowDownload.value) return 'warning';
	return 'success';
});
const accessLabel = computed(() => {
	if (linkAccess.value === 'public') return 'Public link';
	if (linkAccess.value === 'workspace') return 'Workspace link';
	return 'Restricted';
});
const accessSummary = computed(() => linkAccessOptions.value.find((option) => option.value === linkAccess.value)?.description || '');
const policyChecks = computed(() => [
	{
		id: 'external',
		label: externalCollaborators.value ? `${externalCollaborators.value} external collaborator` : 'No external collaborators',
		detail: externalCollaborators.value ? 'The owner can see and review every external grant.' : 'Direct access is limited to this workspace.',
		tone: externalCollaborators.value ? 'warning' : 'success',
	},
	{
		id: 'approval',
		label: requireApproval.value ? 'Approval required' : 'Approval bypassed',
		detail: requireApproval.value ? 'External invitations wait for an owner decision.' : 'External invitations are sent immediately.',
		tone: requireApproval.value ? 'success' : 'warning',
	},
	{
		id: 'downloads',
		label: allowDownload.value ? 'Downloads enabled' : 'Downloads blocked',
		detail: allowDownload.value ? 'Viewers can export files and reports.' : 'Only owners can export this item.',
		tone: allowDownload.value ? 'warning' : 'success',
	},
]);

watch(selectedResourceId, (resourceId, previousResourceId) => {
	if (resourceId && resourceId !== previousResourceId) loadResourceState(resourceId);
});

onMounted(loadPermissionResources);

/**
 * Clones a list of flat example records so resource-specific interactions do
 * not mutate the shared seed data.
 *
 * @param {Array<Record<string, unknown>>} list Seed records to clone.
 * @returns {Array<Record<string, unknown>>} Independent record copies.
 */
function cloneList(list) {
	return (list || []).map((item) => ({ ...item }));
}

/**
 * Captures the currently applied link, safeguard, and collaborator-role state.
 *
 * @returns {{ linkAccess: string, linkExpiry: string, requireApproval: boolean, allowDownload: boolean, notifyPeople: boolean, roles: Record<string, string> }} Saved-state snapshot.
 */
function createPermissionSnapshot() {
	return {
		linkAccess: linkAccess.value,
		linkExpiry: linkExpiry.value,
		requireApproval: requireApproval.value,
		allowDownload: allowDownload.value,
		notifyPeople: notifyPeople.value,
		roles: Object.fromEntries(collaborators.value.map((person) => [person.id, person.role])),
	};
}

/**
 * Requests JSON from the share-permissions API and promotes non-success bodies
 * into ordinary JavaScript errors for consistent UI recovery.
 *
 * @param {string} url API route.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed JSON response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			Accept: 'application/json',
			...(options.body ? { 'Content-Type': 'application/json' } : {}),
			...(options.headers || {}),
		},
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.error || `Request failed with status ${response.status}.`);
	return payload;
}

/**
 * Loads the API resource catalog and then hydrates the initially selected item.
 *
 * @returns {Promise<void>}
 */
async function loadPermissionResources() {
	isLoading.value = true;
	loadError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/share-permissions/resources');
		resources.value = Array.isArray(payload.resources) ? payload.resources : [];
		if (!resources.value.length) throw new Error('No shareable resources are available.');
		if (!resources.value.some((resource) => resource.id === selectedResourceId.value)) {
			selectedResourceId.value = resources.value[0].id;
		}
		await loadResourceState(selectedResourceId.value);
	} catch (error) {
		loadError.value = error instanceof Error ? error.message : 'Could not load sharing permissions.';
		isLoading.value = false;
	}
}

/**
 * Loads one complete API resource while ignoring stale responses after a quick
 * resource switch.
 *
 * @param {string} resourceId Canonical resource identifier.
 * @returns {Promise<void>}
 */
async function loadResourceState(resourceId) {
	const requestSequence = ++resourceRequestSequence;
	isLoading.value = true;
	loadError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/share-permissions/${encodeURIComponent(resourceId)}`);
		if (requestSequence !== resourceRequestSequence) return;
		applyResourcePayload(payload.resource, { resetView: true });
	} catch (error) {
		if (requestSequence !== resourceRequestSequence) return;
		loadError.value = error instanceof Error ? error.message : 'Could not load this shared item.';
	} finally {
		if (requestSequence === resourceRequestSequence) isLoading.value = false;
	}
}

/**
 * Applies a complete API resource payload to the current interactive state.
 *
 * @param {Record<string, unknown>} resource API resource payload.
 * @param {{ resetView?: boolean }} [options] View reset behavior.
 * @returns {void}
 */
function applyResourcePayload(resource, options = {}) {
	resourceDetail.value = { ...resource };
	linkAccess.value = String(resource.linkAccess || 'restricted');
	linkExpiry.value = String(resource.linkExpiry || 'none');
	requireApproval.value = Boolean(resource.requireApproval);
	allowDownload.value = Boolean(resource.allowDownload);
	notifyPeople.value = Boolean(resource.notifyPeople);
	collaborators.value = cloneList(resource.collaborators);
	pendingInvites.value = cloneList(resource.pendingInvites);
	activityEvents.value = cloneList(resource.activityEvents);
	pendingChanges.value = [];
	savedPermissionState.value = createPermissionSnapshot();
	syncResourceSummary(resource);
	if (options.resetView) {
		activeTab.value = 'people';
		mobileSection.value = 'people';
		inviteEmail.value = '';
		feedback.value = null;
	}
}

/**
 * Applies only invitation and activity fields so API invitation mutations do
 * not discard unsaved permission edits in the current form.
 *
 * @param {Record<string, unknown>} resource API resource payload.
 * @returns {void}
 */
function applyInvitationPayload(resource) {
	pendingInvites.value = cloneList(resource.pendingInvites);
	activityEvents.value = cloneList(resource.activityEvents);
	syncResourceSummary(resource);
}

/**
 * Updates selector metadata after an API mutation changes resource counters or
 * the saved general-access policy.
 *
 * @param {Record<string, unknown>} resource API resource payload.
 * @returns {void}
 */
function syncResourceSummary(resource) {
	const index = resources.value.findIndex((item) => item.id === resource.id);
	if (index === -1) return;
	resources.value = resources.value.map((item, itemIndex) => (itemIndex === index
		? {
			...item,
			linkAccess: resource.linkAccess,
			lastShared: resource.lastShared,
			collaboratorCount: resource.collaborators?.length || 0,
			pendingInviteCount: resource.pendingInvites?.length || 0,
		}
		: item));
}

/**
 * Stores one current change per permission setting for a concise review diff.
 *
 * @param {string} id Stable change identifier.
 * @param {string} label Human-readable change summary.
 * @returns {void}
 */
function recordChange(id, label) {
	const existingIndex = pendingChanges.value.findIndex((change) => change.id === id);
	const nextChange = { id, label };
	if (existingIndex === -1) {
		pendingChanges.value = [...pendingChanges.value, nextChange];
		return;
	}
	pendingChanges.value = pendingChanges.value.map((change, index) => (index === existingIndex ? nextChange : change));
}

/**
 * Adds, updates, or removes a pending change when a setting moves away from or
 * back to its resource baseline.
 *
 * @param {string} id Stable change identifier.
 * @param {string} label Human-readable change summary.
 * @param {boolean} changed Whether the setting differs from its saved value.
 * @returns {void}
 */
function reconcileChange(id, label, changed) {
	if (changed) {
		recordChange(id, label);
		return;
	}
	pendingChanges.value = pendingChanges.value.filter((change) => change.id !== id);
}

/**
 * Validates an invitation address enough for the deterministic block example.
 *
 * @param {string} email Candidate invitation email.
 * @returns {boolean} Whether the address has a basic local and domain shape.
 */
function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Adds a pending invitation and moves the member view to its resulting state.
 *
 * @returns {Promise<void>}
 */
async function addInvite() {
	const email = inviteEmail.value.trim();
	if (!isValidEmail(email)) {
		feedback.value = {
			tone: 'danger',
			title: 'Enter a valid email address',
			description: 'Use an address such as name@company.com before sending the invitation.',
		};
		return;
	}

	isInviting.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/share-permissions/${encodeURIComponent(selectedResourceId.value)}/invitations`,
			{
				method: 'POST',
				body: JSON.stringify({
					email,
					role: inviteRole.value,
				}),
			},
		);
		applyInvitationPayload(payload.resource);
		inviteEmail.value = '';
		activeTab.value = 'pending';
		mobileSection.value = 'people';
		feedback.value = {
			tone: 'success',
			title: 'Invitation created',
			description: payload.invitation.status === 'Pending approval'
				? `${email} is waiting for owner approval.`
				: `${email} received an invitation.`,
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Invitation not sent',
			description: error instanceof Error ? error.message : 'Try sending the invitation again.',
		};
	} finally {
		isInviting.value = false;
	}
}

/**
 * Revokes one pending invitation from the current resource.
 *
 * @param {string} inviteId Pending invitation identifier.
 * @returns {Promise<void>}
 */
async function revokeInvite(inviteId) {
	const invite = pendingInvites.value.find((item) => item.id === inviteId);
	revokingInviteId.value = inviteId;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/share-permissions/${encodeURIComponent(selectedResourceId.value)}/invitations/${encodeURIComponent(inviteId)}`,
			{ method: 'DELETE' },
		);
		applyInvitationPayload(payload.resource);
		feedback.value = {
			tone: 'success',
			title: 'Invitation revoked',
			description: invite ? `${invite.email} can no longer accept this invitation.` : 'The invitation was removed.',
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Invitation not revoked',
			description: error instanceof Error ? error.message : 'Try revoking the invitation again.',
		};
	} finally {
		revokingInviteId.value = '';
	}
}

/**
 * Updates one collaborator role and records the effective permission change.
 *
 * @param {Record<string, unknown>} person Collaborator being changed.
 * @param {string} role Newly selected role.
 * @returns {void}
 */
function updateCollaboratorRole(person, role) {
	if (person.role === 'Owner' || person.role === role) return;
	person.role = role;
	const savedRole = savedPermissionState.value.roles[person.id];
	reconcileChange(`role-${person.id}`, `${person.name} becomes ${role.toLowerCase()}`, role !== savedRole);
	feedback.value = null;
}

/**
 * Updates general link access and records the broader exposure change.
 *
 * @param {string} value Selected link-access policy.
 * @returns {void}
 */
function updateLinkAccess(value) {
	linkAccess.value = value;
	reconcileChange(
		'link-access',
		`General access changes to ${accessLabel.value.toLowerCase()}`,
		value !== savedPermissionState.value.linkAccess,
	);
	feedback.value = null;
}

/**
 * Updates link expiry and records the selected access window.
 *
 * @param {string} value Selected expiry identifier.
 * @returns {void}
 */
function updateLinkExpiry(value) {
	linkExpiry.value = value;
	const option = expiryOptions.find((item) => item.value === value);
	reconcileChange('link-expiry', `Link expiry changes to ${option?.label.toLowerCase() || value}`, value !== savedPermissionState.value.linkExpiry);
	feedback.value = null;
}

/**
 * Updates a boolean safeguard and records its current effective state.
 *
 * @param {'approval'|'download'|'notify'} setting Safeguard identifier.
 * @param {boolean} value Newly selected state.
 * @returns {void}
 */
function updateSafeguard(setting, value) {
	const labels = {
		approval: value ? 'Owner approval is required' : 'Owner approval is bypassed',
		download: value ? 'Viewer downloads are enabled' : 'Viewer downloads are blocked',
		notify: value ? 'Permission notifications are enabled' : 'Permission notifications are muted',
	};
	if (setting === 'approval') requireApproval.value = value;
	if (setting === 'download') allowDownload.value = value;
	if (setting === 'notify') notifyPeople.value = value;
	const baselines = {
		approval: savedPermissionState.value.requireApproval,
		download: savedPermissionState.value.allowDownload,
		notify: savedPermissionState.value.notifyPeople,
	};
	reconcileChange(`safeguard-${setting}`, labels[setting], value !== baselines[setting]);
	feedback.value = null;
}

/**
 * Copies the current share URL and reports browser clipboard failures clearly.
 *
 * @returns {Promise<void>}
 */
async function copyLink() {
	try {
		await navigator.clipboard.writeText(`${window.location.origin}/shared/${selectedResourceId.value}`);
		feedback.value = {
			tone: 'success',
			title: 'Link copied',
			description: `${selectedResource.value.name} is ready to paste with its current access policy.`,
		};
	} catch {
		feedback.value = {
			tone: 'warning',
			title: 'Clipboard access is unavailable',
			description: 'Copy the share URL from your application after enabling browser clipboard access.',
		};
	}
}

/**
 * Opens the change-review dialog when at least one permission has changed.
 *
 * @returns {void}
 */
function reviewChanges() {
	if (!hasChanges.value) return;
	reviewDialogOpen.value = true;
}

/**
 * Sends the reviewed permission state to the API and refreshes saved state.
 *
 * @returns {Promise<void>}
 */
async function confirmChanges() {
	isSaving.value = true;
	try {
		const payload = await requestJson(
			`/api/block-demos/share-permissions/${encodeURIComponent(selectedResourceId.value)}`,
			{
				method: 'PATCH',
				body: JSON.stringify({
					linkAccess: linkAccess.value,
					linkExpiry: linkExpiry.value,
					requireApproval: requireApproval.value,
					allowDownload: allowDownload.value,
					notifyPeople: notifyPeople.value,
					roles: collaborators.value.map((person) => ({
						id: person.id,
						role: person.role,
					})),
				}),
			},
		);
		applyResourcePayload(payload.resource);
		reviewDialogOpen.value = false;
		feedback.value = {
			tone: 'success',
			title: 'Permissions updated',
			description: notifyPeople.value
				? 'The access policy is saved and affected collaborators will be notified.'
				: 'The access policy is saved without sending collaborator notifications.',
		};
	} catch (error) {
		reviewDialogOpen.value = false;
		feedback.value = {
			tone: 'danger',
			title: 'Permissions not updated',
			description: error instanceof Error ? error.message : 'Review the changes and try again.',
		};
	} finally {
		isSaving.value = false;
	}
}

/**
 * Maps a collaborator role to a semantic DOM Studio badge tone.
 *
 * @param {string} role Collaborator role label.
 * @returns {'primary'|'info'|'neutral'|'success'} Semantic badge tone.
 */
function roleTone(role) {
	return {
		Owner: 'primary',
		'Can edit': 'success',
		'Can comment': 'info',
		'Can view': 'neutral',
	}[role] || 'neutral';
}
</script>

<template>
	<div class="min-h-dvh bg-secondary/35 text-canvas-fg sm:p-5 lg:grid lg:place-items-center">
		<section class="min-h-dvh w-full bg-canvas sm:min-h-0 sm:max-w-5xl sm:overflow-hidden sm:rounded-2xl sm:border sm:border-border sm:shadow-xl">
			<header class="border-b border-border px-4 py-4 sm:px-6 sm:py-5">
				<div class="flex flex-col gap-4">
					<div class="flex items-start justify-between gap-4">
						<div class="min-w-0">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Share and permissions</p>
							<h1 class="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{{ selectedResource.name }}</h1>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								{{ selectedResource.type }} in {{ selectedResource.workspace }} · Owned by {{ selectedResource.owner }}
							</p>
						</div>
						<DomStatusPill :tone="accessTone" size="sm">{{ accessLabel }}</DomStatusPill>
					</div>

					<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
						<DomSelect
							v-model="selectedResourceId"
							:options="resourceOptions"
							label="Shared item"
							:disabled="isLoading"
							list-width-class="w-[min(26rem,calc(100vw-2rem))]"
						>
							<template #option="{ option, selected }">
								<div class="flex items-start justify-between gap-3">
									<span class="min-w-0">
										<span class="block truncate font-medium">{{ option.label }}</span>
										<span class="mt-0.5 block text-xs text-muted-fg">{{ option.description }}</span>
									</span>
									<DomBadge :tone="selected ? 'primary' : 'neutral'" size="sm">{{ option.sensitivity }}</DomBadge>
								</div>
							</template>
						</DomSelect>

						<div class="flex gap-2">
							<DomButton variant="secondary" class="flex-1 sm:flex-none" :disabled="isLoading" @click="copyLink">Copy link</DomButton>
							<DomButton
								class="flex-1 sm:flex-none"
								:disabled="!hasChanges || isLoading"
								@click="reviewChanges"
							>
								{{ hasChanges ? `Review ${pendingChanges.length}` : 'Up to date' }}
							</DomButton>
						</div>
					</div>
				</div>
			</header>

			<div v-if="isLoading" class="border-b border-border px-4 py-3 sm:px-6">
				<DomProgress
					indeterminate
					label="Loading sharing permissions"
					size="sm"
				/>
			</div>

			<div v-else-if="loadError" class="border-b border-border px-4 py-3 sm:px-6">
				<DomAlert
					tone="danger"
					title="Sharing permissions unavailable"
					:description="loadError"
				>
					<template #actions>
						<DomButton size="sm" variant="secondary" @click="loadPermissionResources">Try again</DomButton>
					</template>
				</DomAlert>
			</div>

			<div v-if="feedback" class="border-b border-border px-4 py-3 sm:px-6">
				<DomAlert
					:tone="feedback.tone"
					variant="soft"
					:title="feedback.title"
					:description="feedback.description"
					dismissible
					@dismiss="feedback = null"
				/>
			</div>

			<div class="border-b border-border px-4 py-3 lg:hidden">
				<DomToggleButtonGroup
					v-model="mobileSection"
					:options="mobileSectionOptions"
					size="sm"
					variant="switch"
					aria-label="Permission section"
				/>
			</div>

			<div class="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
				<main
					class="min-w-0"
					:class="mobileSection === 'people' ? 'block' : 'hidden lg:!block'"
				>
					<section class="border-b border-border px-4 py-5 sm:px-6">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 class="font-semibold">Invite people</h2>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Add a person or group, then choose what they can do.</p>
							</div>
							<DomBadge tone="neutral" size="sm">{{ externalCollaborators }} external</DomBadge>
						</div>

						<div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
							<DomEmailInput
								v-model="inviteEmail"
								label="Email or group"
								placeholder="name@company.com"
								@keydown.enter.prevent="addInvite"
							/>
							<DomSelect
								v-model="inviteRole"
								:options="inviteRoleOptions"
								label="Permission"
								list-width-class="w-72"
							/>
							<DomButton class="sm:mb-0" :loading="isInviting" @click="addInvite">Send invite</DomButton>
						</div>
					</section>

					<section class="px-4 py-5 sm:px-6">
						<div class="border-b border-border">
							<DomTabs v-model="activeTab" :tabs="sectionTabs" />
						</div>

						<div v-if="activeTab === 'people'" class="divide-y divide-border">
							<div
								v-for="person in collaborators"
								:key="person.id"
								class="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center"
							>
								<div class="flex min-w-0 items-center gap-3">
									<DomAvatar :name="person.name" size="md" />
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="truncate text-sm font-semibold">{{ person.name }}</p>
											<DomBadge v-if="person.external" tone="warning" size="sm">External</DomBadge>
											<DomBadge :tone="roleTone(person.role)" size="sm">{{ person.role }}</DomBadge>
										</div>
										<p class="mt-1 truncate text-xs text-muted-fg">{{ person.email }} · {{ person.source }}</p>
									</div>
								</div>

								<DomSelect
									:model-value="person.role"
									:options="memberRoleOptions"
									:disabled="person.role === 'Owner'"
									:aria-label="`Permission for ${person.name}`"
									list-width-class="w-72"
									@update:model-value="updateCollaboratorRole(person, $event)"
								/>
							</div>
						</div>

						<div v-else-if="activeTab === 'pending'" class="divide-y divide-border">
							<div
								v-for="invite in pendingInvites"
								:key="invite.id"
								class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
							>
								<div class="flex min-w-0 flex-1 items-center gap-3">
									<DomAvatar :name="invite.email" size="md" />
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold">{{ invite.email }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ invite.role }} · Expires {{ invite.expiresAt }}</p>
									</div>
								</div>
								<DomStatusPill :tone="invite.status === 'Sent' ? 'success' : 'warning'" size="sm">{{ invite.status }}</DomStatusPill>
								<DomButton
									variant="ghost"
									size="sm"
									:loading="revokingInviteId === invite.id"
									:disabled="Boolean(revokingInviteId) && revokingInviteId !== invite.id"
									@click="revokeInvite(invite.id)"
								>
									Revoke
								</DomButton>
							</div>

							<DomEmptyState
								v-if="!pendingInvites.length"
								title="No pending invitations"
								description="New invitations will appear here until they are accepted or revoked."
								size="sm"
							/>
						</div>

						<div v-else class="divide-y divide-border">
							<div
								v-for="event in activityEvents"
								:key="event.id"
								class="flex items-start gap-3 py-4"
							>
								<DomAvatar :name="event.actor" size="sm" />
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium">{{ event.label }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
								</div>
								<time class="shrink-0 text-xs text-muted-fg">{{ event.time }}</time>
							</div>
						</div>
					</section>
				</main>

				<aside
					class="border-border bg-secondary/25 px-4 py-5 sm:px-6 lg:border-l lg:px-5"
					:class="mobileSection === 'access' ? 'block' : 'hidden lg:!block'"
				>
					<section>
						<div class="flex items-start justify-between gap-3">
							<div>
								<h2 class="font-semibold">General access</h2>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ accessSummary }}</p>
							</div>
							<DomStatusPill :tone="accessTone" size="sm">{{ accessLabel }}</DomStatusPill>
						</div>

						<div class="mt-4 space-y-4">
							<DomSelect
								:model-value="linkAccess"
								:options="linkAccessOptions"
								label="Who can open the link"
								list-width-class="w-[min(25rem,calc(100vw-2rem))]"
								@update:model-value="updateLinkAccess"
							/>
							<DomSelect
								:model-value="linkExpiry"
								:options="expiryOptions"
								label="Link expiry"
								list-width-class="w-72"
								@update:model-value="updateLinkExpiry"
							/>
							<DomButton variant="secondary" class="w-full" @click="copyLink">Copy share link</DomButton>
						</div>
					</section>

					<section class="mt-6 border-t border-border pt-5">
						<h2 class="font-semibold">Safeguards</h2>
						<div class="mt-3 divide-y divide-border">
							<div class="flex items-start justify-between gap-4 py-3">
								<div>
									<p class="text-sm font-medium">Owner approval</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">Review external invitations before they are sent.</p>
								</div>
								<DomToggle
									:model-value="requireApproval"
									aria-label="Require owner approval"
									@update:model-value="updateSafeguard('approval', $event)"
								/>
							</div>
							<div class="flex items-start justify-between gap-4 py-3">
								<div>
									<p class="text-sm font-medium">Allow downloads</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">Let viewers export files and reports.</p>
								</div>
								<DomToggle
									:model-value="allowDownload"
									aria-label="Allow viewer downloads"
									@update:model-value="updateSafeguard('download', $event)"
								/>
							</div>
							<div class="flex items-start justify-between gap-4 py-3">
								<div>
									<p class="text-sm font-medium">Notify people</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">Email collaborators after access changes.</p>
								</div>
								<DomToggle
									:model-value="notifyPeople"
									aria-label="Notify collaborators"
									@update:model-value="updateSafeguard('notify', $event)"
								/>
							</div>
						</div>
					</section>

					<section class="mt-6 border-t border-border pt-5">
						<DomProgress
							:value="accessScore"
							label="Sharing safety"
							:tone="accessTone === 'danger' ? 'danger' : accessTone === 'warning' ? 'warning' : 'success'"
							show-value
						/>

						<div class="mt-4 space-y-4">
							<div v-for="check in policyChecks" :key="check.id">
								<DomStatusPill :tone="check.tone" size="sm">{{ check.label }}</DomStatusPill>
								<p class="mt-1.5 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
							</div>
						</div>
					</section>
				</aside>
			</div>
		</section>

		<DomDialog
			v-model="reviewDialogOpen"
			title="Review permission changes"
			description="Confirm the effective access changes before they are applied."
			size="md"
		>
			<DomAlert
				v-if="linkAccess === 'public'"
				tone="warning"
				title="This creates a public link"
				description="Anyone with the link can open this item without signing in."
			/>

			<ul class="mt-4 divide-y divide-border rounded-xl border border-border">
				<li
					v-for="change in pendingChanges"
					:key="change.id"
					class="flex items-start gap-3 px-4 py-3 text-sm"
				>
					<DomStatusPill tone="info" size="sm">Change</DomStatusPill>
					<span class="leading-6">{{ change.label }}</span>
				</li>
			</ul>

			<template #footer>
				<DomButton variant="ghost" @click="reviewDialogOpen = false">Keep editing</DomButton>
				<DomButton :loading="isSaving" @click="confirmChanges">Apply changes</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
