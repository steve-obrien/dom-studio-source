const senderOptions = [
	{ value: 'maya', label: 'Maya from Northstar', description: 'maya@northstar.test · verified domain' },
	{ value: 'team', label: 'Northstar team', description: 'hello@northstar.test · verified domain' },
	{ value: 'success', label: 'Customer success', description: 'success@northstar.test · verified domain' },
];

const segmentOptions = [
	{ value: 'trial-admins', label: 'Trial admins without a project', description: '18,420 people · refreshed 4 minutes ago', count: 18420 },
	{ value: 'milestone-teams', label: 'Teams at an activation milestone', description: '6,240 people · refreshed 9 minutes ago', count: 6240 },
	{ value: 'dormant-owners', label: 'Dormant workspace owners', description: '3,910 people · refreshed 12 minutes ago', count: 3910 },
	{ value: 'starter-owners', label: 'Starter plan owners', description: '8,100 people · refreshed 7 minutes ago', count: 8100 },
];

const exclusionOptions = [
	{ value: 'recently-contacted', label: 'Recently contacted', description: 'Exclude 1,680 people messaged in the last 72 hours', count: 1680 },
	{ value: 'open-support-case', label: 'Open support case', description: 'Exclude 214 people in an active escalation', count: 214 },
	{ value: 'sales-managed', label: 'Sales-managed account', description: 'Exclude 486 people with a named account owner', count: 486 },
];

const timezoneOptions = [
	{ value: 'recipient', label: 'Recipient local time', description: 'Deliver at 09:00 in each person\'s timezone' },
	{ value: 'Europe/London', label: 'Europe / London', description: 'Deliver all messages in British Summer Time' },
	{ value: 'America/New_York', label: 'America / New York', description: 'Deliver all messages in Eastern Time' },
];

const channelOptions = [
	{ id: 'email', label: 'Email', description: 'Rich lifecycle message with tracked links' },
	{ id: 'in-app', label: 'In-app banner', description: 'Workspace home message for active users' },
	{ id: 'push', label: 'Mobile push', description: 'Short reminder for opted-in account owners' },
];

const campaignSeeds = [
	{
		id: 'activation',
		name: 'Trial activation nudge',
		status: 'draft',
		owner: 'Lifecycle',
		goal: 'Help new admins connect their first project before trial day seven.',
		subject: 'Your workspace is ready for its first project',
		preheader: 'Invite a teammate and publish your first workflow.',
		body: 'Hi {{first_name}},\n\nYour Northstar workspace is ready. Connect your first project, invite a teammate, and publish a workflow before your trial checkpoint.\n\nIf you get stuck, reply and our activation team will help.',
		ctaLabel: 'Continue setup',
		senderId: 'maya',
		segmentId: 'trial-admins',
		exclusionIds: ['recently-contacted', 'open-support-case'],
		channels: ['email', 'in-app'],
		scheduleMode: 'scheduled',
		sendAt: '2026-08-03T09:00',
		timezone: 'recipient',
		holdoutPercentage: 10,
		updatedLabel: '12 min ago',
	},
	{
		id: 'milestone',
		name: 'Usage milestone',
		status: 'scheduled',
		owner: 'Growth',
		goal: 'Turn sustained product use into a team expansion conversation.',
		subject: 'Your team crossed an automation milestone',
		preheader: 'See the time saved and what to automate next.',
		body: 'Hi {{first_name}},\n\nYour team completed 1,000 automated actions this month. Review the time saved, share the result, and choose the next workflow to automate.',
		ctaLabel: 'View milestone',
		senderId: 'team',
		segmentId: 'milestone-teams',
		exclusionIds: ['sales-managed'],
		channels: ['email', 'in-app', 'push'],
		scheduleMode: 'scheduled',
		sendAt: '2026-08-04T14:00',
		timezone: 'Europe/London',
		holdoutPercentage: 5,
		updatedLabel: 'Today at 11:20',
		seedLaunch: true,
	},
	{
		id: 'winback',
		name: 'Dormant workspace win-back',
		status: 'completed',
		owner: 'Customer success',
		goal: 'Bring recently inactive account owners back to saved work.',
		subject: 'Pick up where your workspace left off',
		preheader: 'Your projects and teammates are still waiting.',
		body: 'Hi {{first_name}},\n\nYour projects are ready when you are. Return to your workspace and use the guided checklist to pick up from your last saved step.',
		ctaLabel: 'Return to workspace',
		senderId: 'success',
		segmentId: 'dormant-owners',
		exclusionIds: ['recently-contacted'],
		channels: ['email', 'push'],
		scheduleMode: 'immediate',
		sendAt: '',
		timezone: 'recipient',
		holdoutPercentage: 0,
		updatedLabel: 'Jul 29 at 15:40',
		seedComplete: true,
	},
];

let receiptSequence = 6420;
let activitySequence = 100;
const campaigns = new Map(campaignSeeds.map((seed) => [seed.id, createCampaign(seed)]));

/**
 * Lists campaigns with compact delivery and audience summaries.
 *
 * @returns {Array<object>} Campaign summaries for the navigation rail.
 */
export function listCampaigns() {
	return [...campaigns.values()].map(serializeCampaignSummary);
}

/**
 * Returns a campaign workspace with editable draft, server checks, and evidence.
 *
 * @param {string} campaignId Campaign identifier.
 * @returns {{ campaign?: object, catalog?: object, error?: string, status?: number }} Campaign workspace or API error.
 */
export function getCampaign(campaignId) {
	const campaign = campaigns.get(campaignId);
	if (!campaign) return { error: 'Campaign not found.', status: 404 };
	return {
		campaign: serializeCampaign(campaign),
		catalog: serializeCatalog(),
	};
}

/**
 * Saves a campaign draft when the caller holds the current revision.
 *
 * @param {string} campaignId Campaign identifier.
 * @param {Record<string, unknown>} input Complete editable campaign payload.
 * @returns {{ campaign?: object, catalog?: object, error?: string, status?: number }} Updated workspace or API error.
 */
export function updateCampaignDraft(campaignId, input = {}) {
	const campaign = campaigns.get(campaignId);
	if (!campaign) return { error: 'Campaign not found.', status: 404 };
	if (isLocked(campaign)) return { error: 'Scheduled and completed campaigns are locked. Duplicate this campaign to edit it.', status: 409 };
	const revisionError = validateRevision(campaign, input.revision);
	if (revisionError) return revisionError;
	const normalized = normalizeDraft(input);
	if (normalized.error) return normalized;

	Object.assign(campaign, normalized.value);
	campaign.revision += 1;
	campaign.validation = null;
	campaign.testReceipt = null;
	campaign.updatedLabel = 'Just now';
	campaign.activity.unshift(createActivity('Maya Cook', 'Saved campaign draft', `${campaign.channels.length} channels · ${formatNumber(calculateAudience(campaign).reachable)} reachable people`));
	return getCampaign(campaignId);
}

/**
 * Runs server-owned audience, consent, content, and scheduling checks.
 *
 * @param {string} campaignId Campaign identifier.
 * @param {Record<string, unknown>} input Validation request payload.
 * @returns {{ campaign?: object, catalog?: object, validation?: object, error?: string, status?: number }} Validation result.
 */
export function validateCampaign(campaignId, input = {}) {
	const campaign = campaigns.get(campaignId);
	if (!campaign) return { error: 'Campaign not found.', status: 404 };
	if (isLocked(campaign)) return { error: 'This campaign has already entered delivery.', status: 409 };
	const revisionError = validateRevision(campaign, input.revision);
	if (revisionError) return revisionError;

	const checks = buildChecks(campaign);
	const blocking = checks.filter((check) => check.state === 'blocked');
	campaign.validation = {
		id: `validation_${campaign.id}_${campaign.revision}`,
		revision: campaign.revision,
		checkedAt: 'Just now',
		checks,
		ready: blocking.length === 0,
	};
	campaign.activity.unshift(createActivity('Policy engine', blocking.length ? 'Found launch blockers' : 'Completed launch checks', blocking.length ? `${blocking.length} blocking checks need attention.` : 'Audience, consent, content, and delivery policies passed.'));
	return {
		...getCampaign(campaignId),
		validation: clone(campaign.validation),
	};
}

/**
 * Sends a provider-style test message without changing campaign delivery state.
 *
 * @param {string} campaignId Campaign identifier.
 * @param {Record<string, unknown>} input Test recipient and revision payload.
 * @returns {{ campaign?: object, catalog?: object, receipt?: object, error?: string, status?: number }} Test receipt or API error.
 */
export function sendCampaignTest(campaignId, input = {}) {
	const campaign = campaigns.get(campaignId);
	if (!campaign) return { error: 'Campaign not found.', status: 404 };
	if (isLocked(campaign)) return { error: 'Tests are disabled after a campaign enters delivery.', status: 409 };
	const revisionError = validateRevision(campaign, input.revision);
	if (revisionError) return revisionError;
	const recipient = String(input.recipient || '').trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return { error: 'Enter a valid test email address.', status: 422 };
	if (!campaign.channels.includes('email')) return { error: 'Enable the email channel before sending an email test.', status: 422 };
	if (!campaign.subject.trim() || !campaign.body.trim()) return { error: 'Add an email subject and message before sending a test.', status: 422 };

	receiptSequence += 1;
	campaign.testReceipt = {
		id: `test_${receiptSequence}`,
		providerMessageId: `msg_test_${receiptSequence}`,
		recipient,
		state: 'accepted',
		createdAt: 'Just now',
		revision: campaign.revision,
	};
	campaign.activity.unshift(createActivity('Maya Cook', 'Sent test message', `${recipient} · provider accepted ${campaign.testReceipt.providerMessageId}`));
	return {
		...getCampaign(campaignId),
		receipt: clone(campaign.testReceipt),
	};
}

/**
 * Creates an immutable launch receipt after exact-revision checks and acknowledgement.
 *
 * @param {string} campaignId Campaign identifier.
 * @param {Record<string, unknown>} input Launch acknowledgement payload.
 * @returns {{ campaign?: object, catalog?: object, launch?: object, error?: string, status?: number, blockers?: Array<object> }} Launch result.
 */
export function launchCampaign(campaignId, input = {}) {
	const campaign = campaigns.get(campaignId);
	if (!campaign) return { error: 'Campaign not found.', status: 404 };
	if (isLocked(campaign)) return { error: 'This campaign has already entered delivery.', status: 409 };
	const revisionError = validateRevision(campaign, input.revision);
	if (revisionError) return revisionError;
	if (input.acknowledged !== true) return { error: 'Confirm the audience, schedule, and channel delivery before launching.', status: 422 };
	if (!campaign.validation || campaign.validation.revision !== campaign.revision) return { error: 'Run launch checks for the current revision before continuing.', status: 409 };
	const blockers = campaign.validation.checks.filter((check) => check.state === 'blocked');
	if (blockers.length) return { error: 'Resolve the blocking launch checks before continuing.', blockers, status: 422 };

	receiptSequence += 1;
	const immediate = campaign.scheduleMode === 'immediate';
	campaign.status = immediate ? 'sending' : 'scheduled';
	campaign.launch = {
		id: `launch_${receiptSequence}`,
		state: immediate ? 'sending' : 'scheduled',
		label: immediate ? 'Sending now' : `Scheduled for ${formatSchedule(campaign)}`,
		createdAt: 'Just now',
		revision: campaign.revision,
		audience: calculateAudience(campaign),
		dispatches: campaign.channels.map((channelId) => ({
			channelId,
			label: channelLabel(channelId),
			state: immediate ? 'processing' : 'queued',
		})),
	};
	campaign.revision += 1;
	campaign.updatedLabel = 'Just now';
	campaign.activity.unshift(createActivity('Maya Cook', immediate ? 'Started campaign delivery' : 'Scheduled campaign delivery', campaign.launch.label));
	return {
		...getCampaign(campaignId),
		launch: clone(campaign.launch),
	};
}

/**
 * Advances a launched demo campaign through deterministic provider delivery states.
 *
 * @param {string} campaignId Campaign identifier.
 * @returns {{ campaign?: object, catalog?: object, launch?: object, error?: string, status?: number }} Updated delivery evidence.
 */
export function advanceCampaignDelivery(campaignId) {
	const campaign = campaigns.get(campaignId);
	if (!campaign) return { error: 'Campaign not found.', status: 404 };
	if (!campaign.launch) return { error: 'Launch this campaign before advancing provider delivery.', status: 409 };
	if (campaign.launch.state === 'completed') return { error: 'Campaign delivery is already complete.', status: 409 };

	if (campaign.launch.state === 'scheduled') {
		campaign.launch.state = 'sending';
		campaign.launch.label = 'Sending now';
		campaign.launch.dispatches.forEach((dispatch) => { dispatch.state = 'processing'; });
		campaign.status = 'sending';
		campaign.activity.unshift(createActivity('Delivery worker', 'Started scheduled delivery', `${campaign.launch.dispatches.length} channel jobs are processing.`));
	} else {
		campaign.launch.state = 'completed';
		campaign.launch.label = 'Delivery completed just now';
		campaign.launch.dispatches.forEach((dispatch) => { dispatch.state = 'delivered'; });
		campaign.status = 'completed';
		campaign.results = buildResults(campaign);
		campaign.activity.unshift(createActivity('Delivery worker', 'Completed campaign delivery', `${formatNumber(campaign.results.delivered)} messages delivered with ${campaign.results.failures} permanent failures.`));
	}
	campaign.updatedLabel = 'Just now';
	return {
		...getCampaign(campaignId),
		launch: clone(campaign.launch),
	};
}

/**
 * Restores one campaign to its original deterministic demo state.
 *
 * @param {string} campaignId Campaign identifier.
 * @returns {{ campaign?: object, catalog?: object, error?: string, status?: number }} Restored workspace or API error.
 */
export function resetCampaign(campaignId) {
	const seed = campaignSeeds.find((candidate) => candidate.id === campaignId);
	if (!seed) return { error: 'Campaign not found.', status: 404 };
	campaigns.set(campaignId, createCampaign(seed));
	return getCampaign(campaignId);
}

/**
 * Adds workflow metadata and optional launch evidence to a campaign seed.
 *
 * @param {object} seed Campaign seed.
 * @returns {object} Mutable campaign record.
 */
function createCampaign(seed) {
	const campaign = {
		...clone(seed),
		revision: 8,
		validation: null,
		testReceipt: null,
		launch: null,
		results: null,
		activity: [
			createActivity(seed.owner, 'Audience recalculated', `${formatNumber(calculateAudience(seed).reachable)} reachable people after exclusions and holdout.`),
			createActivity('Maya Cook', 'Updated message copy', 'Subject and mobile preview were reviewed.'),
			createActivity('System', 'Created campaign', `Started from the ${seed.owner.toLowerCase()} baseline.`),
		],
	};
	if (seed.seedLaunch) campaign.launch = buildSeedLaunch(campaign, 'scheduled');
	if (seed.seedComplete) {
		campaign.launch = buildSeedLaunch(campaign, 'completed');
		campaign.results = buildResults(campaign);
	}
	delete campaign.seedLaunch;
	delete campaign.seedComplete;
	return campaign;
}

/**
 * Builds deterministic seed launch evidence for scheduled and completed examples.
 *
 * @param {object} campaign Campaign record.
 * @param {'scheduled'|'completed'} state Seed launch state.
 * @returns {object} Launch receipt.
 */
function buildSeedLaunch(campaign, state) {
	return {
		id: `launch_seed_${campaign.id}`,
		state,
		label: state === 'completed' ? 'Delivered Jul 29 at 15:40' : `Scheduled for ${formatSchedule(campaign)}`,
		createdAt: state === 'completed' ? 'Jul 29 at 15:40' : 'Today at 11:20',
		revision: campaign.revision,
		audience: calculateAudience(campaign),
		dispatches: campaign.channels.map((channelId) => ({
			channelId,
			label: channelLabel(channelId),
			state: state === 'completed' ? 'delivered' : 'queued',
		})),
	};
}

/**
 * Serializes a campaign without exposing mutable process state.
 *
 * @param {object} campaign Stored campaign record.
 * @returns {object} Safe campaign response.
 */
function serializeCampaign(campaign) {
	return {
		...clone(campaign),
		audience: calculateAudience(campaign),
		checks: campaign.validation?.checks || buildChecks(campaign),
		readiness: calculateReadiness(campaign),
	};
}

/**
 * Serializes one campaign for navigation.
 *
 * @param {object} campaign Stored campaign record.
 * @returns {object} Compact campaign summary.
 */
function serializeCampaignSummary(campaign) {
	const audience = calculateAudience(campaign);
	return {
		id: campaign.id,
		name: campaign.name,
		status: campaign.status,
		owner: campaign.owner,
		updatedLabel: campaign.updatedLabel,
		reachable: audience.reachable,
		channels: clone(campaign.channels),
	};
}

/**
 * Returns the immutable option catalog used by rich DOM Studio controls.
 *
 * @returns {object} Sender, segment, exclusion, timezone, and channel choices.
 */
function serializeCatalog() {
	return clone({ senderOptions, segmentOptions, exclusionOptions, timezoneOptions, channelOptions });
}

/**
 * Normalizes and validates the editable campaign contract.
 *
 * @param {Record<string, unknown>} input Untrusted API payload.
 * @returns {{ value?: object, error?: string, status?: number }} Normalized draft or validation error.
 */
function normalizeDraft(input) {
	const name = String(input.name || '').trim();
	const subject = String(input.subject || '').trim();
	const preheader = String(input.preheader || '').trim();
	const body = String(input.body || '').trim();
	const ctaLabel = String(input.ctaLabel || '').trim();
	const senderId = String(input.senderId || '');
	const segmentId = String(input.segmentId || '');
	const exclusionIds = uniqueStrings(input.exclusionIds);
	const channels = uniqueStrings(input.channels);
	const scheduleMode = String(input.scheduleMode || '');
	const sendAt = String(input.sendAt || '').trim();
	const timezone = String(input.timezone || '');
	const holdoutPercentage = Number(input.holdoutPercentage);

	if (name.length < 4 || name.length > 80) return { error: 'Campaign name must be between 4 and 80 characters.', status: 422 };
	if (!senderOptions.some((option) => option.value === senderId)) return { error: 'Choose a verified sender.', status: 422 };
	if (!segmentOptions.some((option) => option.value === segmentId)) return { error: 'Choose a known audience segment.', status: 422 };
	if (exclusionIds.some((id) => !exclusionOptions.some((option) => option.value === id))) return { error: 'One or more exclusions are not available.', status: 422 };
	if (!channels.length || channels.some((id) => !channelOptions.some((channel) => channel.id === id))) return { error: 'Enable at least one known delivery channel.', status: 422 };
	if (!['immediate', 'scheduled'].includes(scheduleMode)) return { error: 'Choose immediate or scheduled delivery.', status: 422 };
	if (scheduleMode === 'scheduled' && !/^2026-\d{2}-\d{2}T\d{2}:\d{2}$/.test(sendAt)) return { error: 'Choose a valid 2026 send date and time.', status: 422 };
	if (!timezoneOptions.some((option) => option.value === timezone)) return { error: 'Choose a supported delivery timezone.', status: 422 };
	if (!Number.isInteger(holdoutPercentage) || holdoutPercentage < 0 || holdoutPercentage > 20) return { error: 'Holdout must be a whole percentage from 0 to 20.', status: 422 };

	return {
		value: { name, subject, preheader, body, ctaLabel, senderId, segmentId, exclusionIds, channels, scheduleMode, sendAt: scheduleMode === 'scheduled' ? sendAt : '', timezone, holdoutPercentage },
	};
}

/**
 * Calculates raw, excluded, held-out, and reachable audience counts.
 *
 * @param {object} campaign Campaign or compatible seed.
 * @returns {{ segment: number, excluded: number, holdout: number, reachable: number }} Audience calculation.
 */
function calculateAudience(campaign) {
	const segment = segmentOptions.find((option) => option.value === campaign.segmentId)?.count || 0;
	const excluded = campaign.exclusionIds.reduce((total, id) => total + (exclusionOptions.find((option) => option.value === id)?.count || 0), 0);
	const eligible = Math.max(0, segment - excluded);
	const holdout = Math.round(eligible * ((campaign.holdoutPercentage || 0) / 100));
	return { segment, excluded, holdout, reachable: Math.max(0, eligible - holdout) };
}

/**
 * Builds launch checks from the authoritative campaign record.
 *
 * @param {object} campaign Campaign record.
 * @returns {Array<{ id: string, label: string, detail: string, state: 'passed'|'warning'|'blocked' }>} Launch checks.
 */
function buildChecks(campaign) {
	const audience = calculateAudience(campaign);
	const checks = [
		{ id: 'sender', label: 'Verified sender', detail: senderOptions.some((option) => option.value === campaign.senderId) ? 'Sending domain and reply path are verified.' : 'Choose a verified sender identity.', state: senderOptions.some((option) => option.value === campaign.senderId) ? 'passed' : 'blocked' },
		{ id: 'audience', label: 'Reachable audience', detail: audience.reachable ? `${formatNumber(audience.reachable)} people remain after exclusions and holdout.` : 'The current rules produce no reachable recipients.', state: audience.reachable ? 'passed' : 'blocked' },
		{ id: 'consent', label: 'Consent and suppression', detail: 'Global unsubscribe, hard bounce, and workspace suppression lists are enforced at send time.', state: 'passed' },
		{ id: 'content', label: 'Message content', detail: contentCheckDetail(campaign), state: campaign.subject.trim() && campaign.body.trim() && campaign.ctaLabel.trim() ? 'passed' : 'blocked' },
		{ id: 'schedule', label: 'Delivery window', detail: campaign.scheduleMode === 'immediate' ? 'Delivery begins after final confirmation.' : campaign.sendAt ? `Scheduled for ${formatSchedule(campaign)}.` : 'Choose a send date and time.', state: campaign.scheduleMode === 'immediate' || campaign.sendAt ? 'passed' : 'blocked' },
	];
	if (!campaign.exclusionIds.includes('recently-contacted')) checks.push({ id: 'frequency', label: 'Frequency cap', detail: 'Recently contacted people are included; 1,680 recipients may receive another message inside 72 hours.', state: 'warning' });
	return checks;
}

/**
 * Calculates a compact readiness score without treating warnings as blockers.
 *
 * @param {object} campaign Campaign record.
 * @returns {{ score: number, passed: number, warnings: number, blocked: number }} Readiness summary.
 */
function calculateReadiness(campaign) {
	const checks = buildChecks(campaign);
	const passed = checks.filter((check) => check.state === 'passed').length;
	const warnings = checks.filter((check) => check.state === 'warning').length;
	const blocked = checks.filter((check) => check.state === 'blocked').length;
	return {
		score: Math.round((passed / Math.max(1, checks.length)) * 100),
		passed,
		warnings,
		blocked,
	};
}

/**
 * Describes the current message content check for operators.
 *
 * @param {object} campaign Campaign record.
 * @returns {string} Content check detail.
 */
function contentCheckDetail(campaign) {
	if (!campaign.subject.trim()) return 'Add a subject before launch.';
	if (!campaign.body.trim()) return 'Add message content before launch.';
	if (!campaign.ctaLabel.trim()) return 'Add a call-to-action label before launch.';
	return `${campaign.subject.length} subject characters · personalization fallbacks available.`;
}

/**
 * Builds deterministic post-send metrics for a completed campaign.
 *
 * @param {object} campaign Campaign record.
 * @returns {object} Delivery and engagement evidence.
 */
function buildResults(campaign) {
	const audience = calculateAudience(campaign);
	const failures = Math.max(4, Math.round(audience.reachable * 0.002));
	const delivered = Math.max(0, audience.reachable - failures);
	return {
		delivered,
		failures,
		opened: Math.round(delivered * 0.534),
		clicked: Math.round(delivered * 0.128),
		converted: Math.round(delivered * 0.047),
		unsubscribed: Math.max(1, Math.round(delivered * 0.0012)),
		attributionWindow: '7 days',
	};
}

/**
 * Validates optimistic concurrency for a campaign mutation.
 *
 * @param {object} campaign Stored campaign record.
 * @param {unknown} revision Submitted revision.
 * @returns {{ error: string, status: number } | null} Conflict response or null.
 */
function validateRevision(campaign, revision) {
	if (!Number.isInteger(Number(revision))) return { error: 'A numeric campaign revision is required.', status: 422 };
	if (Number(revision) !== campaign.revision) return { error: 'This campaign changed in another session. Reload the latest revision before saving.', status: 409 };
	return null;
}

/**
 * Reports whether a campaign is no longer editable.
 *
 * @param {object} campaign Campaign record.
 * @returns {boolean} Whether delivery state locks draft fields.
 */
function isLocked(campaign) {
	return ['scheduled', 'sending', 'completed'].includes(campaign.status);
}

/**
 * Creates an activity entry for the campaign timeline.
 *
 * @param {string} actor Activity actor.
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {object} Activity record.
 */
function createActivity(actor, action, detail) {
	activitySequence += 1;
	return { id: `activity_${activitySequence}`, actor, action, detail, time: 'Just now' };
}

/**
 * Returns a human-readable label for a channel identifier.
 *
 * @param {string} channelId Channel identifier.
 * @returns {string} Channel label.
 */
function channelLabel(channelId) {
	return channelOptions.find((channel) => channel.id === channelId)?.label || channelId;
}

/**
 * Formats a campaign schedule for audit and launch receipts.
 *
 * @param {object} campaign Campaign record.
 * @returns {string} Human-readable schedule.
 */
function formatSchedule(campaign) {
	if (!campaign.sendAt) return 'immediate delivery';
	const [date, time] = campaign.sendAt.split('T');
	return `${date} at ${time} · ${campaign.timezone === 'recipient' ? 'recipient local time' : campaign.timezone}`;
}

/**
 * Formats a count using an English locale.
 *
 * @param {number} value Numeric count.
 * @returns {string} Formatted count.
 */
function formatNumber(value) {
	return Number(value || 0).toLocaleString('en-GB');
}

/**
 * Coerces an input list to unique, non-empty strings.
 *
 * @param {unknown} value Untrusted input value.
 * @returns {string[]} Unique strings.
 */
function uniqueStrings(value) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

/**
 * Deep-clones serializable demo data before returning it to callers.
 *
 * @param {unknown} value Serializable value.
 * @returns {any} Independent clone.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
