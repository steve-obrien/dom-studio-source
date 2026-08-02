const catalogs = Object.freeze({
	views: [
		{ value: 'all', label: 'Everyone', description: 'Active, invited, and suspended people.' },
		{ value: 'admins', label: 'Admins', description: 'Owners and workspace administrators.' },
		{ value: 'guests', label: 'Guests', description: 'External collaborators with team-scoped access.' },
		{ value: 'review', label: 'Needs review', description: 'Security or inactivity signals needing action.' },
		{ value: 'suspended', label: 'Suspended', description: 'People whose workspace access is disabled.' },
	],
	roles: [
		{ value: 'owner', label: 'Owner', description: 'Full workspace, security, billing, and export control.', tone: 'danger', seatKind: 'paid', selectable: false },
		{ value: 'admin', label: 'Admin', description: 'Manage members, teams, settings, and routine workspace operations.', tone: 'warning', seatKind: 'paid', selectable: true },
		{ value: 'member', label: 'Member', description: 'Collaborate across all public workspace teams.', tone: 'primary', seatKind: 'paid', selectable: true },
		{ value: 'guest', label: 'Guest', description: 'Access only the explicitly assigned team.', tone: 'info', seatKind: 'guest', selectable: true },
		{ value: 'billing', label: 'Billing manager', description: 'View invoices and manage payment details without product access.', tone: 'neutral', seatKind: 'paid', selectable: true },
	],
	teams: [
		{ value: 'leadership', label: 'Leadership', description: 'Company operations and workspace ownership.', privacy: 'private' },
		{ value: 'product', label: 'Product', description: 'Product, design, research, and engineering.', privacy: 'workspace' },
		{ value: 'growth', label: 'Growth', description: 'Marketing, revenue, and lifecycle operations.', privacy: 'workspace' },
		{ value: 'finance', label: 'Finance', description: 'Billing and commercial records.', privacy: 'private' },
	],
	inviteExpiry: [
		{ value: '3', label: '3 days', description: 'Short-lived access for time-sensitive collaborators.' },
		{ value: '7', label: '7 days', description: 'Recommended invitation window.' },
		{ value: '14', label: '14 days', description: 'Longer onboarding window for distributed teams.' },
	],
});

let workspaceSequence = 1;
let inviteSequence = 5100;
let receiptSequence = 7300;
let previewSequence = 2400;
let eventSequence = 9000;
let state = createInitialState(workspaceSequence);
const rolePreviews = new Map();

/**
 * Returns the team-administration workspace with compact directory records.
 *
 * @returns {Record<string, unknown>} Team access workspace payload.
 */
export function getTeamAccessWorkspace() {
	return serializeWorkspace();
}

/**
 * Returns one full member record with access and session evidence.
 *
 * @param {string} memberId Member identifier.
 * @returns {Record<string, unknown>} Member payload or API error.
 */
export function getTeamAccessMember(memberId) {
	const member = findMember(memberId);
	if (!member) return { error: 'Workspace member not found.', status: 404 };
	return {
		workspaceRevision: state.workspaceRevision,
		member: serializeMember(member),
	};
}

/**
 * Creates and delivers a workspace invitation after policy and seat checks.
 *
 * @param {Record<string, unknown>} input Invitation values.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function createTeamAccessInvite(input = {}) {
	const conflict = validateWorkspaceMutation(input);
	if (conflict) return conflict;
	const email = normalizeEmail(input.email);
	const role = String(input.role || 'member');
	const teamId = String(input.teamId || 'product');
	const expiryDays = Number(input.expiryDays || 7);
	const fieldErrors = {};

	if (!email || !email.includes('@')) fieldErrors.email = ['Enter a valid work email address.'];
	if (!selectableRole(role)) fieldErrors.role = ['Choose an invitation role.'];
	if (!catalogs.teams.some((team) => team.value === teamId)) fieldErrors.teamId = ['Choose an available workspace team.'];
	if (![3, 7, 14].includes(expiryDays)) fieldErrors.expiryDays = ['Choose a supported invitation window.'];
	if (state.members.some((member) => member.email === email)) fieldErrors.email = ['This person is already a workspace member.'];
	if (state.invites.some((invite) => invite.email === email && ['pending', 'failed'].includes(invite.status))) fieldErrors.email = ['An active invitation already exists for this email.'];
	if (isPersonalEmail(email) && policyEnabled('block-personal-email')) fieldErrors.email = ['Personal email domains are blocked by workspace policy.'];

	const external = emailDomain(email) !== state.workspace.approvedDomain;
	if (external && role !== 'guest') fieldErrors.role = ['External collaborators must use the Guest role.'];
	if (external && input.externalAcknowledged !== true) fieldErrors.externalAcknowledged = ['Confirm that this external collaborator should receive team-scoped access.'];
	if (usesPaidSeat(role) && paidSeatCommitment() >= state.workspace.seatLimit) fieldErrors.role = ['No paid seats are available. Suspend a member or increase the workspace limit.'];
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	inviteSequence += 1;
	const invite = {
		id: `invite-${inviteSequence}`,
		version: 1,
		email,
		role,
		teamId,
		external,
		status: 'pending',
		sentAt: new Date().toISOString(),
		displayTime: 'Just now',
		expiresAt: addDays(new Date(), expiryDays).toISOString(),
		expiresLabel: `${expiryDays} days`,
		deliveryFailure: null,
		receipt: createReceipt('invitation.delivered', `invite-${inviteSequence}`),
	};
	state.invites.unshift(invite);
	appendEvent('Amelia Hart', 'Sent a workspace invitation', `${email} · ${roleLabel(role)} · ${teamLabel(teamId)}`, 'success');
	touchWorkspace();
	return { ...serializeWorkspace(), invitation: cloneValue(invite) };
}

/**
 * Resends a pending or failed invitation through the demo email provider.
 *
 * @param {string} inviteId Invitation identifier.
 * @param {Record<string, unknown>} input Revision payload.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function resendTeamAccessInvite(inviteId, input = {}) {
	const invite = findInvite(inviteId);
	if (!invite) return { error: 'Workspace invitation not found.', status: 404 };
	const conflict = validateInviteMutation(invite, input);
	if (conflict) return conflict;
	if (!['pending', 'failed', 'expired'].includes(invite.status)) return { error: 'This invitation cannot be resent.', status: 409 };

	invite.status = 'pending';
	invite.version += 1;
	invite.sentAt = new Date().toISOString();
	invite.displayTime = 'Just now';
	invite.expiresAt = addDays(new Date(), 7).toISOString();
	invite.expiresLabel = '7 days';
	invite.deliveryFailure = null;
	invite.receipt = createReceipt('invitation.resent', invite.id);
	appendEvent('Amelia Hart', 'Resent a workspace invitation', `${invite.email} · provider accepted the existing invitation.`, 'success');
	touchWorkspace();
	return { ...serializeWorkspace(), invitation: cloneValue(invite) };
}

/**
 * Cancels an invitation while retaining an immutable audit event.
 *
 * @param {string} inviteId Invitation identifier.
 * @param {Record<string, unknown>} input Revision payload.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function cancelTeamAccessInvite(inviteId, input = {}) {
	const invite = findInvite(inviteId);
	if (!invite) return { error: 'Workspace invitation not found.', status: 404 };
	const conflict = validateInviteMutation(invite, input);
	if (conflict) return conflict;
	if (!['pending', 'failed', 'expired'].includes(invite.status)) return { error: 'This invitation is already inactive.', status: 409 };

	state.invites = state.invites.filter((candidate) => candidate.id !== invite.id);
	appendEvent('Amelia Hart', 'Cancelled a workspace invitation', `${invite.email} can no longer use the invitation link.`, 'warning');
	touchWorkspace();
	return serializeWorkspace();
}

/**
 * Creates an immutable preview of a member role transition.
 *
 * @param {string} memberId Member identifier.
 * @param {Record<string, unknown>} input Requested role transition.
 * @returns {Record<string, unknown>} Role preview or API error.
 */
export function previewTeamMemberRole(memberId, input = {}) {
	const member = findMember(memberId);
	if (!member) return { error: 'Workspace member not found.', status: 404 };
	const conflict = validateMemberMutation(member, input);
	if (conflict) return conflict;
	if (!member.capabilities.canChangeRole) return { error: 'This member role is controlled by workspace ownership policy.', status: 403 };
	const nextRole = String(input.role || '');
	if (!selectableRole(nextRole)) return validationError({ role: ['Choose an available role.'] });
	if (nextRole === member.role) return validationError({ role: ['Choose a different role before reviewing the change.'] });
	if (nextRole === 'guest' && member.teams.length !== 1) return validationError({ role: ['Guests must have exactly one team. Remove extra team access first.'] });

	previewSequence += 1;
	const preview = {
		id: `role-preview-${previewSequence}`,
		memberId: member.id,
		memberVersion: member.version,
		workspaceRevision: state.workspaceRevision,
		fromRole: member.role,
		toRole: nextRole,
		fromLabel: roleLabel(member.role),
		toLabel: roleLabel(nextRole),
		seatDelta: Number(usesPaidSeat(nextRole)) - Number(usesPaidSeat(member.role)),
		accessChanges: roleAccessChanges(member.role, nextRole),
		requiresAcknowledgement: true,
		createdAt: new Date().toISOString(),
	};
	rolePreviews.set(preview.id, preview);
	return { preview: cloneValue(preview) };
}

/**
 * Commits one exact role preview after administrator acknowledgement.
 *
 * @param {string} memberId Member identifier.
 * @param {Record<string, unknown>} input Commit values.
 * @returns {Record<string, unknown>} Updated member workspace or API error.
 */
export function commitTeamMemberRole(memberId, input = {}) {
	const member = findMember(memberId);
	if (!member) return { error: 'Workspace member not found.', status: 404 };
	const preview = rolePreviews.get(String(input.previewId || ''));
	if (!preview || preview.memberId !== member.id) return { error: 'Create a fresh role preview before saving.', status: 409 };
	const conflict = validateMemberMutation(member, input);
	if (conflict) return conflict;
	if (preview.memberVersion !== member.version || preview.workspaceRevision !== state.workspaceRevision) return { error: 'This role preview is stale. Review the latest member access before saving.', status: 409, conflict: true };
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Confirm that you reviewed the access and billing impact.'] });
	if (usesPaidSeat(preview.toRole) && !usesPaidSeat(member.role) && paidSeatCommitment() >= state.workspace.seatLimit) return { error: 'No paid seats remain for this role change.', status: 409 };

	const previousRole = member.role;
	member.role = preview.toRole;
	member.version += 1;
	member.lastChangedAt = new Date().toISOString();
	member.lastReceipt = createReceipt('member.role-changed', member.id);
	rolePreviews.delete(preview.id);
	appendEvent('Amelia Hart', 'Changed a member role', `${member.name} · ${roleLabel(previousRole)} to ${roleLabel(member.role)}`, 'warning');
	touchWorkspace();
	return createMemberMutationResult(member);
}

/**
 * Suspends an active member and records revoked access evidence.
 *
 * @param {string} memberId Member identifier.
 * @param {Record<string, unknown>} input Suspension values.
 * @returns {Record<string, unknown>} Updated member workspace or API error.
 */
export function suspendTeamMember(memberId, input = {}) {
	const member = findMember(memberId);
	if (!member) return { error: 'Workspace member not found.', status: 404 };
	const conflict = validateMemberMutation(member, input);
	if (conflict) return conflict;
	if (!member.capabilities.canSuspend) return { error: 'Workspace owners and the current administrator cannot be suspended here.', status: 403 };
	if (member.status === 'suspended') return { error: 'This member is already suspended.', status: 409 };
	const reason = normalizeText(input.reason, 400);
	if (reason.length < 12) return validationError({ reason: ['Explain the suspension reason in at least 12 characters.'] });
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Confirm that active sessions and API tokens will be revoked.'] });

	const revokedSessions = member.sessions.filter((session) => session.status === 'active').length;
	member.sessions = member.sessions.map((session) => ({ ...session, status: 'revoked' }));
	member.status = 'suspended';
	member.version += 1;
	member.suspension = {
		reason,
		suspendedAt: new Date().toISOString(),
		suspendedBy: 'Amelia Hart',
		revokedSessions,
		revokedApiTokens: member.apiTokenCount,
		receipt: createReceipt('member.suspended', member.id),
	};
	appendEvent('Amelia Hart', 'Suspended a workspace member', `${member.name} · ${revokedSessions} sessions and ${member.apiTokenCount} API tokens revoked.`, 'danger');
	touchWorkspace();
	return createMemberMutationResult(member);
}

/**
 * Reactivates a suspended member with fresh-session requirements.
 *
 * @param {string} memberId Member identifier.
 * @param {Record<string, unknown>} input Revision payload.
 * @returns {Record<string, unknown>} Updated member workspace or API error.
 */
export function reactivateTeamMember(memberId, input = {}) {
	const member = findMember(memberId);
	if (!member) return { error: 'Workspace member not found.', status: 404 };
	const conflict = validateMemberMutation(member, input);
	if (conflict) return conflict;
	if (member.status !== 'suspended') return { error: 'This member is already active.', status: 409 };
	if (usesPaidSeat(member.role) && paidSeatCommitment() >= state.workspace.seatLimit) return { error: 'No paid seats remain to reactivate this member.', status: 409 };

	member.status = 'active';
	member.version += 1;
	member.suspension = null;
	member.lastReceipt = createReceipt('member.reactivated', member.id);
	appendEvent('Amelia Hart', 'Reactivated a workspace member', `${member.name} must sign in again and satisfy current SSO policy.`, 'success');
	touchWorkspace();
	return createMemberMutationResult(member);
}

/**
 * Updates one workspace security policy with exact versions.
 *
 * @param {string} policyId Policy identifier.
 * @param {Record<string, unknown>} input Policy values.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function updateTeamAccessPolicy(policyId, input = {}) {
	const policy = state.policies.find((candidate) => candidate.id === String(policyId || ''));
	if (!policy) return { error: 'Workspace access policy not found.', status: 404 };
	const conflict = validatePolicyMutation(policy, input);
	if (conflict) return conflict;
	const enabled = input.enabled === true;
	if (policy.id === 'require-sso' && !enabled && input.acknowledged !== true) return validationError({ acknowledged: ['Confirm that password and social login will be allowed again.'] });

	policy.enabled = enabled;
	policy.version += 1;
	policy.lastChangedAt = new Date().toISOString();
	policy.lastReceipt = createReceipt('workspace.policy-changed', policy.id);
	appendEvent('Amelia Hart', 'Updated an access policy', `${policy.label} · ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'warning');
	touchWorkspace();
	return serializeWorkspace();
}

/**
 * Returns a server-generated CSV export and immutable export receipt.
 *
 * @returns {Record<string, unknown>} Downloadable member export payload.
 */
export function exportTeamAccessMembers() {
	const header = ['member_id', 'name', 'email', 'role', 'status', 'teams', 'mfa', 'last_seen'];
	const rows = state.members.map((member) => [member.id, member.name, member.email, member.role, member.status, member.teams.join('|'), member.mfaEnabled ? 'enabled' : 'missing', member.lastSeenLabel]);
	const content = [header, ...rows].map((row) => row.map(csvValue).join(',')).join('\n');
	return {
		filename: `northstar-members-revision-${state.workspaceRevision}.csv`,
		mediaType: 'text/csv;charset=utf-8',
		content,
		rowCount: rows.length,
		receipt: createReceipt('workspace.members-exported', state.workspace.id),
	};
}

/**
 * Restores the deterministic team-access dataset.
 *
 * @returns {Record<string, unknown>} Reset workspace payload.
 */
export function resetTeamAccessWorkspace() {
	workspaceSequence += 1;
	state = createInitialState(workspaceSequence);
	rolePreviews.clear();
	return serializeWorkspace();
}

/**
 * Creates the deterministic workspace, members, invitations, and policies.
 *
 * @param {number} workspaceRevision Initial workspace revision.
 * @returns {Record<string, unknown>} Team access state.
 */
function createInitialState(workspaceRevision) {
	return {
		workspaceRevision,
		workspace: {
			id: 'workspace-northstar',
			name: 'Northstar Labs',
			plan: 'Enterprise',
			approvedDomain: 'northstar.example',
			seatLimit: 8,
			currentMemberId: 'member-amelia',
			scimStatus: 'not-connected',
		},
		members: [
			createMember({ id: 'member-amelia', name: 'Amelia Hart', initials: 'AH', email: 'amelia@northstar.example', role: 'owner', status: 'active', teams: ['leadership', 'product'], title: 'Chief operating officer', location: 'London · GMT+1', lastSeenLabel: '6 min ago', lastSeenAt: '2026-08-02T09:54:00.000Z', mfaEnabled: true, joinedAt: '2025-01-14', apiTokenCount: 2, capabilities: { canChangeRole: false, canSuspend: false } }),
			createMember({ id: 'member-marcus', name: 'Marcus Chen', initials: 'MC', email: 'marcus@northstar.example', role: 'admin', status: 'active', teams: ['product'], title: 'Operations lead', location: 'Manchester · GMT+1', lastSeenLabel: 'Today', lastSeenAt: '2026-08-02T07:42:00.000Z', mfaEnabled: true, joinedAt: '2025-04-06', apiTokenCount: 1 }),
			createMember({ id: 'member-priya', name: 'Priya Raman', initials: 'PR', email: 'priya@northstar.example', role: 'member', status: 'active', teams: ['growth', 'product'], title: 'Growth designer', location: 'Edinburgh · GMT+1', lastSeenLabel: 'Yesterday', lastSeenAt: '2026-08-01T16:18:00.000Z', mfaEnabled: true, joinedAt: '2025-09-22', apiTokenCount: 0 }),
			createMember({ id: 'member-jon', name: 'Jon Bell', initials: 'JB', email: 'jon@agency.example', role: 'guest', status: 'active', teams: ['growth'], title: 'Agency analyst', location: 'Berlin · GMT+2', lastSeenLabel: '5 days ago', lastSeenAt: '2026-07-28T11:14:00.000Z', mfaEnabled: false, joinedAt: '2026-05-29', apiTokenCount: 0 }),
			createMember({ id: 'member-nadia', name: 'Nadia Stone', initials: 'NS', email: 'nadia@northstar.example', role: 'billing', status: 'active', teams: ['finance'], title: 'Finance controller', location: 'London · GMT+1', lastSeenLabel: '41 days ago', lastSeenAt: '2026-06-22T08:10:00.000Z', mfaEnabled: true, joinedAt: '2025-02-11', apiTokenCount: 0 }),
			createMember({ id: 'member-elena', name: 'Elena Voss', initials: 'EV', email: 'elena@northstar.example', role: 'member', status: 'suspended', teams: ['product'], title: 'Former engineer', location: 'Remote', lastSeenLabel: '67 days ago', lastSeenAt: '2026-05-27T13:44:00.000Z', mfaEnabled: true, joinedAt: '2025-06-18', apiTokenCount: 1, suspension: { reason: 'Offboarding completed after employment ended.', suspendedAt: '2026-05-28T09:00:00.000Z', suspendedBy: 'Amelia Hart', revokedSessions: 2, revokedApiTokens: 1, receipt: { id: 'receipt-access-7012', event: 'member.suspended', provider: 'Northstar Access API' } } }),
		],
		invites: [
			createInvite({ id: 'invite-lena', email: 'lena@northstar.example', role: 'member', teamId: 'growth', status: 'pending', displayTime: '2 hours ago', expiresLabel: '7 days', receipt: { id: 'receipt-access-7021', event: 'invitation.delivered', provider: 'Northstar Access API' } }),
			createInvite({ id: 'invite-finance', email: 'finance@northstar.example', role: 'billing', teamId: 'finance', status: 'pending', displayTime: 'Yesterday', expiresLabel: '6 days', receipt: { id: 'receipt-access-7022', event: 'invitation.delivered', provider: 'Northstar Access API' } }),
			createInvite({ id: 'invite-contractor', email: 'contractor@agency.example', role: 'guest', teamId: 'growth', status: 'failed', displayTime: 'Today · 08:16', expiresLabel: 'Not started', external: true, deliveryFailure: 'Invitation provider timed out before accepting the email.', receipt: null }),
		],
		policies: [
			createPolicy('require-sso', 'Require SSO', 'Members must authenticate through the company identity provider.', true, 'primary'),
			createPolicy('block-personal-email', 'Block personal email invites', 'Common personal email providers cannot receive workspace invitations.', true, 'warning'),
			createPolicy('review-inactive-admins', 'Review inactive admins', 'Create a review task after an administrator is inactive for 30 days.', false, 'neutral'),
		],
		events: [
			createEvent('Amelia Hart', 'Changed Marcus Chen to Admin', 'Role preview reviewed · receipt-access-6991', '18 min ago', 'warning'),
			createEvent('Northstar Access API', 'Flagged missing MFA', 'Jon Bell can view Growth reports without a second factor.', 'Today · 08:22', 'danger'),
			createEvent('Northstar Access API', 'Invitation delivery failed', 'contractor@agency.example can be retried safely.', 'Today · 08:16', 'danger'),
		],
	};
}

/**
 * Creates a normalized member with session and capability evidence.
 *
 * @param {Record<string, unknown>} input Member values.
 * @returns {Record<string, unknown>} Stored member.
 */
function createMember(input) {
	return {
		version: 1,
		lastReceipt: null,
		suspension: null,
		capabilities: { canChangeRole: true, canSuspend: true },
		sessions: [
			{ id: `${input.id}-session-web`, device: 'Chrome on macOS', location: input.location, lastActive: input.lastSeenLabel, status: input.status === 'suspended' ? 'revoked' : 'active' },
			{ id: `${input.id}-session-mobile`, device: 'Mobile app', location: input.location, lastActive: '12 days ago', status: input.status === 'suspended' ? 'revoked' : 'active' },
		],
		...input,
	};
}

/**
 * Creates a normalized invitation record.
 *
 * @param {Record<string, unknown>} input Invitation values.
 * @returns {Record<string, unknown>} Stored invitation.
 */
function createInvite(input) {
	return {
		version: 1,
		external: false,
		sentAt: '2026-08-02T08:00:00.000Z',
		expiresAt: '2026-08-09T08:00:00.000Z',
		deliveryFailure: null,
		...input,
	};
}

/**
 * Creates a versioned workspace security policy.
 *
 * @param {string} id Policy identifier.
 * @param {string} label Policy label.
 * @param {string} description Policy explanation.
 * @param {boolean} enabled Initial value.
 * @param {string} tone Semantic tone.
 * @returns {Record<string, unknown>} Stored policy.
 */
function createPolicy(id, label, description, enabled, tone) {
	return { id, version: 1, label, description, enabled, tone, lastChangedAt: null, lastReceipt: null };
}

/**
 * Creates an audit event with a stable event identifier.
 *
 * @param {string} actor Event actor.
 * @param {string} action Event action.
 * @param {string} detail Event detail.
 * @param {string} time Display time.
 * @param {string} tone Semantic tone.
 * @returns {Record<string, string>} Audit event.
 */
function createEvent(actor, action, detail, time, tone) {
	eventSequence += 1;
	return { id: `access-event-${eventSequence}`, actor, action, detail, time, tone };
}

/**
 * Adds a current audit event to the front of the workspace timeline.
 *
 * @param {string} actor Event actor.
 * @param {string} action Event action.
 * @param {string} detail Event detail.
 * @param {string} tone Semantic tone.
 * @returns {void}
 */
function appendEvent(actor, action, detail, tone) {
	state.events.unshift(createEvent(actor, action, detail, 'Just now', tone));
}

/**
 * Advances the authoritative workspace revision.
 *
 * @returns {void}
 */
function touchWorkspace() {
	workspaceSequence += 1;
	state.workspaceRevision = workspaceSequence;
}

/**
 * Returns the complete serializable workspace bootstrap payload.
 *
 * @returns {Record<string, unknown>} Serialized workspace.
 */
function serializeWorkspace() {
	return {
		workspaceRevision: state.workspaceRevision,
		workspace: cloneValue(state.workspace),
		catalogs: cloneValue(catalogs),
		summary: createSummary(),
		members: state.members.map(serializeMemberSummary).sort(sortMembers),
		invites: cloneValue(state.invites),
		policies: cloneValue(state.policies),
		events: cloneValue(state.events.slice(0, 16)),
		selectedMemberId: state.workspace.currentMemberId,
	};
}

/**
 * Creates summary counts from authoritative member and invitation state.
 *
 * @returns {Record<string, number>} Workspace access summary.
 */
function createSummary() {
	return {
		active: state.members.filter((member) => member.status === 'active').length,
		paidSeats: paidSeatCommitment(),
		seatLimit: state.workspace.seatLimit,
		pendingInvites: state.invites.filter((invite) => invite.status === 'pending').length,
		needsReview: state.members.filter((member) => memberRisks(member).length).length + state.invites.filter((invite) => invite.status === 'failed').length,
		suspended: state.members.filter((member) => member.status === 'suspended').length,
	};
}

/**
 * Returns a compact member row for the people directory.
 *
 * @param {Record<string, unknown>} member Stored member.
 * @returns {Record<string, unknown>} Member summary.
 */
function serializeMemberSummary(member) {
	return cloneValue({
		id: member.id,
		version: member.version,
		name: member.name,
		initials: member.initials,
		email: member.email,
		role: member.role,
		status: member.status,
		teams: member.teams,
		title: member.title,
		lastSeenLabel: member.lastSeenLabel,
		mfaEnabled: member.mfaEnabled,
		risks: memberRisks(member),
	});
}

/**
 * Returns a detached full member record with computed risks.
 *
 * @param {Record<string, unknown>} member Stored member.
 * @returns {Record<string, unknown>} Serialized member.
 */
function serializeMember(member) {
	return cloneValue({ ...member, risks: memberRisks(member) });
}

/**
 * Creates the mutation payload shared by member operations.
 *
 * @param {Record<string, unknown>} member Updated member.
 * @returns {Record<string, unknown>} Member mutation result.
 */
function createMemberMutationResult(member) {
	return { ...serializeWorkspace(), member: serializeMember(member) };
}

/**
 * Returns visible security and inactivity risks for one member.
 *
 * @param {Record<string, unknown>} member Stored member.
 * @returns {Array<Record<string, string>>} Member risk records.
 */
function memberRisks(member) {
	const risks = [];
	if (member.status === 'active' && !member.mfaEnabled) risks.push({ id: 'mfa-missing', label: 'MFA missing', detail: 'No second factor is registered.', tone: 'danger' });
	if (member.status === 'active' && daysSince(member.lastSeenAt) >= 30) risks.push({ id: 'inactive', label: 'Inactive access', detail: `${daysSince(member.lastSeenAt)} days since the last sign-in.`, tone: 'warning' });
	if (member.status === 'suspended') risks.push({ id: 'suspended', label: 'Suspended', detail: member.suspension?.reason || 'Workspace access is disabled.', tone: 'neutral' });
	return risks;
}

/**
 * Counts active paid members and paid-role pending invitations.
 *
 * @returns {number} Committed paid seat count.
 */
function paidSeatCommitment() {
	const members = state.members.filter((member) => member.status === 'active' && usesPaidSeat(member.role)).length;
	const invites = state.invites.filter((invite) => invite.status === 'pending' && usesPaidSeat(invite.role)).length;
	return members + invites;
}

/**
 * Validates the workspace revision for workspace-wide mutations.
 *
 * @param {Record<string, unknown>} input Mutation payload.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateWorkspaceMutation(input) {
	if (Number(input.workspaceRevision) === state.workspaceRevision) return null;
	return { error: 'This people directory changed in another view. Reload it before continuing.', status: 409, conflict: true };
}

/**
 * Validates workspace and member versions for member mutations.
 *
 * @param {Record<string, unknown>} member Stored member.
 * @param {Record<string, unknown>} input Mutation payload.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateMemberMutation(member, input) {
	const workspaceConflict = validateWorkspaceMutation(input);
	if (workspaceConflict) return workspaceConflict;
	if (Number(input.memberVersion) === member.version) return null;
	return { error: 'This member changed in another view. Reload the latest access record.', status: 409, conflict: true };
}

/**
 * Validates workspace and invitation versions for invite mutations.
 *
 * @param {Record<string, unknown>} invite Stored invitation.
 * @param {Record<string, unknown>} input Mutation payload.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateInviteMutation(invite, input) {
	const workspaceConflict = validateWorkspaceMutation(input);
	if (workspaceConflict) return workspaceConflict;
	if (Number(input.inviteVersion) === invite.version) return null;
	return { error: 'This invitation changed in another view. Reload before continuing.', status: 409, conflict: true };
}

/**
 * Validates workspace and policy versions for policy mutations.
 *
 * @param {Record<string, unknown>} policy Stored policy.
 * @param {Record<string, unknown>} input Mutation payload.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validatePolicyMutation(policy, input) {
	const workspaceConflict = validateWorkspaceMutation(input);
	if (workspaceConflict) return workspaceConflict;
	if (Number(input.policyVersion) === policy.version) return null;
	return { error: 'This access policy changed in another view. Reload before continuing.', status: 409, conflict: true };
}

/**
 * Returns a standard field-addressable validation response.
 *
 * @param {Record<string, Array<string>>} fieldErrors Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validationError(fieldErrors) {
	return { error: Object.values(fieldErrors)[0]?.[0] || 'Review the highlighted fields.', status: 422, fieldErrors };
}

/**
 * Creates provider-style immutable proof for one completed action.
 *
 * @param {string} event Receipt event.
 * @param {string} subjectId Subject identifier.
 * @returns {Record<string, string>} Provider receipt.
 */
function createReceipt(event, subjectId) {
	receiptSequence += 1;
	return { id: `receipt-access-${receiptSequence}`, event, subjectId, provider: 'Northstar Access API', createdAt: new Date().toISOString() };
}

/**
 * Finds a workspace member by identifier.
 *
 * @param {unknown} memberId Candidate member identifier.
 * @returns {Record<string, unknown>|null} Member or null.
 */
function findMember(memberId) {
	return state.members.find((member) => member.id === String(memberId || '')) || null;
}

/**
 * Finds an invitation by identifier.
 *
 * @param {unknown} inviteId Candidate invitation identifier.
 * @returns {Record<string, unknown>|null} Invitation or null.
 */
function findInvite(inviteId) {
	return state.invites.find((invite) => invite.id === String(inviteId || '')) || null;
}

/**
 * Returns whether a role can be chosen in standard administration flows.
 *
 * @param {string} role Role identifier.
 * @returns {boolean} True when the role is selectable.
 */
function selectableRole(role) {
	return catalogs.roles.some((option) => option.value === role && option.selectable);
}

/**
 * Returns whether a role consumes a paid workspace seat.
 *
 * @param {string} role Role identifier.
 * @returns {boolean} True for paid seat roles.
 */
function usesPaidSeat(role) {
	return catalogs.roles.find((option) => option.value === role)?.seatKind === 'paid';
}

/**
 * Returns whether an access policy is enabled.
 *
 * @param {string} policyId Policy identifier.
 * @returns {boolean} Current policy state.
 */
function policyEnabled(policyId) {
	return state.policies.find((policy) => policy.id === policyId)?.enabled === true;
}

/**
 * Builds concise human-readable role access changes.
 *
 * @param {string} fromRole Current role.
 * @param {string} toRole Proposed role.
 * @returns {Array<string>} Access change descriptions.
 */
function roleAccessChanges(fromRole, toRole) {
	const changes = [`${roleLabel(fromRole)} access will be replaced by ${roleLabel(toRole)} access.`];
	if (toRole === 'admin') changes.push('Member management and routine workspace settings will become available.');
	if (toRole === 'guest') changes.push('Workspace-wide views will be removed; only the assigned team remains visible.');
	if (toRole === 'billing') changes.push('Product access will be removed while invoices and payment settings remain available.');
	if (fromRole === 'admin' && toRole !== 'admin') changes.push('Existing administrator permissions will be revoked immediately.');
	return changes;
}

/**
 * Resolves a role label.
 *
 * @param {string} role Role identifier.
 * @returns {string} Role label.
 */
function roleLabel(role) {
	return catalogs.roles.find((option) => option.value === role)?.label || role;
}

/**
 * Resolves a team label.
 *
 * @param {string} teamId Team identifier.
 * @returns {string} Team label.
 */
function teamLabel(teamId) {
	return catalogs.teams.find((option) => option.value === teamId)?.label || teamId;
}

/**
 * Sorts owners, review risks, and active members before suspended people.
 *
 * @param {Record<string, unknown>} first First member.
 * @param {Record<string, unknown>} second Second member.
 * @returns {number} Sort position.
 */
function sortMembers(first, second) {
	if (first.role === 'owner' && second.role !== 'owner') return -1;
	if (second.role === 'owner' && first.role !== 'owner') return 1;
	if (first.status === 'suspended' && second.status !== 'suspended') return 1;
	if (second.status === 'suspended' && first.status !== 'suspended') return -1;
	if (Boolean(first.risks.length) !== Boolean(second.risks.length)) return first.risks.length ? -1 : 1;
	return first.name.localeCompare(second.name);
}

/**
 * Returns the number of whole days since an ISO timestamp.
 *
 * @param {string} isoDate ISO date value.
 * @returns {number} Elapsed days.
 */
function daysSince(isoDate) {
	return Math.max(0, Math.floor((new Date('2026-08-02T12:00:00.000Z').getTime() - new Date(isoDate).getTime()) / 86400000));
}

/**
 * Returns the lower-case email address without surrounding space.
 *
 * @param {unknown} value Candidate email.
 * @returns {string} Normalized email.
 */
function normalizeEmail(value) {
	return String(value || '').trim().toLowerCase();
}

/**
 * Returns the domain portion of an email address.
 *
 * @param {string} email Email address.
 * @returns {string} Email domain.
 */
function emailDomain(email) {
	return String(email || '').split('@')[1] || '';
}

/**
 * Returns whether an email uses a common personal provider.
 *
 * @param {string} email Email address.
 * @returns {boolean} True for a blocked personal domain.
 */
function isPersonalEmail(email) {
	return ['gmail.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com'].includes(emailDomain(email));
}

/**
 * Normalizes short administrator-authored text.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

/**
 * Returns a date advanced by the supplied day count.
 *
 * @param {Date} date Source date.
 * @param {number} days Day count.
 * @returns {Date} Advanced date.
 */
function addDays(date, days) {
	return new Date(date.getTime() + Number(days || 0) * 86400000);
}

/**
 * Escapes one value for a standards-compatible CSV cell.
 *
 * @param {unknown} value Cell value.
 * @returns {string} Escaped CSV cell.
 */
function csvValue(value) {
	const text = String(value ?? '');
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Creates a detached JSON-compatible value.
 *
 * @template T
 * @param {T} value Source value.
 * @returns {T} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
