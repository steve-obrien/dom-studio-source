import { createHash } from 'node:crypto';

const teamSizeOptions = Object.freeze([
	{ value: '1_10', label: '1-10 people', description: 'A small team establishing its first shared workflow.' },
	{ value: '11_50', label: '11-50 people', description: 'A growing team coordinating several product streams.' },
	{ value: '51_250', label: '51-250 people', description: 'Multiple teams with structured ownership and reporting.' },
	{ value: '251_plus', label: '251+ people', description: 'An organization with advanced administration needs.' },
]);

const regionOptions = Object.freeze([
	{ value: 'eu_west', label: 'Europe', description: 'Data hosted in Dublin, Ireland.' },
	{ value: 'us_east', label: 'United States', description: 'Data hosted in Virginia, USA.' },
	{ value: 'ap_southeast', label: 'Asia Pacific', description: 'Data hosted in Singapore.' },
]);

const roleOptions = Object.freeze([
	{ value: 'product', label: 'Product', description: 'Planning, discovery, and delivery workflows.' },
	{ value: 'engineering', label: 'Engineering', description: 'Technical delivery, incidents, and platform work.' },
	{ value: 'design', label: 'Design', description: 'Research, critique, and design operations.' },
	{ value: 'operations', label: 'Operations', description: 'Cross-functional programs and repeatable processes.' },
	{ value: 'leadership', label: 'Leadership', description: 'Portfolio visibility, goals, and decision support.' },
]);

const invitationRoleOptions = Object.freeze([
	{ value: 'admin', label: 'Admin', description: 'Manage members, settings, and workspace access.' },
	{ value: 'member', label: 'Member', description: 'Create, edit, and collaborate across the workspace.' },
	{ value: 'viewer', label: 'Viewer', description: 'Read and comment without editing workspace content.' },
]);

const goalOptions = Object.freeze([
	{ value: 'ship_faster', label: 'Ship work faster', description: 'Connect plans to delivery and remove status chasing.' },
	{ value: 'centralize_feedback', label: 'Centralize customer feedback', description: 'Bring research, requests, and evidence into one place.' },
	{ value: 'align_roadmap', label: 'Align teams around a roadmap', description: 'Make priorities and trade-offs visible across functions.' },
	{ value: 'automate_updates', label: 'Automate stakeholder updates', description: 'Turn live work into concise, repeatable reporting.' },
	{ value: 'measure_outcomes', label: 'Measure product outcomes', description: 'Connect initiatives with adoption and business results.' },
]);

const sourceOptions = Object.freeze([
	{ value: 'linear', label: 'Linear', description: 'Import issues, projects, teams, and active cycles.' },
	{ value: 'notion', label: 'Notion', description: 'Import pages, databases, and workspace structure.' },
	{ value: 'jira', label: 'Jira', description: 'Import projects, epics, and open issues.' },
	{ value: 'csv', label: 'CSV file', description: 'Map a spreadsheet export into projects and tasks.' },
	{ value: 'empty', label: 'Start with a clean workspace', description: 'Skip importing and create the first project manually.' },
]);

let invitationSequence = 140;
let connectionSequence = 70;
let launchSequence = 900;
let session = createInitialSession();

/**
 * Returns product context, setup choices, and the resumable onboarding session.
 *
 * @returns {Record<string, unknown>} Complete onboarding bootstrap payload.
 */
export function getOnboardingBootstrap() {
	return cloneValue({
		product: {
			name: 'Northstar',
			mark: 'N',
			description: 'A product operating system for teams that want decisions and delivery in one place.',
		},
		viewer: {
			name: 'Alex Morgan',
			email: 'alex@northstar.tools',
			initials: 'AM',
		},
		options: {
			teamSizes: teamSizeOptions,
			regions: regionOptions,
			roles: roleOptions,
			invitationRoles: invitationRoleOptions,
			goals: goalOptions,
			sources: sourceOptions,
		},
		session: serializeSession(),
	});
}

/**
 * Returns the current process-local onboarding session for reload and resume.
 *
 * @returns {Record<string, unknown>} Current onboarding session payload.
 */
export function getOnboardingSession() {
	return cloneValue({ session: serializeSession() });
}

/**
 * Validates and saves the workspace identity and data-region choices.
 *
 * @param {Record<string, unknown>} input Workspace fields and optimistic revision.
 * @returns {Record<string, unknown>} Updated session or structured API error.
 */
export function updateOnboardingWorkspace(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const name = normalizeText(input.name, 64);
	const slug = normalizeSlug(input.slug);
	const teamSize = String(input.teamSize || '');
	const region = String(input.region || '');
	const fields = [];
	if (name.length < 3) fields.push({ field: 'name', message: 'Use at least three characters.' });
	if (!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/.test(slug)) fields.push({ field: 'slug', message: 'Use 3-48 lowercase letters, numbers, or hyphens.' });
	if (!teamSizeOptions.some((option) => option.value === teamSize)) fields.push({ field: 'teamSize', message: 'Choose a team size.' });
	if (!regionOptions.some((option) => option.value === region)) fields.push({ field: 'region', message: 'Choose a data region.' });
	if (fields.length) return validation('Check the workspace details and try again.', fields);
	if (slug === 'admin' || slug === 'api') return conflict('That workspace URL is reserved. Choose another URL.', { code: 'slug_reserved' });
	session.workspace = { name, slug, teamSize, region };
	commitSession('Workspace details saved');
	return success('Workspace details saved.', { session: serializeSession() });
}

/**
 * Saves the member role and up to three activation goals.
 *
 * @param {Record<string, unknown>} input Role, goal identifiers, and optimistic revision.
 * @returns {Record<string, unknown>} Updated session or structured API error.
 */
export function updateOnboardingPersonalization(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const role = String(input.role || '');
	const goals = normalizeStringList(input.goals).filter((goal) => goalOptions.some((option) => option.value === goal));
	const fields = [];
	if (!roleOptions.some((option) => option.value === role)) fields.push({ field: 'role', message: 'Choose the closest role.' });
	if (!goals.length) fields.push({ field: 'goals', message: 'Choose at least one outcome.' });
	if (goals.length > 3) fields.push({ field: 'goals', message: 'Choose no more than three outcomes.' });
	if (fields.length) return validation('Choose a role and one to three outcomes.', fields);
	session.personalization = { role, goals };
	commitSession('Workspace experience personalized');
	return success('Your starting workspace has been personalized.', { session: serializeSession() });
}

/**
 * Creates a working demo connection or clean-workspace import decision.
 *
 * @param {Record<string, unknown>} input Source identifier and optimistic revision.
 * @returns {Record<string, unknown>} Updated session and connection proof or API error.
 */
export function connectOnboardingSource(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const sourceId = String(input.sourceId || '');
	const source = sourceOptions.find((option) => option.value === sourceId);
	if (!source) return validation('Choose a supported source before continuing.', [{ field: 'sourceId', message: 'Choose Linear, Notion, Jira, CSV, or a clean workspace.' }]);
	if (sourceId === 'jira' && input.simulateRestricted === true) {
		return validation('Jira access was not approved for the selected project.', [{ field: 'sourceId', message: 'Ask a Jira administrator to approve the connection, or choose another source.' }]);
	}
	const importedItems = {
		linear: 248,
		notion: 84,
		jira: 312,
		csv: 56,
		empty: 0,
	}[sourceId];
	const now = new Date().toISOString();
	session.connection = {
		id: `connection-${++connectionSequence}`,
		sourceId,
		label: source.label,
		status: 'ready',
		accountLabel: sourceId === 'empty' ? 'Clean workspace' : 'Northstar Product',
		importedItems,
		connectedAt: now,
	};
	commitSession(sourceId === 'empty' ? 'Clean workspace selected' : `${source.label} connected`);
	return success(sourceId === 'empty'
		? 'A clean workspace is ready for its first project.'
		: `${source.label} is connected and ${importedItems} items are ready.`, {
		session: serializeSession(),
		connection: cloneValue(session.connection),
	});
}

/**
 * Adds a pending member invitation with a scoped workspace role.
 *
 * @param {Record<string, unknown>} input Email, role, and optimistic revision.
 * @returns {Record<string, unknown>} Updated session and invitation proof or API error.
 */
export function createOnboardingInvitation(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const email = normalizeEmail(input.email);
	const role = String(input.role || 'member');
	if (!isValidEmail(email)) return validation('Enter a valid teammate email.', [{ field: 'email', message: 'Use an address such as name@company.com.' }]);
	if (!invitationRoleOptions.some((option) => option.value === role)) return validation('Choose an available invitation role.', [{ field: 'role', message: 'Choose Admin, Member, or Viewer.' }]);
	if (email === 'alex@northstar.tools' || session.invitations.some((invitation) => invitation.email === email)) {
		return conflict('That person already belongs to this setup.', { code: 'duplicate_invitation' });
	}
	const now = new Date().toISOString();
	const invitation = {
		id: `invite-${++invitationSequence}`,
		email,
		role,
		status: 'pending',
		createdAt: now,
	};
	session.invitations.push(invitation);
	commitSession(`Invitation prepared for ${email}`);
	return success(`Invitation prepared for ${email}.`, {
		session: serializeSession(),
		invitation: cloneValue(invitation),
	});
}

/**
 * Removes a pending invitation from the onboarding session.
 *
 * @param {string} invitationId Invitation identifier.
 * @param {Record<string, unknown>} input Optimistic revision.
 * @returns {Record<string, unknown>} Updated session or structured API error.
 */
export function removeOnboardingInvitation(invitationId, input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const index = session.invitations.findIndex((invitation) => invitation.id === String(invitationId || ''));
	if (index < 0) return notFound('Invitation');
	const [removed] = session.invitations.splice(index, 1);
	commitSession(`Invitation removed for ${removed.email}`);
	return success(`Invitation for ${removed.email} was removed.`, { session: serializeSession() });
}

/**
 * Activates a complete workspace and issues immutable demo launch proof.
 *
 * @param {Record<string, unknown>} input Acknowledgement and optimistic revision.
 * @returns {Record<string, unknown>} Activated session and launch receipt or API error.
 */
export function launchOnboardingWorkspace(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (session.launch) return success('This workspace is already active.', { session: serializeSession(), receipt: cloneValue(session.launch) });
	const readiness = buildReadiness();
	const missing = readiness.steps.filter((step) => step.status !== 'complete');
	if (missing.length) return validation(`Complete ${missing.map((step) => step.label.toLowerCase()).join(', ')} before launching.`, missing.map((step) => ({ field: step.id, message: step.description })));
	if (input.termsAccepted !== true) return validation('Confirm the workspace terms before launching.', [{ field: 'termsAccepted', message: 'Workspace activation requires acknowledgement.' }]);
	const launchedAt = new Date().toISOString();
	const reference = `NST-${++launchSequence}`;
	const proof = createHash('sha256').update(JSON.stringify({
		reference,
		sessionId: session.id,
		workspace: session.workspace,
		personalization: session.personalization,
		connectionId: session.connection.id,
		invitations: session.invitations.map(({ email, role }) => ({ email, role })),
		launchedAt,
	})).digest('hex');
	session.status = 'active';
	session.completedAt = launchedAt;
	session.launch = {
		id: `launch-${launchSequence}`,
		reference,
		status: 'active',
		workspaceUrl: `/workspaces/${session.workspace.slug}`,
		launchedAt,
		proof,
	};
	commitSession('Workspace launched');
	return success(`${session.workspace.name} is live.`, {
		session: serializeSession(),
		receipt: cloneValue(session.launch),
	});
}

/**
 * Creates the process-local onboarding session used by the API demonstration.
 *
 * @returns {Record<string, unknown>} Initial resumable session.
 */
function createInitialSession() {
	const now = new Date().toISOString();
	return {
		id: 'setup-2048',
		status: 'draft',
		revision: 14,
		startedAt: now,
		updatedAt: now,
		completedAt: null,
		workspace: {
			name: 'Northstar Product',
			slug: 'northstar-product',
			teamSize: '11_50',
			region: 'eu_west',
		},
		personalization: {
			role: 'product',
			goals: ['ship_faster', 'centralize_feedback'],
		},
		connection: null,
		invitations: [
			{ id: 'invite-140', email: 'maya@northstar.tools', role: 'member', status: 'pending', createdAt: now },
		],
		launch: null,
		activity: [
			{ id: 'activity-3', label: 'Personalization saved', detail: 'Product workspace · 2 outcomes', createdAt: now },
			{ id: 'activity-2', label: 'Workspace details saved', detail: 'Europe · 11-50 people', createdAt: now },
			{ id: 'activity-1', label: 'Setup started', detail: 'Alex Morgan', createdAt: now },
		],
	};
}

/**
 * Serializes session state with server-calculated readiness and next action.
 *
 * @returns {Record<string, unknown>} Public session payload.
 */
function serializeSession() {
	const readiness = buildReadiness();
	return cloneValue({
		...session,
		readiness,
		nextStep: readiness.steps.find((step) => step.status !== 'complete')?.id || 'launch',
	});
}

/**
 * Calculates step completion from persisted session state.
 *
 * @returns {{ completeCount: number, percent: number, readyToLaunch: boolean, steps: Array<Record<string, unknown>> }} Readiness summary.
 */
function buildReadiness() {
	const steps = [
		{
			id: 'workspace',
			label: 'Workspace',
			description: 'Name, URL, team size, and data region',
			status: session.workspace.name && session.workspace.slug && session.workspace.teamSize && session.workspace.region ? 'complete' : 'incomplete',
		},
		{
			id: 'personalize',
			label: 'Personalize',
			description: 'Role and one to three starting outcomes',
			status: session.personalization.role && session.personalization.goals.length ? 'complete' : 'incomplete',
		},
		{
			id: 'connect',
			label: 'Bring your work',
			description: 'Connect a source or choose a clean workspace',
			status: session.connection?.status === 'ready' ? 'complete' : 'incomplete',
		},
		{
			id: 'launch',
			label: 'Invite & launch',
			description: 'Prepare at least one teammate invitation',
			status: session.invitations.length > 0 ? 'complete' : 'incomplete',
		},
	];
	const completeCount = steps.filter((step) => step.status === 'complete').length;
	return {
		completeCount,
		percent: Math.round((completeCount / steps.length) * 100),
		readyToLaunch: completeCount === steps.length,
		steps,
	};
}

/**
 * Validates an optimistic revision against the current session revision.
 *
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response when stale.
 */
function validateRevision(revision) {
	if (Number(revision) === session.revision) return null;
	return conflict('This setup changed in another tab. Reload the latest session and try again.', {
		code: 'revision_conflict',
		session: serializeSession(),
	});
}

/**
 * Advances the revision and records a concise activity entry.
 *
 * @param {string} label Human-readable action label.
 * @returns {void}
 */
function commitSession(label) {
	session.revision += 1;
	session.updatedAt = new Date().toISOString();
	session.activity.unshift({
		id: `activity-${session.revision}`,
		label,
		detail: 'Alex Morgan',
		createdAt: session.updatedAt,
	});
	session.activity = session.activity.slice(0, 8);
}

/**
 * Normalizes a short user-entered string.
 *
 * @param {unknown} value Submitted value.
 * @param {number} maxLength Maximum retained characters.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Normalizes a workspace slug without silently changing unsupported characters.
 *
 * @param {unknown} value Submitted slug.
 * @returns {string} Trimmed lowercase slug.
 */
function normalizeSlug(value) {
	return String(value || '').trim().toLowerCase().slice(0, 48);
}

/**
 * Normalizes an email address for comparison and persistence.
 *
 * @param {unknown} value Submitted email.
 * @returns {string} Lowercase email address.
 */
function normalizeEmail(value) {
	return String(value || '').trim().toLowerCase().slice(0, 160);
}

/**
 * Normalizes a unique list of string values.
 *
 * @param {unknown} value Submitted list.
 * @returns {Array<string>} Unique strings.
 */
function normalizeStringList(value) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

/**
 * Checks whether a value resembles a deliverable email address.
 *
 * @param {string} value Normalized address.
 * @returns {boolean} Whether the address is valid enough for the demo contract.
 */
function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Creates a successful API response.
 *
 * @param {string} message Human-readable confirmation.
 * @param {Record<string, unknown>} data Response payload.
 * @returns {Record<string, unknown>} Success response.
 */
function success(message, data = {}) {
	return { ...data, message };
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Array<Record<string, string>>} fields Field errors.
 * @returns {Record<string, unknown>} Validation error response.
 */
function validation(message, fields = []) {
	return { status: 422, error: { code: 'validation_failed', message, fields } };
}

/**
 * Creates a structured conflict response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Record<string, unknown>} details Additional recovery data.
 * @returns {Record<string, unknown>} Conflict error response.
 */
function conflict(message, details = {}) {
	return { status: 409, error: { code: details.code || 'conflict', message, ...details } };
}

/**
 * Creates a structured missing-resource response.
 *
 * @param {string} label Resource label.
 * @returns {Record<string, unknown>} Not-found error response.
 */
function notFound(label) {
	return { status: 404, error: { code: 'not_found', message: `${label} was not found.` } };
}

/**
 * Produces a JSON-safe copy of process-local demo state.
 *
 * @param {unknown} value Value to clone.
 * @returns {any} JSON-safe copy.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
