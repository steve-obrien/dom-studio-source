const audienceOptions = [
	{ value: 'all-workspaces', label: 'All workspaces', description: 'Every active customer workspace' },
	{ value: 'scale-enterprise', label: 'Scale and Enterprise', description: 'Paid plans with automation access' },
	{ value: 'developers', label: 'Developers', description: 'API users and technical administrators' },
	{ value: 'beta-customers', label: 'Beta customers', description: 'Workspaces enrolled in early access' },
];

const reviewerOptions = [
	{ value: 'mina', label: 'Mina Cook', description: 'Product marketing', initials: 'MC' },
	{ value: 'ravi', label: 'Ravi Singh', description: 'Lifecycle marketing', initials: 'RS' },
	{ value: 'nora', label: 'Nora Allen', description: 'Developer relations', initials: 'NA' },
	{ value: 'theo', label: 'Theo Grant', description: 'Product operations', initials: 'TG' },
];

const scheduleOptions = [
	{ value: 'now', label: 'Publish immediately', description: 'Dispatch after final approval' },
	{ value: 'monday-1000', label: 'Monday at 10:00', description: 'Aug 03, 2026 · Europe/London' },
	{ value: 'tuesday-1400', label: 'Tuesday at 14:00', description: 'Aug 04, 2026 · Europe/London' },
	{ value: 'next-deploy', label: 'After the next deploy', description: 'Wait for the production release event' },
];

const channelCatalog = [
	{ id: 'in_app', label: 'In-app feed', description: 'Product updates feed and workspace home', owner: 'Product marketing' },
	{ id: 'email', label: 'Lifecycle email', description: 'Admins in the selected audience', owner: 'Lifecycle' },
	{ id: 'public', label: 'Public changelog', description: 'Searchable public release page', owner: 'Docs' },
	{ id: 'community', label: 'Community digest', description: 'Community and partner digest queue', owner: 'Community' },
];

const releases = new Map([
	createRelease({
		id: 'workflow',
		version: '2026.08.1',
		internalTitle: 'Workflow automation GA',
		status: 'draft',
		releaseDate: 'Aug 03, 2026',
		headline: 'Workflow automation is now generally available',
		summary: 'Create approval paths, escalation rules, and follow-up tasks without writing scripts.',
		audience: 'scale-enterprise',
		reviewerId: 'mina',
		schedule: 'monday-1000',
		approvalRequired: true,
		channels: { in_app: true, email: true, public: true, community: false },
		notes: [
			{ id: 'builder', type: 'Feature', title: 'Visual automation builder', detail: 'Connect triggers, approvals, waits, and handoff tasks from one canvas.', included: true },
			{ id: 'templates', type: 'Template', title: 'Approval and handoff templates', detail: 'Start from policy review, launch checklist, access request, and renewal save-plan templates.', included: true },
			{ id: 'audit', type: 'Admin', title: 'Run history with audit events', detail: 'Every automation run records actor, changed records, duration, and retry state.', included: false },
		],
		activity: [
			{ id: 'workflow-3', actor: 'Mina Cook', action: 'Updated the in-app summary', detail: 'Copy now leads with the customer benefit.', time: 'Today at 14:30' },
			{ id: 'workflow-2', actor: 'Ravi Singh', action: 'Linked the support enablement note', detail: 'Frontline guidance is ready for review.', time: 'Today at 12:10' },
			{ id: 'workflow-1', actor: 'Elena Brooks', action: 'Created the release draft', detail: 'Imported three shipped items from release 2026.08.1.', time: 'Yesterday' },
		],
	}),
	createRelease({
		id: 'mobile',
		version: '2026.08.0',
		internalTitle: 'Mobile task inbox refresh',
		status: 'scheduled',
		releaseDate: 'Aug 04, 2026',
		headline: 'A faster way to clear your mobile task inbox',
		summary: 'Triage, snooze, and complete work from the task list, with updates queued safely when your connection drops.',
		audience: 'all-workspaces',
		reviewerId: 'ravi',
		schedule: 'tuesday-1400',
		approvalRequired: true,
		channels: { in_app: true, email: true, public: true, community: true },
		notes: [
			{ id: 'swipe', type: 'Mobile', title: 'Swipe actions for triage', detail: 'Complete, snooze, and reassign without opening task detail.', included: true },
			{ id: 'offline', type: 'Reliability', title: 'Offline queue for updates', detail: 'Edits sync automatically when a device reconnects.', included: true },
			{ id: 'badges', type: 'Polish', title: 'Clearer priority and due-date badges', detail: 'Compact badges make urgency easier to scan.', included: true },
		],
		approval: { reviewerId: 'ravi', reviewerName: 'Ravi Singh', approvedAt: 'Today at 09:32' },
		publication: {
			id: 'publication_mobile_2804',
			status: 'scheduled',
			statusLabel: 'Scheduled for Aug 04 at 14:00',
			createdAt: 'Today at 09:45',
			dispatches: [
				{ channelId: 'in_app', label: 'In-app feed', state: 'Queued' },
				{ channelId: 'email', label: 'Lifecycle email', state: 'Queued' },
				{ channelId: 'public', label: 'Public changelog', state: 'Queued' },
				{ channelId: 'community', label: 'Community digest', state: 'Queued' },
			],
		},
		activity: [
			{ id: 'mobile-3', actor: 'Ravi Singh', action: 'Scheduled four channel deliveries', detail: 'Dispatch begins Tuesday at 14:00.', time: 'Today at 09:45' },
			{ id: 'mobile-2', actor: 'Ravi Singh', action: 'Approved the release', detail: 'Audience, copy, and channel previews approved.', time: 'Today at 09:32' },
			{ id: 'mobile-1', actor: 'Nora Allen', action: 'Added mobile release notes', detail: 'Three shipped items selected.', time: 'Yesterday' },
		],
	}),
	createRelease({
		id: 'api',
		version: '2026-08',
		internalTitle: 'API version 2026-08',
		status: 'in-review',
		releaseDate: 'Aug 06, 2026',
		headline: 'API version 2026-08 introduces cursor pagination',
		summary: 'List endpoints now return cursor metadata, with a migration guide and replay tools for webhook delivery attempts.',
		audience: 'developers',
		reviewerId: 'nora',
		schedule: 'next-deploy',
		approvalRequired: true,
		channels: { in_app: true, email: false, public: true, community: true },
		notes: [
			{ id: 'pagination', type: 'Breaking change', title: 'Cursor pagination is required', detail: 'List endpoints return cursor metadata instead of page offsets.', included: true },
			{ id: 'webhook', type: 'Developer', title: 'Webhook replay endpoint', detail: 'Replay delivery attempts from the dashboard or API.', included: true },
			{ id: 'docs', type: 'Docs', title: 'Migration guide and SDK examples', detail: 'Examples cover pagination and webhook replay.', included: true },
		],
		reviewRequestedAt: 'Today at 11:20',
		activity: [
			{ id: 'api-3', actor: 'Nora Allen', action: 'Review requested', detail: 'Breaking-change checks passed.', time: 'Today at 11:20' },
			{ id: 'api-2', actor: 'Theo Grant', action: 'Added the breaking-change warning', detail: 'Public changelog delivery is required.', time: 'Today at 10:05' },
			{ id: 'api-1', actor: 'Mina Cook', action: 'Created the announcement draft', detail: 'Imported API release 2026-08.', time: 'Jul 30' },
		],
	}),
	createRelease({
		id: 'filters',
		version: '2026.07.5',
		internalTitle: 'Saved filters',
		status: 'published',
		releaseDate: 'Jul 29, 2026',
		headline: 'Save the views your team uses every day',
		summary: 'Pin shared filters to a workspace so everyone can return to the same focused view in one click.',
		audience: 'all-workspaces',
		reviewerId: 'theo',
		schedule: 'now',
		approvalRequired: true,
		channels: { in_app: true, email: false, public: true, community: false },
		notes: [
			{ id: 'shared', type: 'Feature', title: 'Workspace saved filters', detail: 'Save, name, and share a filter with the whole workspace.', included: true },
			{ id: 'pin', type: 'Polish', title: 'Pinned views', detail: 'Keep the most useful filters at the top of navigation.', included: true },
		],
		approval: { reviewerId: 'theo', reviewerName: 'Theo Grant', approvedAt: 'Jul 29 at 10:10' },
		publication: {
			id: 'publication_filters_2729',
			status: 'published',
			statusLabel: 'Published Jul 29 at 11:00',
			createdAt: 'Jul 29 at 11:00',
			publicUrl: '/changelog/saved-filters',
			dispatches: [
				{ channelId: 'in_app', label: 'In-app feed', state: 'Delivered' },
				{ channelId: 'public', label: 'Public changelog', state: 'Live' },
			],
		},
		activity: [
			{ id: 'filters-3', actor: 'System', action: 'Published two channel deliveries', detail: 'Public page and in-app entry are live.', time: 'Jul 29 at 11:00' },
			{ id: 'filters-2', actor: 'Theo Grant', action: 'Approved the release', detail: 'Copy and targeting approved.', time: 'Jul 29 at 10:10' },
			{ id: 'filters-1', actor: 'Mina Cook', action: 'Requested review', detail: 'Two release notes selected.', time: 'Jul 29 at 09:48' },
		],
	}),
].map((release) => [release.id, release]));

let activitySequence = 0;
let publicationSequence = 7310;

/**
 * Lists changelog releases available to the publisher example.
 *
 * @returns {Array<object>} Release summaries for navigation and rich selection.
 */
export function listChangelogReleases() {
	return [...releases.values()].map(serializeReleaseSummary);
}

/**
 * Returns one changelog release with draft, previews, readiness, and history.
 *
 * @param {string} releaseId Release identifier.
 * @returns {{ release?: object, error?: string, status?: number }} Release result.
 */
export function getChangelogRelease(releaseId) {
	const release = findRelease(releaseId);
	if (!release) return { error: 'Changelog release not found.', status: 404 };
	return { release: serializeRelease(release) };
}

/**
 * Validates and saves the editable changelog draft.
 *
 * @param {string} releaseId Release identifier.
 * @param {Record<string, unknown>} input Draft mutation payload.
 * @returns {{ release?: object, error?: string, status?: number }} Updated release or API error.
 */
export function updateChangelogDraft(releaseId, input = {}) {
	const release = findRelease(releaseId);
	if (!release) return { error: 'Changelog release not found.', status: 404 };
	if (isLocked(release)) return { error: 'Scheduled and published releases are locked. Duplicate the release to make another announcement.', status: 409 };
	const revisionError = validateRevision(release, input.revision);
	if (revisionError) return revisionError;
	const draft = normalizeDraft(release, input);
	if (draft.error) return draft;

	const changedAfterReview = release.status === 'in-review' || release.status === 'approved';
	Object.assign(release, draft.value);
	if (changedAfterReview) {
		release.status = 'draft';
		release.approval = null;
		release.reviewRequestedAt = null;
	}
	release.revision += 1;
	release.activity.unshift(createActivity('Mina Cook', changedAfterReview ? 'Updated the draft and reset approval' : 'Saved the release draft', `${includedNotes(release).length} release notes · ${enabledChannels(release).length} channels`));
	return { release: serializeRelease(release) };
}

/**
 * Requests review after server-owned publishing checks pass.
 *
 * @param {string} releaseId Release identifier.
 * @param {Record<string, unknown>} input Review request payload.
 * @returns {{ release?: object, error?: string, blockers?: Array<object>, status?: number }} Updated release or blocking checks.
 */
export function requestChangelogReview(releaseId, input = {}) {
	const release = findRelease(releaseId);
	if (!release) return { error: 'Changelog release not found.', status: 404 };
	if (release.status !== 'draft') return { error: 'Only draft releases can be sent for review.', status: 409 };
	const revisionError = validateRevision(release, input.revision);
	if (revisionError) return revisionError;
	const blockers = buildReadinessChecks(release).filter(isBlockingCheck);
	if (blockers.length) return { error: 'Resolve the publish checks before requesting review.', blockers, status: 422 };

	release.status = release.approvalRequired ? 'in-review' : 'approved';
	release.reviewRequestedAt = 'Just now';
	if (!release.approvalRequired) release.approval = { reviewerId: 'system', reviewerName: 'Automatic policy', approvedAt: 'Just now' };
	release.revision += 1;
	release.activity.unshift(createActivity('Mina Cook', release.approvalRequired ? 'Requested release review' : 'Completed automatic review', `${reviewerLabel(release.reviewerId)} will verify ${enabledChannels(release).length} channel previews.`));
	return { release: serializeRelease(release) };
}

/**
 * Approves a release for its assigned reviewer.
 *
 * @param {string} releaseId Release identifier.
 * @param {Record<string, unknown>} input Approval payload.
 * @returns {{ release?: object, error?: string, status?: number }} Approved release or API error.
 */
export function approveChangelogRelease(releaseId, input = {}) {
	const release = findRelease(releaseId);
	if (!release) return { error: 'Changelog release not found.', status: 404 };
	if (release.status !== 'in-review') return { error: 'This release is not waiting for review.', status: 409 };
	const revisionError = validateRevision(release, input.revision);
	if (revisionError) return revisionError;
	const reviewerId = String(input.reviewerId || '');
	if (reviewerId !== release.reviewerId) return { error: 'Only the assigned reviewer can approve this release.', status: 403 };

	const reviewer = reviewerById(reviewerId);
	release.status = 'approved';
	release.approval = { reviewerId, reviewerName: reviewer.label, approvedAt: 'Just now' };
	release.revision += 1;
	release.activity.unshift(createActivity(reviewer.label, 'Approved the release', 'Copy, targeting, schedule, and channel previews approved.'));
	return { release: serializeRelease(release) };
}

/**
 * Schedules or immediately publishes an approved release.
 *
 * @param {string} releaseId Release identifier.
 * @param {Record<string, unknown>} input Publication payload.
 * @returns {{ release?: object, publication?: object, error?: string, blockers?: Array<object>, status?: number }} Publication result.
 */
export function publishChangelogRelease(releaseId, input = {}) {
	const release = findRelease(releaseId);
	if (!release) return { error: 'Changelog release not found.', status: 404 };
	if (release.status !== 'approved') return { error: 'Approve this release before scheduling publication.', status: 409 };
	const revisionError = validateRevision(release, input.revision);
	if (revisionError) return revisionError;
	const blockers = buildReadinessChecks(release).filter(isBlockingCheck);
	if (blockers.length) return { error: 'Publishing checks changed. Resolve them before continuing.', blockers, status: 422 };

	publicationSequence += 1;
	const immediate = release.schedule === 'now';
	const publication = {
		id: `publication_${release.id}_${publicationSequence}`,
		status: immediate ? 'published' : 'scheduled',
		statusLabel: immediate ? 'Published just now' : `Scheduled for ${scheduleLabel(release.schedule)}`,
		createdAt: 'Just now',
		publicUrl: release.channels.public && immediate ? `/changelog/${release.id}` : '',
		dispatches: enabledChannels(release).map((channel) => ({
			channelId: channel.id,
			label: channel.label,
			state: immediate ? publishedChannelState(channel.id) : 'Queued',
		})),
	};
	release.status = publication.status;
	release.publication = publication;
	release.revision += 1;
	release.activity.unshift(createActivity('Mina Cook', immediate ? `Published ${publication.dispatches.length} channel deliveries` : `Scheduled ${publication.dispatches.length} channel deliveries`, publication.statusLabel));
	return { release: serializeRelease(release), publication: clone(publication) };
}

/**
 * Adds mutable workflow metadata to a release seed.
 *
 * @param {object} seed Release seed.
 * @returns {object} Mutable stored release.
 */
function createRelease(seed) {
	return {
		revision: 12,
		reviewRequestedAt: null,
		approval: null,
		publication: null,
		...clone(seed),
	};
}

/**
 * Finds one release by arbitrary identifier.
 *
 * @param {string} releaseId Release identifier.
 * @returns {object|null} Stored release or null.
 */
function findRelease(releaseId) {
	return releases.get(String(releaseId || '')) || null;
}

/**
 * Checks whether a release can no longer be edited.
 *
 * @param {object} release Stored release.
 * @returns {boolean} True when the release is scheduled or published.
 */
function isLocked(release) {
	return release.status === 'scheduled' || release.status === 'published';
}

/**
 * Enforces optimistic revision matching for mutations.
 *
 * @param {object} release Stored release.
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Conflict response or null.
 */
function validateRevision(release, revision) {
	if (revision === undefined || revision === null) return { error: 'Release revision is required.', status: 400 };
	if (Number(revision) === release.revision) return null;
	return { error: 'This release changed in another session. Reload before continuing.', status: 409 };
}

/**
 * Normalizes the complete editable draft payload.
 *
 * @param {object} release Stored release.
 * @param {Record<string, unknown>} input Draft payload.
 * @returns {{ value?: object, error?: string, status?: number }} Normalized draft or API error.
 */
function normalizeDraft(release, input) {
	const headline = String(input.headline || '').trim();
	if (headline.length > 100) return { error: 'Headline must be 100 characters or fewer.', status: 400 };
	const summary = String(input.summary || '').trim();
	if (summary.length > 320) return { error: 'Summary must be 320 characters or fewer.', status: 400 };
	const audience = String(input.audience || '');
	if (!audienceOptions.some((option) => option.value === audience)) return { error: 'Choose a supported audience.', status: 400 };
	const reviewerId = String(input.reviewerId || '');
	if (!reviewerOptions.some((option) => option.value === reviewerId)) return { error: 'Choose a supported reviewer.', status: 400 };
	const schedule = String(input.schedule || '');
	if (!scheduleOptions.some((option) => option.value === schedule)) return { error: 'Choose a supported publication schedule.', status: 400 };
	const includedNoteIds = Array.isArray(input.includedNoteIds) ? [...new Set(input.includedNoteIds.map(String))] : [];
	if (includedNoteIds.some((noteId) => !release.notes.some((note) => note.id === noteId))) return { error: 'One or more selected release notes do not exist.', status: 400 };
	const channels = normalizeChannels(input.channels);
	if (!channels) return { error: 'Channel selection must include every supported delivery channel.', status: 400 };

	return {
		value: {
			headline,
			summary,
			audience,
			reviewerId,
			schedule,
			approvalRequired: Boolean(input.approvalRequired),
			channels,
			notes: release.notes.map((note) => ({ ...note, included: includedNoteIds.includes(note.id) })),
		},
	};
}

/**
 * Normalizes a complete channel selection record.
 *
 * @param {unknown} input Candidate channel record.
 * @returns {Record<string, boolean>|null} Normalized channels or null.
 */
function normalizeChannels(input) {
	if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
	const channels = {};
	for (const channel of channelCatalog) channels[channel.id] = Boolean(input[channel.id]);
	return channels;
}

/**
 * Builds server-owned readiness checks for review and publication.
 *
 * @param {object} release Stored release.
 * @returns {Array<{ key: string, label: string, detail: string, passed: boolean }>} Readiness checks.
 */
function buildReadinessChecks(release) {
	const notes = includedNotes(release);
	const channels = enabledChannels(release);
	const breakingChange = notes.some((note) => note.type === 'Breaking change');
	const docsIncluded = notes.some((note) => note.type === 'Docs');
	const publicEnabled = Boolean(release.channels.public);
	return [
		{ key: 'copy', label: 'Customer copy is complete', detail: release.headline.length >= 12 && release.summary.length >= 40 ? 'Headline and summary meet publishing guidance' : 'Add a clear headline and a summary of at least 40 characters', passed: release.headline.length >= 12 && release.summary.length >= 40 },
		{ key: 'notes', label: 'Release notes are selected', detail: `${notes.length} customer-facing ${notes.length === 1 ? 'note' : 'notes'} selected`, passed: notes.length >= 2 },
		{ key: 'audience', label: 'Audience is explicit', detail: audienceLabel(release.audience), passed: Boolean(release.audience) },
		{ key: 'channels', label: 'Delivery channels are selected', detail: `${channels.length} ${channels.length === 1 ? 'channel' : 'channels'} enabled`, passed: channels.length > 0 },
		{ key: 'schedule', label: 'Publication timing is set', detail: scheduleLabel(release.schedule), passed: Boolean(release.schedule) },
		{ key: 'breaking', label: 'Breaking-change safeguards', detail: breakingChange ? (publicEnabled && docsIncluded ? 'Public notice and migration guidance included' : 'Breaking changes require a public notice and migration guide') : 'No breaking changes selected', passed: !breakingChange || (publicEnabled && docsIncluded) },
	];
}

/**
 * Returns whether a readiness check blocks progression.
 *
 * @param {{ passed: boolean }} check Readiness check.
 * @returns {boolean} True when the check is incomplete.
 */
function isBlockingCheck(check) {
	return !check.passed;
}

/**
 * Returns the included notes for a release.
 *
 * @param {object} release Stored release.
 * @returns {Array<object>} Included notes.
 */
function includedNotes(release) {
	return release.notes.filter((note) => note.included);
}

/**
 * Returns the enabled channel definitions for a release.
 *
 * @param {object} release Stored release.
 * @returns {Array<object>} Enabled channels.
 */
function enabledChannels(release) {
	return channelCatalog.filter((channel) => release.channels[channel.id]);
}

/**
 * Builds channel-specific previews from the stored structured release.
 *
 * @param {object} release Stored release.
 * @returns {Array<object>} Channel preview records.
 */
function buildPreviews(release) {
	const notes = includedNotes(release).map((note) => ({ id: note.id, type: note.type, title: note.title, detail: note.detail }));
	return [
		{
			id: 'in_app',
			label: 'In-app feed',
			enabled: release.channels.in_app,
			eyebrow: 'Product update',
			headline: release.headline,
			body: release.summary,
			cta: 'See what changed',
			notes,
		},
		{
			id: 'email',
			label: 'Lifecycle email',
			enabled: release.channels.email,
			eyebrow: `For ${audienceLabel(release.audience)}`,
			headline: release.headline,
			body: `${release.summary} Here is what changed and how your team can start using it.`,
			cta: 'Open your workspace',
			notes,
		},
		{
			id: 'public',
			label: 'Public changelog',
			enabled: release.channels.public,
			eyebrow: `${release.releaseDate} · ${release.version}`,
			headline: release.headline,
			body: release.summary,
			cta: 'Read the documentation',
			notes,
		},
	];
}

/**
 * Serializes the complete release workflow for the client.
 *
 * @param {object} release Stored release.
 * @returns {object} Client-safe release workflow.
 */
function serializeRelease(release) {
	const checks = buildReadinessChecks(release);
	const completedChecks = checks.filter((check) => check.passed).length;
	return {
		id: release.id,
		version: release.version,
		internalTitle: release.internalTitle,
		status: release.status,
		statusLabel: statusLabel(release.status),
		statusTone: statusTone(release.status),
		releaseDate: release.releaseDate,
		revision: release.revision,
		headline: release.headline,
		summary: release.summary,
		audience: release.audience,
		audienceLabel: audienceLabel(release.audience),
		reviewerId: release.reviewerId,
		reviewer: clone(reviewerById(release.reviewerId)),
		schedule: release.schedule,
		scheduleLabel: scheduleLabel(release.schedule),
		approvalRequired: release.approvalRequired,
		channels: clone(release.channels),
		channelCatalog: clone(channelCatalog),
		notes: clone(release.notes),
		checks,
		readiness: Math.round((completedChecks / checks.length) * 100),
		reviewRequestedAt: release.reviewRequestedAt,
		approval: clone(release.approval),
		publication: clone(release.publication),
		activity: clone(release.activity),
		previews: buildPreviews(release),
		options: {
			audiences: clone(audienceOptions),
			reviewers: clone(reviewerOptions),
			schedules: clone(scheduleOptions),
		},
	};
}

/**
 * Serializes a compact release summary for navigation.
 *
 * @param {object} release Stored release.
 * @returns {object} Release summary.
 */
function serializeReleaseSummary(release) {
	const checks = buildReadinessChecks(release);
	const completedChecks = checks.filter((check) => check.passed).length;
	return {
		id: release.id,
		version: release.version,
		internalTitle: release.internalTitle,
		status: release.status,
		statusLabel: statusLabel(release.status),
		statusTone: statusTone(release.status),
		releaseDate: release.releaseDate,
		audienceLabel: audienceLabel(release.audience),
		readiness: Math.round((completedChecks / checks.length) * 100),
	};
}

/**
 * Returns the display label for a release status.
 *
 * @param {string} status Release status.
 * @returns {string} Human-readable status.
 */
function statusLabel(status) {
	if (status === 'in-review') return 'In review';
	if (status === 'approved') return 'Approved';
	if (status === 'scheduled') return 'Scheduled';
	if (status === 'published') return 'Published';
	return 'Draft';
}

/**
 * Returns the semantic tone for a release status.
 *
 * @param {string} status Release status.
 * @returns {string} DOM Studio status tone.
 */
function statusTone(status) {
	if (status === 'published' || status === 'scheduled' || status === 'approved') return 'success';
	if (status === 'in-review') return 'info';
	return 'warning';
}

/**
 * Returns an audience label from its identifier.
 *
 * @param {string} audience Audience identifier.
 * @returns {string} Audience label.
 */
function audienceLabel(audience) {
	return audienceOptions.find((option) => option.value === audience)?.label || 'Audience not selected';
}

/**
 * Returns a reviewer record from its identifier.
 *
 * @param {string} reviewerId Reviewer identifier.
 * @returns {object} Reviewer option.
 */
function reviewerById(reviewerId) {
	return reviewerOptions.find((option) => option.value === reviewerId) || reviewerOptions[0];
}

/**
 * Returns a reviewer label from its identifier.
 *
 * @param {string} reviewerId Reviewer identifier.
 * @returns {string} Reviewer label.
 */
function reviewerLabel(reviewerId) {
	return reviewerById(reviewerId).label;
}

/**
 * Returns the scheduling label for a stored schedule option.
 *
 * @param {string} schedule Schedule identifier.
 * @returns {string} Schedule label.
 */
function scheduleLabel(schedule) {
	return scheduleOptions.find((option) => option.value === schedule)?.label || 'Schedule not selected';
}

/**
 * Returns the terminal state used for an immediately published channel.
 *
 * @param {string} channelId Channel identifier.
 * @returns {string} Delivery state.
 */
function publishedChannelState(channelId) {
	if (channelId === 'public') return 'Live';
	if (channelId === 'email') return 'Sending';
	return 'Delivered';
}

/**
 * Creates a deterministic activity entry for the demo workflow.
 *
 * @param {string} actor Activity actor.
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {object} Activity record.
 */
function createActivity(actor, action, detail) {
	activitySequence += 1;
	return { id: `activity-${activitySequence}`, actor, action, detail, time: 'Just now' };
}

/**
 * Clones JSON-compatible demo data before returning it to callers.
 *
 * @param {unknown} value Source value.
 * @returns {any} Deep clone.
 */
function clone(value) {
	if (value === null || value === undefined) return value;
	return JSON.parse(JSON.stringify(value));
}
