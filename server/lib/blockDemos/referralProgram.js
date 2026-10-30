const rewardOptions = [
	{
		value: 'account-credit',
		label: 'Account credit',
		description: 'Apply each earned reward to the next Northstar invoice.',
	},
	{
		value: 'gift-card',
		label: 'Digital gift card',
		description: 'Email a provider-issued gift card after qualification.',
	},
	{
		value: 'charity',
		label: 'Charity donation',
		description: 'Send each reward to the selected community fund.',
	},
];

const channelOptions = [
	{ value: 'email', label: 'Email', description: 'Send a provider-tracked personal invitation.' },
	{ value: 'link', label: 'Copy link', description: 'Create a signed share receipt for any channel.' },
	{ value: 'workspace', label: 'Team workspace', description: 'Share through a connected collaboration workspace.' },
];

const milestones = [
	{ count: 1, label: 'First reward', bonus: 0 },
	{ count: 3, label: 'Referral regular', bonus: 0 },
	{ count: 5, label: 'Circle bonus', bonus: 50 },
	{ count: 10, label: 'VIP rewards', bonus: 100 },
];

const memberSeed = {
	id: 'mem_118',
	name: 'Alex Morgan',
	email: 'alex@northstar.test',
	initials: 'AM',
	plan: 'Scale',
	referralCode: 'ALEX-2048',
	inviteUrl: 'https://app.northstar.test/join?ref=ALEX-2048',
};

const programSeed = {
	id: 'northstar-circle-2026',
	name: 'Northstar Circle',
	revision: 12,
	rewardType: 'account-credit',
	rewardAmount: 25,
	currency: 'GBP',
	autoNotify: true,
	qualificationRule: 'The referred workspace pays its first invoice and passes duplicate-account review.',
	attributionWindowDays: 30,
	qualificationWindowDays: 60,
	termsVersion: '2026-07-15',
};

const referralSeeds = [
	{ id: 'ref_101', name: 'Maya Chen', email: 'maya@example.com', channel: 'Email', status: 'qualified', detail: 'Reward credited Jul 26', invitedAt: 'Jul 11', reward: 25, fraudState: 'passed' },
	{ id: 'ref_102', name: 'Nora Lee', email: 'nora@example.com', channel: 'Link', status: 'trial_started', detail: 'Trial started yesterday', invitedAt: 'Jul 22', reward: 0, fraudState: 'pending' },
	{ id: 'ref_103', name: 'Owen Park', email: 'owen@example.com', channel: 'Workspace', status: 'invited', detail: 'Invite delivered 2 hours ago', invitedAt: 'Today', reward: 0, fraudState: 'not_started' },
	{ id: 'ref_104', name: 'Priya Shah', email: 'priya@example.com', channel: 'Email', status: 'qualified', detail: 'Reward credited Jul 18', invitedAt: 'Jul 02', reward: 25, fraudState: 'passed' },
	{ id: 'ref_105', name: 'Sam Taylor', email: 'sam@example.com', channel: 'Link', status: 'qualified', detail: 'Reward credited Jul 09', invitedAt: 'Jun 20', reward: 25, fraudState: 'passed' },
	{ id: 'ref_106', name: 'Eliana Brooks', email: 'eliana@example.com', channel: 'Email', status: 'qualified', detail: 'Reward credited Jun 28', invitedAt: 'Jun 10', reward: 25, fraudState: 'passed' },
];

const ledgerSeeds = [
	{ id: 'ledger_104', type: 'reward', label: 'Priya qualified', detail: 'First paid invoice verified', amount: 25, status: 'available', createdAt: 'Jul 18' },
	{ id: 'ledger_105', type: 'reward', label: 'Sam qualified', detail: 'First paid invoice verified', amount: 25, status: 'available', createdAt: 'Jul 09' },
	{ id: 'ledger_106', type: 'reward', label: 'Eliana qualified', detail: 'First paid invoice verified', amount: 25, status: 'available', createdAt: 'Jun 28' },
	{ id: 'ledger_101', type: 'reward', label: 'Maya qualified', detail: 'First paid invoice verified', amount: 25, status: 'available', createdAt: 'Jul 26' },
];

let sequence = 7300;
let referralState = createReferralState();

/**
 * Returns the complete customer-facing referral workspace.
 *
 * @returns {object} Referral member, program policy, activity, and reward evidence.
 */
export function getReferralWorkspace() {
	return serializeWorkspace();
}

/**
 * Persists reward and reminder preferences with exact-revision protection.
 *
 * @param {Record<string, unknown>} input Preference values and current revision.
 * @returns {object} Updated workspace or API error.
 */
export function updateReferralPreferences(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const rewardType = String(input.rewardType || '');
	if (!rewardOptions.some((option) => option.value === rewardType)) {
		return { error: 'Choose an available reward preference.', status: 422 };
	}

	referralState.program.rewardType = rewardType;
	referralState.program.autoNotify = input.autoNotify === true;
	referralState.program.revision += 1;
	referralState.activity.unshift(createActivity('Alex Morgan', 'Updated reward preferences', rewardLabel(rewardType)));
	return serializeWorkspace();
}

/**
 * Creates a provider-tracked referral invitation after server validation.
 *
 * @param {Record<string, unknown>} input Invite email, channel, and program revision.
 * @returns {object} Updated workspace with an immutable invite receipt or API error.
 */
export function createReferralInvite(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const email = String(input.email || '').trim().toLowerCase();
	const channel = String(input.channel || 'email');
	if (!isValidEmail(email)) return { error: 'Enter a valid friend email address.', status: 422 };
	if (email === referralState.member.email) return { error: 'Use a friend\'s email address rather than your own.', status: 422 };
	if (referralState.referrals.some((referral) => referral.email === email)) {
		return { error: 'This person already has an active referral record.', status: 409 };
	}
	if (!channelOptions.some((option) => option.value === channel)) {
		return { error: 'Choose an available invite channel.', status: 422 };
	}

	sequence += 1;
	const referral = {
		id: `ref_${sequence}`,
		name: nameFromEmail(email),
		email,
		channel: channelLabel(channel),
		status: 'invited',
		detail: referralState.program.autoNotify ? 'Invite delivered with milestone reminders' : 'Invite delivered',
		invitedAt: 'Just now',
		reward: 0,
		fraudState: 'not_started',
	};
	const receipt = {
		id: `invite_${sequence}`,
		referralId: referral.id,
		providerMessageId: channel === 'email' ? `mail_${sequence}` : `share_${sequence}`,
		attributionId: `attr_${sequence}`,
		channel,
		state: 'accepted',
		expiresInDays: referralState.program.qualificationWindowDays,
		createdAt: 'Just now',
	};
	referralState.referrals.unshift(referral);
	referralState.inviteReceipt = receipt;
	referralState.activity.unshift(createActivity('Northstar referrals', 'Invite accepted by provider', `${email} · ${receipt.attributionId}`));
	return {
		...serializeWorkspace(),
		receipt: clone(receipt),
	};
}

/**
 * Records an attributable share event for the member's signed invite URL.
 *
 * @param {Record<string, unknown>} input Selected sharing channel.
 * @returns {object} Updated workspace with a share receipt or API error.
 */
export function recordReferralShare(input = {}) {
	const channel = String(input.channel || 'link');
	if (!channelOptions.some((option) => option.value === channel)) {
		return { error: 'Choose an available sharing channel.', status: 422 };
	}
	sequence += 1;
	const receipt = {
		id: `share_${sequence}`,
		channel,
		signedUrl: `${referralState.member.inviteUrl}&share=${sequence}`,
		campaignId: referralState.program.id,
		termsVersion: referralState.program.termsVersion,
		createdAt: 'Just now',
	};
	referralState.shareReceipt = receipt;
	referralState.activity.unshift(createActivity('Alex Morgan', 'Created tracked share link', `${channelLabel(channel)} · ${receipt.id}`));
	return {
		...serializeWorkspace(),
		receipt: clone(receipt),
	};
}

/**
 * Advances one referral through deterministic provider webhook states.
 *
 * @param {string} referralId Referral identifier.
 * @returns {object} Updated workspace with lifecycle evidence or API error.
 */
export function advanceReferralLifecycle(referralId) {
	const referral = referralState.referrals.find((candidate) => candidate.id === referralId);
	if (!referral) return { error: 'Referral not found.', status: 404 };
	if (referral.status === 'qualified') return { error: 'This referral has already qualified.', status: 409 };

	sequence += 1;
	const transition = nextReferralTransition(referral.status);
	referral.status = transition.status;
	referral.detail = transition.detail;
	referral.fraudState = transition.fraudState;
	const evidence = {
		id: `event_${sequence}`,
		referralId,
		event: transition.event,
		state: 'processed',
		createdAt: 'Just now',
	};

	if (transition.status === 'qualified') applyQualifiedReward(referral);
	referralState.lifecycleReceipt = evidence;
	referralState.activity.unshift(createActivity('Referral webhook', transition.activity, `${referral.email} · ${evidence.id}`));
	return {
		...serializeWorkspace(),
		receipt: clone(evidence),
	};
}

/**
 * Applies the available reward balance to the member's next invoice.
 *
 * @param {Record<string, unknown>} input Redemption acknowledgement and revision.
 * @returns {object} Updated workspace with an immutable redemption receipt or API error.
 */
export function redeemReferralBalance(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (input.acknowledged !== true) return { error: 'Confirm that the available balance should be applied to the next invoice.', status: 422 };
	const balance = calculateStats().availableBalance;
	if (balance <= 0) return { error: 'There is no available reward balance to redeem.', status: 409 };

	sequence += 1;
	const receipt = {
		id: `redeem_${sequence}`,
		amount: balance,
		currency: referralState.program.currency,
		destination: 'Next Northstar invoice',
		state: 'applied',
		createdAt: 'Just now',
	};
	referralState.ledger.unshift({
		id: `ledger_${sequence}`,
		type: 'redemption',
		label: 'Applied to next invoice',
		detail: receipt.id,
		amount: -balance,
		status: 'applied',
		createdAt: 'Just now',
	});
	referralState.program.revision += 1;
	referralState.redemptionReceipt = receipt;
	referralState.activity.unshift(createActivity('Billing ledger', 'Applied referral balance', `${formatMoney(balance)} · ${receipt.id}`));
	return {
		...serializeWorkspace(),
		receipt: clone(receipt),
	};
}

/**
 * Restores the deterministic referral demonstration state.
 *
 * @returns {object} Fresh referral workspace.
 */
export function resetReferralProgram() {
	referralState = createReferralState();
	return serializeWorkspace();
}

/**
 * Creates isolated mutable state from the referral seeds.
 *
 * @returns {object} Mutable referral program state.
 */
function createReferralState() {
	return {
		member: clone(memberSeed),
		program: clone(programSeed),
		referrals: clone(referralSeeds),
		ledger: clone(ledgerSeeds),
		inviteReceipt: null,
		shareReceipt: null,
		lifecycleReceipt: null,
		redemptionReceipt: null,
		activity: [
			createActivity('Billing ledger', 'Credited Maya\'s reward', 'First paid invoice and duplicate-account checks passed.'),
			createActivity('Referral webhook', 'Nora started a trial', 'Qualification window ends in 52 days.'),
			createActivity('Alex Morgan', 'Shared the Circle invite link', 'Email · spring product newsletter'),
		],
	};
}

/**
 * Serializes the current state and server-calculated referral statistics.
 *
 * @returns {object} Immutable referral workspace payload.
 */
function serializeWorkspace() {
	return {
		member: clone(referralState.member),
		program: clone(referralState.program),
		catalog: {
			rewardOptions: clone(rewardOptions),
			channelOptions: clone(channelOptions),
			milestones: clone(milestones),
		},
		stats: calculateStats(),
		referrals: clone(referralState.referrals),
		ledger: clone(referralState.ledger),
		activity: clone(referralState.activity),
		evidence: {
			inviteReceipt: clone(referralState.inviteReceipt),
			shareReceipt: clone(referralState.shareReceipt),
			lifecycleReceipt: clone(referralState.lifecycleReceipt),
			redemptionReceipt: clone(referralState.redemptionReceipt),
		},
	};
}

/**
 * Calculates customer-visible funnel, milestone, and ledger totals.
 *
 * @returns {object} Server-owned referral statistics.
 */
function calculateStats() {
	const qualified = referralState.referrals.filter((referral) => referral.status === 'qualified').length;
	const active = referralState.referrals.filter((referral) => referral.status !== 'qualified').length;
	const lifetimeEarned = referralState.ledger
		.filter((entry) => entry.amount > 0)
		.reduce((total, entry) => total + entry.amount, 0);
	const availableBalance = referralState.ledger.reduce((total, entry) => total + entry.amount, 0);
	const nextMilestone = milestones.find((milestone) => milestone.count > qualified) || milestones[milestones.length - 1];
	const previousMilestone = [...milestones].reverse().find((milestone) => milestone.count <= qualified) || { count: 0 };
	const span = Math.max(1, nextMilestone.count - previousMilestone.count);
	const progress = Math.min(100, Math.round(((qualified - previousMilestone.count) / span) * 100));
	return {
		invited: referralState.referrals.length,
		active,
		qualified,
		lifetimeEarned,
		availableBalance,
		nextMilestone: clone(nextMilestone),
		progress,
		remaining: Math.max(0, nextMilestone.count - qualified),
	};
}

/**
 * Adds base and milestone reward entries after qualification.
 *
 * @param {object} referral Newly qualified referral record.
 * @returns {void}
 */
function applyQualifiedReward(referral) {
	const qualified = referralState.referrals.filter((candidate) => candidate.status === 'qualified').length;
	const milestone = milestones.find((candidate) => candidate.count === qualified);
	referral.reward = referralState.program.rewardAmount + (milestone?.bonus || 0);
	referral.detail = milestone?.bonus
		? `${formatMoney(referral.reward)} credited with ${milestone.label}`
		: `${formatMoney(referral.reward)} reward credited`;
	referralState.ledger.unshift({
		id: `ledger_${sequence}_reward`,
		type: 'reward',
		label: `${referral.name} qualified`,
		detail: 'First paid invoice and account checks passed',
		amount: referralState.program.rewardAmount,
		status: 'available',
		createdAt: 'Just now',
	});
	if (milestone?.bonus) {
		referralState.ledger.unshift({
			id: `ledger_${sequence}_bonus`,
			type: 'bonus',
			label: milestone.label,
			detail: `${qualified} qualified referrals reached`,
			amount: milestone.bonus,
			status: 'available',
			createdAt: 'Just now',
		});
	}
}

/**
 * Resolves the next deterministic provider state for a referral.
 *
 * @param {string} status Current referral status.
 * @returns {{ status: string, detail: string, fraudState: string, event: string, activity: string }} Next transition.
 */
function nextReferralTransition(status) {
	if (status === 'invited') {
		return { status: 'opened', detail: 'Invite opened just now', fraudState: 'not_started', event: 'invite.opened', activity: 'Processed invite open' };
	}
	if (status === 'opened') {
		return { status: 'trial_started', detail: 'Trial started just now', fraudState: 'pending', event: 'account.trial_started', activity: 'Processed trial activation' };
	}
	return { status: 'qualified', detail: 'Reward qualification completed', fraudState: 'passed', event: 'invoice.first_paid', activity: 'Verified first paid invoice' };
}

/**
 * Rejects stale mutation requests against the current program revision.
 *
 * @param {unknown} revision Client revision value.
 * @returns {{ error: string, status: number }|null} Conflict response or null.
 */
function validateRevision(revision) {
	if (Number(revision) === referralState.program.revision) return null;
	return { error: `Program changed to revision ${referralState.program.revision}. Reload before continuing.`, status: 409 };
}

/**
 * Converts an email local-part into a readable referral name.
 *
 * @param {string} email Normalized email address.
 * @returns {string} Human-readable fallback name.
 */
function nameFromEmail(email) {
	return email.split('@')[0]
		.split(/[._-]/)
		.filter(Boolean)
		.map(capitalize)
		.join(' ') || 'Invited friend';
}

/**
 * Capitalizes one name fragment.
 *
 * @param {string} value Name fragment.
 * @returns {string} Capitalized fragment.
 */
function capitalize(value) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Validates a practical email shape for the demo API.
 *
 * @param {string} value Candidate email.
 * @returns {boolean} Whether the email can be accepted.
 */
function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Resolves a share channel label.
 *
 * @param {string} value Channel value.
 * @returns {string} Channel label.
 */
function channelLabel(value) {
	return channelOptions.find((option) => option.value === value)?.label || value;
}

/**
 * Resolves a reward preference label.
 *
 * @param {string} value Reward option value.
 * @returns {string} Reward label.
 */
function rewardLabel(value) {
	return rewardOptions.find((option) => option.value === value)?.label || value;
}

/**
 * Builds a compact activity entry.
 *
 * @param {string} actor Activity actor.
 * @param {string} label Activity label.
 * @param {string} detail Activity detail.
 * @returns {object} Activity record.
 */
function createActivity(actor, label, detail) {
	sequence += 1;
	return { id: `activity_${sequence}`, actor, label, detail, createdAt: 'Just now' };
}

/**
 * Formats a numeric GBP amount for evidence copy.
 *
 * @param {number} value Monetary amount.
 * @returns {string} GBP currency string.
 */
function formatMoney(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 * Deep-clones serializable demo data.
 *
 * @template T
 * @param {T} value Serializable value.
 * @returns {T} Cloned value.
 */
function clone(value) {
	if (value == null) return value;
	return JSON.parse(JSON.stringify(value));
}
