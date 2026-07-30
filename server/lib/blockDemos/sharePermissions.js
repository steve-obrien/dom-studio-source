const allowedRoles = new Set(['Owner', 'Can edit', 'Can comment', 'Can view']);
const assignableRoles = new Set(['Can edit', 'Can comment', 'Can view']);
const allowedLinkAccess = new Set(['restricted', 'workspace', 'public']);
const allowedLinkExpiry = new Set(['none', '7d', '30d']);

const resourceSeeds = [
	{
		id: 'report_q3_pipeline',
		name: 'Q3 enterprise pipeline review',
		type: 'Report',
		owner: 'Maya Chen',
		workspace: 'Revenue operations',
		sensitivity: 'Internal',
		lastShared: 'Today at 10:24',
		linkAccess: 'restricted',
		linkExpiry: '30d',
		requireApproval: true,
		allowDownload: false,
		notifyPeople: true,
		collaborators: [
			{ id: 'maya', name: 'Maya Chen', email: 'maya@getdom.studio', role: 'Owner', source: 'Owner', status: 'Active', external: false },
			{ id: 'jon', name: 'Jon Bell', email: 'jon@getdom.studio', role: 'Can edit', source: 'Direct access', status: 'Active', external: false },
			{ id: 'revops', name: 'Revenue team', email: '12 members', role: 'Can view', source: 'Workspace group', status: 'Active', external: false },
			{ id: 'elena', name: 'Elena Ramos', email: 'elena@northstar.example', role: 'Can comment', source: 'Direct access', status: 'External', external: true },
		],
		pendingInvites: [
			{ id: 'invite_finance', email: 'finance-leads@getdom.studio', role: 'Can view', expiresAt: 'Jun 17, 2026', status: 'Sent' },
		],
		activityEvents: [
			{ id: 'activity-link', label: 'Changed general access to restricted', actor: 'Maya Chen', time: 'Today at 10:24' },
			{ id: 'activity-elena', label: 'Added Elena Ramos as a commenter', actor: 'Jon Bell', time: 'Yesterday' },
			{ id: 'activity-team', label: 'Granted Revenue team view access', actor: 'Maya Chen', time: 'Jun 7, 2026' },
		],
	},
	{
		id: 'roadmap_ai_assist',
		name: 'AI assist rollout plan',
		type: 'Roadmap',
		owner: 'Jon Bell',
		workspace: 'Product delivery',
		sensitivity: 'Confidential',
		lastShared: 'Yesterday',
		linkAccess: 'workspace',
		linkExpiry: 'none',
		requireApproval: true,
		allowDownload: false,
		notifyPeople: true,
		collaborators: [
			{ id: 'jon', name: 'Jon Bell', email: 'jon@getdom.studio', role: 'Owner', source: 'Owner', status: 'Active', external: false },
			{ id: 'product', name: 'Product leads', email: '8 members', role: 'Can edit', source: 'Workspace group', status: 'Active', external: false },
			{ id: 'support', name: 'Support managers', email: '5 members', role: 'Can comment', source: 'Workspace group', status: 'Active', external: false },
		],
		pendingInvites: [
			{ id: 'invite_legal', email: 'legal-review@getdom.studio', role: 'Can comment', expiresAt: 'Jun 13, 2026', status: 'Pending approval' },
		],
		activityEvents: [
			{ id: 'activity-workspace', label: 'Enabled workspace link access', actor: 'Jon Bell', time: 'Yesterday' },
			{ id: 'activity-support', label: 'Added Support managers', actor: 'Maya Chen', time: 'Jun 8, 2026' },
		],
	},
	{
		id: 'brief_client_alpha',
		name: 'Client Alpha success brief',
		type: 'Client brief',
		owner: 'Ari Grant',
		workspace: 'Customer success',
		sensitivity: 'External ready',
		lastShared: 'Jun 8, 2026',
		linkAccess: 'restricted',
		linkExpiry: '7d',
		requireApproval: true,
		allowDownload: true,
		notifyPeople: true,
		collaborators: [
			{ id: 'ari', name: 'Ari Grant', email: 'ari@getdom.studio', role: 'Owner', source: 'Owner', status: 'Active', external: false },
			{ id: 'clientteam', name: 'Client Alpha team', email: '4 guests', role: 'Can view', source: 'Guest group', status: 'External', external: true },
		],
		pendingInvites: [
			{ id: 'invite_sponsor', email: 'sponsor@client-alpha.example', role: 'Can view', expiresAt: 'Jun 20, 2026', status: 'Sent' },
		],
		activityEvents: [
			{ id: 'activity-guest', label: 'Added the Client Alpha guest group', actor: 'Ari Grant', time: 'Jun 8, 2026' },
			{ id: 'activity-download', label: 'Enabled approved viewer downloads', actor: 'Ari Grant', time: 'Jun 8, 2026' },
		],
	},
];

const resources = new Map(resourceSeeds.map((resource) => [resource.id, clone(resource)]));
let invitationSequence = 0;
let activitySequence = 0;

/**
 * Lists the available share-permission resources without their detailed grants.
 *
 * @returns {Array<object>} Resource summaries for a rich resource selector.
 */
export function listSharePermissionResources() {
	return [...resources.values()].map(serializeResourceSummary);
}

/**
 * Returns one complete share-permission resource.
 *
 * @param {string} resourceId Resource identifier.
 * @returns {{ resource?: object, error?: string, status?: number }} Resource result.
 */
export function getSharePermissionResource(resourceId) {
	const resource = resources.get(String(resourceId || ''));
	if (!resource) return { error: 'Shared item not found.', status: 404 };
	return { resource: serializeResource(resource) };
}

/**
 * Applies validated permission and safeguard updates to one resource.
 *
 * @param {string} resourceId Resource identifier.
 * @param {Record<string, unknown>} input Requested permission state.
 * @returns {{ resource?: object, changes?: string[], error?: string, status?: number }} Update result.
 */
export function updateSharePermissionResource(resourceId, input = {}) {
	const resource = resources.get(String(resourceId || ''));
	if (!resource) return { error: 'Shared item not found.', status: 404 };

	const normalized = normalizePermissionUpdate(resource, input);
	if (normalized.error) return normalized;

	const changes = describePermissionChanges(resource, normalized.value);
	applyPermissionUpdate(resource, normalized.value);

	if (changes.length) {
		resource.activityEvents.unshift(createActivityEvent(
			`Applied ${changes.length} permission ${changes.length === 1 ? 'change' : 'changes'}`,
		));
		resource.lastShared = 'Just now';
	}

	return {
		resource: serializeResource(resource),
		changes,
	};
}

/**
 * Creates a validated pending invitation for one resource.
 *
 * @param {string} resourceId Resource identifier.
 * @param {Record<string, unknown>} input Invitation payload.
 * @returns {{ resource?: object, invitation?: object, error?: string, status?: number }} Invitation result.
 */
export function createSharePermissionInvitation(resourceId, input = {}) {
	const resource = resources.get(String(resourceId || ''));
	if (!resource) return { error: 'Shared item not found.', status: 404 };

	const email = String(input.email || '').trim().toLowerCase();
	const role = String(input.role || '');
	if (!isValidEmail(email)) return { error: 'Enter a valid email address.', status: 400 };
	if (!assignableRoles.has(role)) return { error: 'Choose an assignable invitation role.', status: 400 };

	const alreadyCollaborates = resource.collaborators.some((person) => String(person.email).toLowerCase() === email);
	const alreadyInvited = resource.pendingInvites.some((invite) => String(invite.email).toLowerCase() === email);
	if (alreadyCollaborates || alreadyInvited) {
		return { error: `${email} already has access or a pending invitation.`, status: 409 };
	}

	invitationSequence += 1;
	const invitation = {
		id: `invite_api_${invitationSequence}`,
		email,
		role,
		expiresAt: expiryDateLabel(resource.linkExpiry),
		status: resource.requireApproval ? 'Pending approval' : 'Sent',
	};
	resource.pendingInvites.unshift(invitation);
	resource.activityEvents.unshift(createActivityEvent(`Invited ${email} as ${role.toLowerCase()}`));

	return {
		resource: serializeResource(resource),
		invitation: clone(invitation),
	};
}

/**
 * Revokes one pending invitation from a share-permission resource.
 *
 * @param {string} resourceId Resource identifier.
 * @param {string} inviteId Pending invitation identifier.
 * @returns {{ resource?: object, invitation?: object, error?: string, status?: number }} Revocation result.
 */
export function revokeSharePermissionInvitation(resourceId, inviteId) {
	const resource = resources.get(String(resourceId || ''));
	if (!resource) return { error: 'Shared item not found.', status: 404 };

	const index = resource.pendingInvites.findIndex((invite) => invite.id === inviteId);
	if (index === -1) return { error: 'Pending invitation not found.', status: 404 };

	const [invitation] = resource.pendingInvites.splice(index, 1);
	resource.activityEvents.unshift(createActivityEvent(`Revoked the invitation for ${invitation.email}`));

	return {
		resource: serializeResource(resource),
		invitation: clone(invitation),
	};
}

/**
 * Normalizes and validates a full permission update before any state mutates.
 *
 * @param {object} resource Current resource.
 * @param {Record<string, unknown>} input Requested permission state.
 * @returns {{ value?: object, error?: string, status?: number }} Normalization result.
 */
function normalizePermissionUpdate(resource, input) {
	const linkAccess = String(input.linkAccess ?? resource.linkAccess);
	const linkExpiry = String(input.linkExpiry ?? resource.linkExpiry);
	if (!allowedLinkAccess.has(linkAccess)) return { error: 'Choose a supported link-access policy.', status: 400 };
	if (!allowedLinkExpiry.has(linkExpiry)) return { error: 'Choose a supported link expiry.', status: 400 };
	if (resource.sensitivity === 'Confidential' && linkAccess === 'public') {
		return { error: 'Confidential items cannot use a public link.', status: 422 };
	}

	const roleInput = Array.isArray(input.roles) ? input.roles : [];
	const roles = {};
	for (const requestedRole of roleInput) {
		const person = resource.collaborators.find((candidate) => candidate.id === requestedRole?.id);
		const role = String(requestedRole?.role || '');
		if (!person) return { error: 'One collaborator no longer has access.', status: 409 };
		if (!allowedRoles.has(role)) return { error: `Choose a supported role for ${person.name}.`, status: 400 };
		if (person.role === 'Owner' && role !== 'Owner') return { error: 'Transfer ownership in the dedicated owner workflow.', status: 422 };
		if (person.role !== 'Owner' && role === 'Owner') return { error: 'Transfer ownership in the dedicated owner workflow.', status: 422 };
		roles[person.id] = role;
	}

	return {
		value: {
			linkAccess,
			linkExpiry,
			requireApproval: booleanValue(input.requireApproval, resource.requireApproval),
			allowDownload: booleanValue(input.allowDownload, resource.allowDownload),
			notifyPeople: booleanValue(input.notifyPeople, resource.notifyPeople),
			roles,
		},
	};
}

/**
 * Describes effective changes between the stored and requested permission state.
 *
 * @param {object} resource Current resource.
 * @param {object} update Normalized permission update.
 * @returns {string[]} Human-readable change descriptions.
 */
function describePermissionChanges(resource, update) {
	const changes = [];
	if (resource.linkAccess !== update.linkAccess) changes.push(`General access changed to ${linkAccessLabel(update.linkAccess)}.`);
	if (resource.linkExpiry !== update.linkExpiry) changes.push(`Link expiry changed to ${expiryLabel(update.linkExpiry)}.`);
	if (resource.requireApproval !== update.requireApproval) changes.push(update.requireApproval ? 'Owner approval is required.' : 'Owner approval is bypassed.');
	if (resource.allowDownload !== update.allowDownload) changes.push(update.allowDownload ? 'Viewer downloads are enabled.' : 'Viewer downloads are blocked.');
	if (resource.notifyPeople !== update.notifyPeople) changes.push(update.notifyPeople ? 'Permission notifications are enabled.' : 'Permission notifications are muted.');

	for (const [personId, role] of Object.entries(update.roles)) {
		const person = resource.collaborators.find((candidate) => candidate.id === personId);
		if (person && person.role !== role) changes.push(`${person.name} changed to ${role.toLowerCase()}.`);
	}
	return changes;
}

/**
 * Applies a previously validated permission update to the in-memory demo store.
 *
 * @param {object} resource Mutable resource state.
 * @param {object} update Normalized permission update.
 * @returns {void}
 */
function applyPermissionUpdate(resource, update) {
	resource.linkAccess = update.linkAccess;
	resource.linkExpiry = update.linkExpiry;
	resource.requireApproval = update.requireApproval;
	resource.allowDownload = update.allowDownload;
	resource.notifyPeople = update.notifyPeople;
	resource.collaborators.forEach((person) => {
		if (update.roles[person.id]) person.role = update.roles[person.id];
	});
}

/**
 * Serializes one resource without exposing shared mutable store references.
 *
 * @param {object} resource Stored resource.
 * @returns {object} API-safe resource payload.
 */
function serializeResource(resource) {
	return clone(resource);
}

/**
 * Serializes selector metadata for one share-permission resource.
 *
 * @param {object} resource Stored resource.
 * @returns {object} Resource summary.
 */
function serializeResourceSummary(resource) {
	return {
		id: resource.id,
		name: resource.name,
		type: resource.type,
		owner: resource.owner,
		workspace: resource.workspace,
		sensitivity: resource.sensitivity,
		linkAccess: resource.linkAccess,
		lastShared: resource.lastShared,
		collaboratorCount: resource.collaborators.length,
		pendingInviteCount: resource.pendingInvites.length,
	};
}

/**
 * Creates one deterministic-looking audit event for a demo mutation.
 *
 * @param {string} label Event description.
 * @returns {{ id: string, label: string, actor: string, time: string }} Audit event.
 */
function createActivityEvent(label) {
	activitySequence += 1;
	return {
		id: `activity_api_${activitySequence}`,
		label,
		actor: 'Maya Chen',
		time: 'Just now',
	};
}

/**
 * Resolves a pending invitation expiry label from the saved link policy.
 *
 * @param {string} expiry Link-expiry identifier.
 * @returns {string} Human-readable invitation expiry.
 */
function expiryDateLabel(expiry) {
	if (expiry === '7d') return 'Aug 5, 2026';
	if (expiry === '30d') return 'Aug 28, 2026';
	return 'No expiry';
}

/**
 * Resolves the human-readable link-access label used in audit events.
 *
 * @param {string} value Link-access identifier.
 * @returns {string} Link-access label.
 */
function linkAccessLabel(value) {
	return {
		restricted: 'restricted',
		workspace: 'workspace members',
		public: 'anyone with the link',
	}[value] || value;
}

/**
 * Resolves the human-readable expiry label used in audit events.
 *
 * @param {string} value Link-expiry identifier.
 * @returns {string} Expiry label.
 */
function expiryLabel(value) {
	return {
		none: 'no expiry',
		'7d': '7 days',
		'30d': '30 days',
	}[value] || value;
}

/**
 * Normalizes an optional boolean while retaining the stored fallback.
 *
 * @param {unknown} value Candidate boolean.
 * @param {boolean} fallback Stored fallback.
 * @returns {boolean} Normalized boolean.
 */
function booleanValue(value, fallback) {
	return typeof value === 'boolean' ? value : fallback;
}

/**
 * Checks the minimum email shape needed by the demo invitation API.
 *
 * @param {string} email Candidate email.
 * @returns {boolean} Whether the email has a local and domain part.
 */
function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Creates a detached JSON-compatible copy of a demo record.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Detached copy.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
