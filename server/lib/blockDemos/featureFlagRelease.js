const currentOperator = {
	id: 'usr_maya',
	name: 'Maya Chen',
	initials: 'MC',
	role: 'Release engineer',
	permissions: ['flag:read', 'flag:create', 'flag:change', 'approval:request', 'release:publish', 'release:rollback'],
};

const releaseReviewer = {
	id: 'usr_ava',
	name: 'Ava Morgan',
	role: 'Production release manager',
};

const environmentOptions = [
	{ value: 'production', label: 'Production', description: 'Live customer traffic with approval and evidence gates.' },
	{ value: 'staging', label: 'Staging', description: 'Pre-production verification against current services.' },
	{ value: 'development', label: 'Development', description: 'Local and preview environments for early integration.' },
];

const ownerOptions = [
	{ value: 'growth', label: 'Growth engineering', description: 'Checkout, acquisition, and activation surfaces.' },
	{ value: 'admin', label: 'Admin platform', description: 'Workspace governance and member controls.' },
	{ value: 'support', label: 'Support tooling', description: 'Agent workflows and conversation intelligence.' },
];

const segmentOptions = [
	{ value: 'beta_scale_eu', label: 'Beta · Scale plans · EU', description: '1,842 workspaces with beta access and European residency.' },
	{ value: 'internal', label: 'Internal workspaces', description: '248 employee and test workspaces.' },
	{ value: 'support_english', label: 'Support agents · English', description: '3,460 agents using English-language queues.' },
	{ value: 'everyone', label: 'Everyone', description: 'All contexts reaching this environment.' },
];

const attributeOptions = [
	{ value: 'plan', label: 'Workspace plan', description: 'Match the current commercial plan.' },
	{ value: 'region', label: 'Workspace region', description: 'Match the residency or deployment region.' },
	{ value: 'workspace_age_days', label: 'Workspace age', description: 'Match the number of days since workspace creation.' },
	{ value: 'email_domain', label: 'Email domain', description: 'Match a verified user email domain.' },
];

const operatorOptions = [
	{ value: 'is_one_of', label: 'is one of', description: 'Match any comma-separated value.' },
	{ value: 'is_not_one_of', label: 'is not one of', description: 'Exclude any comma-separated value.' },
	{ value: 'greater_than', label: 'is greater than', description: 'Compare a numeric context attribute.' },
	{ value: 'ends_with', label: 'ends with', description: 'Match the end of a text value.' },
];

const flagTypeOptions = [
	{ value: 'release', label: 'Release flag', description: 'Gradually expose a product capability.' },
	{ value: 'kill-switch', label: 'Kill switch', description: 'Disable a risky system path immediately.' },
	{ value: 'experiment', label: 'Experiment', description: 'Allocate traffic between measured variations.' },
];

const contextSegmentOptions = [
	{ value: 'beta_scale_eu', label: 'Beta Scale EU workspace', description: 'Matches the current checkout release audience.' },
	{ value: 'internal', label: 'Internal workspace', description: 'Employee and test traffic.' },
	{ value: 'support_english', label: 'English support agent', description: 'English-language support queue member.' },
	{ value: 'unmatched', label: 'Unmatched workspace', description: 'Does not belong to a configured segment.' },
];

const regionOptions = [
	{ value: 'eu-west', label: 'EU West', description: 'European production region.' },
	{ value: 'us-east', label: 'US East', description: 'United States production region.' },
	{ value: 'ap-southeast', label: 'Asia Pacific', description: 'Asia-Pacific production region.' },
];

const flagSeeds = [
	{
		id: 'wallet-checkout',
		key: 'checkout.wallet_express',
		name: 'Express wallet checkout',
		description: 'Offer Apple Pay and saved-wallet options before the full address step.',
		ownerId: 'growth',
		type: 'release',
		risk: 'medium',
		environments: {
			production: createEnvironment({
				version: 7,
				enabled: true,
				rollout: 32,
				status: 'monitoring',
				audienceSegmentId: 'beta_scale_eu',
				updatedAt: '12 min ago',
				evaluations: 12842,
				lastReceipt: 'release_8042',
				rule: { id: 'rule_wallet_2', attribute: 'workspace_age_days', operator: 'greater_than', value: '14' },
				metrics: [
					metric('Checkout errors', '0.18%', '< 0.50%', 'passed', 'Down 0.04%'),
					metric('P95 latency', '184 ms', '< 250 ms', 'passed', 'Stable'),
					metric('Checkout conversion', '+4.7%', '> -1.0%', 'passed', 'Above baseline'),
				],
			}),
			staging: createEnvironment({ version: 4, enabled: true, rollout: 100, status: 'healthy', audienceSegmentId: 'everyone', updatedAt: '2 hr ago', evaluations: 421, lastReceipt: 'release_7918' }),
			development: createEnvironment({ version: 3, enabled: true, rollout: 100, status: 'healthy', audienceSegmentId: 'everyone', updatedAt: 'Yesterday', evaluations: 86, lastReceipt: 'release_7750' }),
		},
	},
	{
		id: 'team-invites',
		key: 'workspace.invite_approval',
		name: 'Invite approval flow',
		description: 'Require admins to approve external-domain invitations before users join.',
		ownerId: 'admin',
		type: 'release',
		risk: 'low',
		environments: {
			production: createEnvironment({ version: 3, enabled: false, rollout: 0, status: 'draft', audienceSegmentId: 'internal', updatedAt: '1 hr ago', evaluations: 0, lastReceipt: null, rule: { id: 'rule_invite_1', attribute: 'email_domain', operator: 'is_not_one_of', value: 'getdom.studio' } }),
			staging: createEnvironment({ version: 3, enabled: true, rollout: 100, status: 'healthy', audienceSegmentId: 'internal', updatedAt: '36 min ago', evaluations: 164, lastReceipt: 'release_8018' }),
			development: createEnvironment({ version: 2, enabled: true, rollout: 100, status: 'healthy', audienceSegmentId: 'everyone', updatedAt: 'Yesterday', evaluations: 42, lastReceipt: 'release_7702' }),
		},
	},
	{
		id: 'ai-summary',
		key: 'support.ai_summary',
		name: 'AI support summaries',
		description: 'Summarize long support conversations before agents write a reply.',
		ownerId: 'support',
		type: 'kill-switch',
		risk: 'high',
		environments: {
			production: createEnvironment({
				version: 11,
				enabled: true,
				rollout: 78,
				status: 'watch',
				audienceSegmentId: 'support_english',
				updatedAt: '4 min ago',
				evaluations: 38406,
				lastReceipt: 'release_8120',
				rule: { id: 'rule_summary_3', attribute: 'region', operator: 'is_not_one_of', value: 'healthcare-restricted' },
				metrics: [
					metric('Escalation rate', '2.4%', '< 4.0%', 'passed', 'Down 0.8%'),
					metric('Summary edit rate', '18%', '< 15%', 'warning', 'Above threshold'),
					metric('Average handle time', '-1m 42s', '< 0s', 'passed', 'Improved'),
				],
			}),
			staging: createEnvironment({ version: 8, enabled: true, rollout: 100, status: 'healthy', audienceSegmentId: 'support_english', updatedAt: '48 min ago', evaluations: 604, lastReceipt: 'release_8094' }),
			development: createEnvironment({ version: 6, enabled: true, rollout: 100, status: 'healthy', audienceSegmentId: 'everyone', updatedAt: 'Yesterday', evaluations: 183, lastReceipt: 'release_7681' }),
		},
	},
];

let sequence = 8800;
let featureFlagState = createState();

/**
 * Returns the complete feature-release workspace.
 *
 * @returns {object} Flags, selected environment, release evidence, catalogs, and exact revisions.
 */
export function getFeatureFlagWorkspace() {
	return serializeWorkspace();
}

/**
 * Restores the deterministic feature-flag demo state.
 *
 * @returns {object} Reset feature-release workspace.
 */
export function resetFeatureFlagWorkspace() {
	sequence = 8800;
	featureFlagState = createState();
	return serializeWorkspace();
}

/**
 * Persists the selected flag and environment using the exact workspace revision.
 *
 * @param {object} input Selection identifiers and current workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function selectFeatureFlagContext(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const flag = findFlag(input.flagId);
	if (!flag) return error('The selected feature flag no longer exists.', 404);
	if (!environmentOptions.some((option) => option.value === input.environmentId)) return error('Choose an available environment.', 422);
	featureFlagState.selectedFlagId = flag.id;
	featureFlagState.selectedEnvironmentId = input.environmentId;
	clearTransientReleaseState();
	commit('Release context changed', `${flag.key} · ${input.environmentId}`);
	return serializeWorkspace();
}

/**
 * Creates a disabled feature flag in every environment.
 *
 * @param {object} input New flag fields and current workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function createFeatureFlag(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const name = String(input.name || '').trim();
	const key = String(input.key || '').trim();
	const description = String(input.description || '').trim();
	if (name.length < 4) return error('Flag name must contain at least 4 characters.', 422);
	if (!/^[a-z][a-z0-9_.-]{4,79}$/.test(key)) return error('Use a lowercase flag key with at least 5 letters, numbers, dots, dashes, or underscores.', 422);
	if (featureFlagState.flags.some((flag) => flag.key === key)) return error('That flag key is already in use.', 409);
	if (description.length < 12) return error('Describe the user-facing behavior this flag controls.', 422);
	if (!ownerOptions.some((option) => option.value === input.ownerId)) return error('Choose an available owner.', 422);
	if (!flagTypeOptions.some((option) => option.value === input.type)) return error('Choose a supported flag type.', 422);
	const id = `flag_${nextId('created')}`;
	const flag = {
		id,
		key,
		name,
		description,
		ownerId: input.ownerId,
		type: input.type,
		risk: input.type === 'kill-switch' ? 'high' : 'low',
		environments: Object.fromEntries(environmentOptions.map((option) => [option.value, createEnvironment({
			version: 1,
			enabled: false,
			rollout: 0,
			status: 'draft',
			audienceSegmentId: 'internal',
			updatedAt: 'Just now',
			evaluations: 0,
			lastReceipt: null,
		})])),
	};
	featureFlagState.flags.unshift(flag);
	featureFlagState.selectedFlagId = flag.id;
	featureFlagState.selectedEnvironmentId = 'production';
	featureFlagState.createReceipt = {
		id: nextId('flag_receipt'),
		flagId: flag.id,
		flagKey: flag.key,
		createdBy: currentOperator.name,
		createdAt: 'Just now',
	};
	clearTransientReleaseState({ preserveCreateReceipt: true });
	commit('Feature flag created', flag.key);
	return serializeWorkspace();
}

/**
 * Creates an immutable preview for rollout, targeting, and rule changes.
 *
 * @param {object} input Proposed release fields and exact revisions.
 * @returns {object} Workspace with a release preview or API error.
 */
export function previewFeatureFlagChange(input = {}) {
	const context = requireSelectedContext(input);
	if (context.error) return context;
	const draftResult = normalizeDraft(input, context.config);
	if (draftResult.error) return draftResult;
	const changes = diffConfiguration(context.config, draftResult.draft);
	if (!changes.length) return error('Change at least one release or targeting setting before previewing.', 422);
	const guardrailFailure = context.config.metrics.find((item) => item.state === 'breach');
	if (draftResult.draft.rollout > context.config.rollout && guardrailFailure) return error(`${guardrailFailure.label} is breaching its release threshold. Reduce traffic or resolve the guardrail first.`, 409);
	const requiresApproval = featureFlagState.selectedEnvironmentId === 'production' && (
		draftResult.draft.enabled !== context.config.enabled
		|| draftResult.draft.rollout > context.config.rollout
		|| context.flag.risk === 'high'
	);
	featureFlagState.preview = {
		id: nextId('preview'),
		checksum: nextId('cfg_sha'),
		flagId: context.flag.id,
		environmentId: featureFlagState.selectedEnvironmentId,
		sourceVersion: context.config.version,
		draft: draftResult.draft,
		changes,
		requiresApproval,
		estimatedContexts: estimateContexts(draftResult.draft.audienceSegmentId, draftResult.draft.rollout),
		checks: buildPreviewChecks(context, draftResult.draft),
		createdBy: currentOperator.name,
		createdAt: 'Just now',
	};
	featureFlagState.approval = null;
	featureFlagState.rollbackPreview = null;
	commit('Release change previewed', `${context.flag.key} · ${changes.length} changes`);
	return serializeWorkspace();
}

/**
 * Requests an independent production approval for the current preview.
 *
 * @param {object} input Preview identifier, acknowledgement, and exact revision.
 * @returns {object} Workspace with pending approval or API error.
 */
export function requestFeatureFlagApproval(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const preview = featureFlagState.preview;
	if (!preview || preview.id !== input.previewId) return error('Preview the current release change before requesting approval.', 409);
	if (!preview.requiresApproval) return error('This non-production change is inside automated policy and does not require approval.', 422);
	if (input.acknowledged !== true) return error('Acknowledge the customer exposure and rollback policy before requesting approval.', 422);
	featureFlagState.approval = {
		id: nextId('approval'),
		previewId: preview.id,
		checksum: preview.checksum,
		status: 'pending',
		requestedBy: currentOperator.name,
		reviewer: releaseReviewer.name,
		reason: preview.draft.reason,
		createdAt: 'Just now',
		decisionAt: null,
		decisionNote: '',
	};
	commit('Production approval requested', `${releaseReviewer.name} · ${preview.checksum}`);
	return serializeWorkspace();
}

/**
 * Records the independent release manager's approval decision.
 *
 * @param {string} approvalId Approval request identifier.
 * @param {object} input Decision, note, and exact workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function decideFeatureFlagApproval(approvalId, input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const approval = featureFlagState.approval;
	if (!approval || approval.id !== approvalId) return error('The approval request no longer exists.', 404);
	if (approval.status !== 'pending') return error('This approval request already has a decision.', 409);
	if (!['approved', 'rejected'].includes(input.decision)) return error('Choose approve or reject.', 422);
	const note = String(input.note || '').trim();
	if (note.length < 8) return error('Add a decision note with at least 8 characters.', 422);
	approval.status = input.decision;
	approval.decisionAt = 'Just now';
	approval.decisionNote = note;
	approval.decidedBy = releaseReviewer.name;
	commit(`Release change ${input.decision}`, `${releaseReviewer.name} · ${note}`);
	return serializeWorkspace();
}

/**
 * Publishes an approved, acknowledged release preview to the selected environment.
 *
 * @param {object} input Preview evidence, acknowledgement, and exact workspace revision.
 * @returns {object} Updated workspace with immutable publication proof or API error.
 */
export function publishFeatureFlagChange(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const preview = featureFlagState.preview;
	if (!preview || preview.id !== input.previewId || preview.checksum !== input.checksum) return error('The release preview is missing or no longer matches this request.', 409);
	const flag = findFlag(preview.flagId);
	const config = flag?.environments?.[preview.environmentId];
	if (!flag || !config) return error('The release target no longer exists.', 404);
	if (config.version !== preview.sourceVersion) return error(`Flag configuration changed from version ${preview.sourceVersion} to ${config.version}. Preview the release again.`, 409);
	if (preview.requiresApproval && featureFlagState.approval?.status !== 'approved') return error('An independent production approval is required before publication.', 409);
	if (input.acknowledged !== true) return error('Acknowledge that this change will alter evaluated traffic.', 422);
	const prior = snapshotConfiguration(config);
	applyDraft(config, preview.draft);
	config.previousSnapshot = prior;
	config.version += 1;
	config.updatedAt = 'Just now';
	config.status = config.enabled && config.rollout > 0 ? 'monitoring' : 'paused';
	config.lastReceipt = nextId('release');
	featureFlagState.publishReceipt = {
		id: config.lastReceipt,
		checksum: preview.checksum,
		flagKey: flag.key,
		environmentId: preview.environmentId,
		configurationVersion: config.version,
		auditReceipt: nextId('audit'),
		streamReceipt: nextId('stream'),
		evaluatorsAcknowledged: 14,
		publishedBy: currentOperator.name,
		publishedAt: 'Just now',
	};
	featureFlagState.preview = null;
	featureFlagState.approval = null;
	featureFlagState.rollbackPreview = null;
	commit('Feature flag change published', `${flag.key} · ${config.rollout}% · ${config.lastReceipt}`);
	return serializeWorkspace();
}

/**
 * Advances deterministic monitoring evidence after a published release.
 *
 * @param {object} input Exact workspace and flag configuration revisions.
 * @returns {object} Updated workspace or API error.
 */
export function advanceFeatureFlagMonitoring(input = {}) {
	const context = requireSelectedContext(input);
	if (context.error) return context;
	if (context.config.status !== 'monitoring') return error('Publish a rollout change before advancing monitoring.', 409);
	context.config.status = 'healthy';
	context.config.version += 1;
	context.config.evaluations += Math.max(320, Math.round(context.config.rollout * 19));
	context.config.metrics = context.config.metrics.map((item, index) => ({
		...item,
		state: 'passed',
		trend: index === 0 ? 'Stable after release' : item.trend,
	}));
	featureFlagState.monitoringReceipt = {
		id: nextId('monitor'),
		flagId: context.flag.id,
		environmentId: featureFlagState.selectedEnvironmentId,
		configurationVersion: context.config.version,
		window: '30-minute',
		result: 'All guardrails passed',
		createdAt: 'Just now',
	};
	commit('Release monitoring completed', `${context.flag.key} · all guardrails passed`);
	return serializeWorkspace();
}

/**
 * Evaluates a test context against the live or previewed configuration.
 *
 * @param {object} input Context attributes and exact workspace revision.
 * @returns {object} Workspace with deterministic evaluation evidence or API error.
 */
export function evaluateFeatureFlagContext(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const flag = selectedFlag();
	const liveConfig = selectedConfiguration();
	if (!flag || !liveConfig) return error('Choose a valid flag and environment.', 404);
	const contextKey = String(input.contextKey || '').trim();
	if (contextKey.length < 4) return error('Add a context key with at least 4 characters.', 422);
	if (!contextSegmentOptions.some((option) => option.value === input.segmentId)) return error('Choose an available test segment.', 422);
	if (!regionOptions.some((option) => option.value === input.region)) return error('Choose an available test region.', 422);
	const config = input.usePreview === true && featureFlagState.preview?.flagId === flag.id
		? featureFlagState.preview.draft
		: liveConfig;
	const bucket = stableBucket(`${contextKey}:${flag.key}`);
	const segmentMatch = config.audienceSegmentId === 'everyone' || config.audienceSegmentId === input.segmentId;
	const ruleMatch = evaluateRule(config.rule, input);
	const served = config.enabled && segmentMatch && ruleMatch && bucket < config.rollout;
	featureFlagState.evaluation = {
		id: nextId('evaluation'),
		flagKey: flag.key,
		environmentId: featureFlagState.selectedEnvironmentId,
		configuration: input.usePreview === true && featureFlagState.preview ? 'Preview' : 'Live',
		contextKey,
		segmentId: input.segmentId,
		region: input.region,
		bucket,
		variation: served ? 'Available' : 'Unavailable',
		matched: served,
		reason: !config.enabled
			? 'Flag is disabled.'
			: !segmentMatch
				? 'Context is outside the selected audience.'
				: !ruleMatch
					? 'Context failed the targeting condition.'
					: bucket >= config.rollout
						? `Context bucket ${bucket} is outside the ${config.rollout}% rollout.`
						: 'Context matched the audience, rule, and percentage rollout.',
		receipt: nextId('eval_receipt'),
		createdAt: 'Just now',
	};
	commit('Test context evaluated', `${contextKey} · ${featureFlagState.evaluation.variation}`);
	return serializeWorkspace();
}

/**
 * Creates immutable rollback evidence from the latest successful release snapshot.
 *
 * @param {object} input Exact workspace and configuration revisions.
 * @returns {object} Workspace with rollback preview or API error.
 */
export function previewFeatureFlagRollback(input = {}) {
	const context = requireSelectedContext(input);
	if (context.error) return context;
	if (!context.config.previousSnapshot) return error('No previous published configuration is available for rollback.', 409);
	featureFlagState.rollbackPreview = {
		id: nextId('rollback_preview'),
		checksum: nextId('rollback_sha'),
		flagId: context.flag.id,
		environmentId: featureFlagState.selectedEnvironmentId,
		sourceVersion: context.config.version,
		current: snapshotConfiguration(context.config),
		restore: clone(context.config.previousSnapshot),
		createdAt: 'Just now',
	};
	commit('Rollback previewed', `${context.flag.key} · version ${context.config.version}`);
	return serializeWorkspace();
}

/**
 * Restores the exact prior configuration after acknowledgement.
 *
 * @param {object} input Rollback evidence, acknowledgement, and exact workspace revision.
 * @returns {object} Updated workspace with rollback receipt or API error.
 */
export function rollbackFeatureFlag(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const preview = featureFlagState.rollbackPreview;
	if (!preview || preview.id !== input.previewId || preview.checksum !== input.checksum) return error('Preview the current rollback before restoring a configuration.', 409);
	if (input.acknowledged !== true) return error('Acknowledge that rollback changes evaluated customer traffic.', 422);
	const flag = findFlag(preview.flagId);
	const config = flag?.environments?.[preview.environmentId];
	if (!flag || !config) return error('The rollback target no longer exists.', 404);
	if (config.version !== preview.sourceVersion) return error('The flag changed after this rollback preview. Preview it again.', 409);
	const rolledBackFrom = snapshotConfiguration(config);
	Object.assign(config, clone(preview.restore));
	config.previousSnapshot = rolledBackFrom;
	config.version = preview.sourceVersion + 1;
	config.updatedAt = 'Just now';
	config.status = 'monitoring';
	config.lastReceipt = nextId('rollback');
	featureFlagState.rollbackReceipt = {
		id: config.lastReceipt,
		flagKey: flag.key,
		environmentId: preview.environmentId,
		configurationVersion: config.version,
		checksum: preview.checksum,
		streamReceipt: nextId('stream'),
		rolledBackBy: currentOperator.name,
		rolledBackAt: 'Just now',
	};
	featureFlagState.rollbackPreview = null;
	featureFlagState.preview = null;
	featureFlagState.approval = null;
	commit('Feature flag rolled back', `${flag.key} · ${config.lastReceipt}`);
	return serializeWorkspace();
}

/**
 * Builds one environment configuration with realistic defaults.
 *
 * @param {object} overrides Configuration overrides.
 * @returns {object} Normalized environment configuration.
 */
function createEnvironment(overrides = {}) {
	return {
		version: 1,
		enabled: false,
		rollout: 0,
		status: 'draft',
		audienceSegmentId: 'internal',
		updatedAt: 'Never',
		evaluations: 0,
		lastReceipt: null,
		rule: { id: 'rule_default', attribute: 'plan', operator: 'is_one_of', value: 'Scale' },
		metrics: [
			metric('Error rate', '0.12%', '< 0.50%', 'passed', 'Stable'),
			metric('P95 latency', '176 ms', '< 250 ms', 'passed', 'Stable'),
			metric('Primary conversion', '+1.8%', '> -1.0%', 'passed', 'Above baseline'),
		],
		previousSnapshot: null,
		...overrides,
	};
}

/**
 * Creates a release guardrail metric record.
 *
 * @param {string} label Metric label.
 * @param {string} value Current metric value.
 * @param {string} threshold Release threshold.
 * @param {'passed'|'warning'|'breach'} state Current guardrail state.
 * @param {string} trend Supporting trend text.
 * @returns {object} Guardrail metric.
 */
function metric(label, value, threshold, state, trend) {
	return { id: `metric_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, label, value, threshold, state, trend };
}

/**
 * Creates the deterministic process-memory workspace.
 *
 * @returns {object} Mutable feature-flag demo state.
 */
function createState() {
	return {
		revision: 41,
		selectedFlagId: 'wallet-checkout',
		selectedEnvironmentId: 'production',
		flags: clone(flagSeeds),
		preview: null,
		approval: null,
		publishReceipt: null,
		monitoringReceipt: null,
		rollbackPreview: null,
		rollbackReceipt: null,
		evaluation: null,
		createReceipt: null,
		activity: [
			activity('Release bot', 'Guardrails passed for 2 hours', 'checkout.wallet_express · production', '42 min ago'),
			activity('Maya Chen', 'Raised rollout from 20% to 32%', 'checkout.wallet_express · release_8042', 'Today · 12:20'),
			activity('Ava Morgan', 'Approved production exposure', 'checkout.wallet_express · cfg_sha_8038', 'Today · 12:16'),
			activity('Lee Morgan', 'Paused restricted healthcare traffic', 'support.ai_summary · production', 'Today · 11:48'),
		],
	};
}

/**
 * Serializes state without exposing mutable process-memory references.
 *
 * @returns {object} Client-safe workspace payload.
 */
function serializeWorkspace() {
	const flag = selectedFlag();
	const config = selectedConfiguration();
	return clone({
		revision: featureFlagState.revision,
		selectedFlagId: featureFlagState.selectedFlagId,
		selectedEnvironmentId: featureFlagState.selectedEnvironmentId,
		currentOperator,
		reviewer: releaseReviewer,
		flags: featureFlagState.flags.map((item) => serializeFlagSummary(item)),
		selectedFlag: flag ? {
			...flag,
			environments: undefined,
			owner: ownerOptions.find((option) => option.value === flag.ownerId)?.label || flag.ownerId,
			config,
			readiness: buildReadiness(flag, config),
		} : null,
		preview: featureFlagState.preview,
		approval: featureFlagState.approval,
		publishReceipt: featureFlagState.publishReceipt,
		monitoringReceipt: featureFlagState.monitoringReceipt,
		rollbackPreview: featureFlagState.rollbackPreview,
		rollbackReceipt: featureFlagState.rollbackReceipt,
		evaluation: featureFlagState.evaluation,
		createReceipt: featureFlagState.createReceipt,
		activity: featureFlagState.activity,
		catalogs: {
			environments: environmentOptions,
			owners: ownerOptions,
			segments: segmentOptions,
			attributes: attributeOptions,
			operators: operatorOptions,
			flagTypes: flagTypeOptions,
			contextSegments: contextSegmentOptions,
			regions: regionOptions,
		},
	});
}

/**
 * Builds the flag inventory row for the selected environment.
 *
 * @param {object} flag Feature flag record.
 * @returns {object} Flag summary for the active environment.
 */
function serializeFlagSummary(flag) {
	const config = flag.environments[featureFlagState.selectedEnvironmentId];
	return {
		id: flag.id,
		key: flag.key,
		name: flag.name,
		description: flag.description,
		owner: ownerOptions.find((option) => option.value === flag.ownerId)?.label || flag.ownerId,
		risk: flag.risk,
		type: flag.type,
		status: config.status,
		enabled: config.enabled,
		rollout: config.rollout,
		version: config.version,
		updatedAt: config.updatedAt,
	};
}

/**
 * Returns the currently selected flag.
 *
 * @returns {object|null} Selected feature flag.
 */
function selectedFlag() {
	return findFlag(featureFlagState.selectedFlagId);
}

/**
 * Returns the selected flag's selected environment configuration.
 *
 * @returns {object|null} Environment configuration.
 */
function selectedConfiguration() {
	return selectedFlag()?.environments?.[featureFlagState.selectedEnvironmentId] || null;
}

/**
 * Finds a feature flag by identifier.
 *
 * @param {unknown} flagId Candidate flag identifier.
 * @returns {object|null} Matching feature flag.
 */
function findFlag(flagId) {
	return featureFlagState.flags.find((flag) => flag.id === String(flagId || '')) || null;
}

/**
 * Validates exact workspace and selected-configuration revisions.
 *
 * @param {object} input Current workspace and flag versions.
 * @returns {{flag: object, config: object}|object} Context or API error.
 */
function requireSelectedContext(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const flag = selectedFlag();
	const config = selectedConfiguration();
	if (!flag || !config) return error('The selected flag configuration no longer exists.', 404);
	if (String(input.flagId || '') !== flag.id) return error('The selected flag changed. Refresh before continuing.', 409);
	if (String(input.environmentId || '') !== featureFlagState.selectedEnvironmentId) return error('The selected environment changed. Refresh before continuing.', 409);
	if (Number(input.flagVersion) !== config.version) return error(`Flag configuration changed from version ${input.flagVersion} to ${config.version}. Refresh before continuing.`, 409);
	return { flag, config };
}

/**
 * Validates the exact workspace revision.
 *
 * @param {unknown} revision Candidate workspace revision.
 * @returns {object|null} API error when stale, otherwise null.
 */
function requireRevision(revision) {
	if (Number(revision) !== featureFlagState.revision) return error(`Workspace changed from revision ${revision} to ${featureFlagState.revision}. Refresh before continuing.`, 409);
	return null;
}

/**
 * Normalizes and validates a proposed release configuration.
 *
 * @param {object} input Raw proposed fields.
 * @param {object} config Current live configuration.
 * @returns {{draft: object}|object} Normalized draft or API error.
 */
function normalizeDraft(input, config) {
	const enabled = input.enabled === true;
	const rollout = Number(input.rollout);
	const reason = String(input.reason || '').trim();
	const audienceSegmentId = String(input.audienceSegmentId || '');
	const attribute = String(input.attribute || '');
	const operator = String(input.operator || '');
	const value = String(input.value || '').trim();
	if (!Number.isInteger(rollout) || rollout < 0 || rollout > 100) return error('Choose a rollout percentage from 0 to 100.', 422);
	if (!enabled && rollout !== 0) return error('Set rollout to 0% when the flag is disabled.', 422);
	if (enabled && rollout === 0) return error('Choose at least 1% rollout when the flag is enabled.', 422);
	if (!segmentOptions.some((option) => option.value === audienceSegmentId)) return error('Choose an available audience segment.', 422);
	if (!attributeOptions.some((option) => option.value === attribute)) return error('Choose a supported context attribute.', 422);
	if (!operatorOptions.some((option) => option.value === operator)) return error('Choose a supported targeting operator.', 422);
	if (value.length < 2) return error('Add a targeting value with at least 2 characters.', 422);
	if (operator === 'greater_than' && (!Number.isFinite(Number(value)) || Number(value) < 0)) return error('The greater-than operator requires a positive numeric value.', 422);
	if (reason.length < 12) return error('Add a release reason with at least 12 characters.', 422);
	return {
		draft: {
			enabled,
			rollout,
			audienceSegmentId,
			rule: {
				id: config.rule.id,
				attribute,
				operator,
				value,
			},
			reason,
			metrics: clone(config.metrics),
		},
	};
}

/**
 * Describes changes between live and proposed configurations.
 *
 * @param {object} config Current configuration.
 * @param {object} draft Proposed configuration.
 * @returns {Array<object>} Human-readable field differences.
 */
function diffConfiguration(config, draft) {
	const fields = [
		['enabled', 'Serving state', config.enabled ? 'Enabled' : 'Disabled', draft.enabled ? 'Enabled' : 'Disabled'],
		['rollout', 'Rollout', `${config.rollout}%`, `${draft.rollout}%`],
		['audienceSegmentId', 'Audience', segmentLabel(config.audienceSegmentId), segmentLabel(draft.audienceSegmentId)],
		['attribute', 'Rule attribute', attributeLabel(config.rule.attribute), attributeLabel(draft.rule.attribute)],
		['operator', 'Rule operator', operatorLabel(config.rule.operator), operatorLabel(draft.rule.operator)],
		['value', 'Rule value', config.rule.value, draft.rule.value],
	];
	return fields.filter(([, , before, after]) => before !== after).map(([field, label, before, after]) => ({ field, label, before, after }));
}

/**
 * Builds server-owned preview checks.
 *
 * @param {{flag: object, config: object}} context Selected flag context.
 * @param {object} draft Proposed release draft.
 * @returns {Array<object>} Release safety checks.
 */
function buildPreviewChecks(context, draft) {
	const warningCount = context.config.metrics.filter((item) => item.state === 'warning').length;
	return [
		{ id: 'permission', label: 'Release permission', state: 'passed', detail: `${currentOperator.name} can publish ${featureFlagState.selectedEnvironmentId} flag changes.` },
		{ id: 'targeting', label: 'Targeting contract', state: 'passed', detail: `${segmentLabel(draft.audienceSegmentId)} with ${attributeLabel(draft.rule.attribute)} ${operatorLabel(draft.rule.operator)} ${draft.rule.value}.` },
		{ id: 'guardrails', label: 'Guardrail evidence', state: warningCount ? 'warning' : 'passed', detail: warningCount ? `${warningCount} metric needs acknowledgement before exposure increases.` : 'All linked metrics are inside release thresholds.' },
		{ id: 'rollback', label: 'Rollback path', state: 'passed', detail: context.config.lastReceipt ? `Restore point ${context.config.lastReceipt} is available.` : 'The first publication will create a restore point.' },
	];
}

/**
 * Builds release readiness evidence for the selected flag.
 *
 * @param {object} flag Selected flag.
 * @param {object} config Selected environment configuration.
 * @returns {object} Readiness summary and checks.
 */
function buildReadiness(flag, config) {
	if (!flag || !config) return { score: 0, checks: [] };
	const checks = [
		{ id: 'owner', label: 'Accountable owner', state: flag.ownerId ? 'passed' : 'warning', detail: ownerOptions.find((option) => option.value === flag.ownerId)?.label || 'Owner missing' },
		{ id: 'rule', label: 'Targeting rule', state: config.rule?.value ? 'passed' : 'warning', detail: `${attributeLabel(config.rule?.attribute)} ${operatorLabel(config.rule?.operator)} ${config.rule?.value || 'not configured'}` },
		{ id: 'metrics', label: 'Release health', state: config.metrics.some((item) => item.state === 'breach') ? 'breach' : config.metrics.some((item) => item.state === 'warning') ? 'warning' : 'passed', detail: `${config.metrics.filter((item) => item.state === 'passed').length} of ${config.metrics.length} metrics passing` },
		{ id: 'restore', label: 'Restore point', state: config.lastReceipt ? 'passed' : 'warning', detail: config.lastReceipt || 'Created on first publication' },
	];
	const passing = checks.filter((item) => item.state === 'passed').length;
	return { score: Math.round((passing / checks.length) * 100), checks };
}

/**
 * Applies a validated release draft to a live environment configuration.
 *
 * @param {object} config Mutable live configuration.
 * @param {object} draft Validated release draft.
 * @returns {void}
 */
function applyDraft(config, draft) {
	config.enabled = draft.enabled;
	config.rollout = draft.rollout;
	config.audienceSegmentId = draft.audienceSegmentId;
	config.rule = clone(draft.rule);
}

/**
 * Captures the rollback-safe configuration fields.
 *
 * @param {object} config Environment configuration.
 * @returns {object} Immutable restore snapshot.
 */
function snapshotConfiguration(config) {
	return {
		enabled: config.enabled,
		rollout: config.rollout,
		status: config.status,
		audienceSegmentId: config.audienceSegmentId,
		rule: clone(config.rule),
		metrics: clone(config.metrics),
		evaluations: config.evaluations,
		lastReceipt: config.lastReceipt,
	};
}

/**
 * Evaluates the configured demonstration rule against a test context.
 *
 * @param {object} rule Targeting rule.
 * @param {object} input Test context.
 * @returns {boolean} Whether the rule matches.
 */
function evaluateRule(rule, input) {
	if (!rule) return true;
	const contextValue = rule.attribute === 'region'
		? input.region
		: rule.attribute === 'workspace_age_days'
			? 48
			: rule.attribute === 'email_domain'
				? 'northstar.example'
				: input.segmentId === 'beta_scale_eu' ? 'Scale' : 'Starter';
	const values = String(rule.value || '').split(',').map((value) => value.trim()).filter(Boolean);
	if (rule.operator === 'is_one_of') return values.includes(String(contextValue));
	if (rule.operator === 'is_not_one_of') return !values.includes(String(contextValue));
	if (rule.operator === 'greater_than') return Number(contextValue) > Number(rule.value);
	if (rule.operator === 'ends_with') return values.some((value) => String(contextValue).endsWith(value));
	return false;
}

/**
 * Produces a stable rollout bucket for repeatable demo evaluations.
 *
 * @param {string} value Context and flag key.
 * @returns {number} Bucket from 0 through 99.
 */
function stableBucket(value) {
	let hash = 0;
	for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
	return Math.abs(hash) % 100;
}

/**
 * Estimates impacted contexts for an audience and percentage.
 *
 * @param {string} segmentId Audience segment identifier.
 * @param {number} rollout Rollout percentage.
 * @returns {number} Estimated evaluated contexts.
 */
function estimateContexts(segmentId, rollout) {
	const sizes = { beta_scale_eu: 1842, internal: 248, support_english: 3460, everyone: 18420 };
	return Math.round((sizes[segmentId] || 0) * (rollout / 100));
}

/**
 * Clears release evidence that is scoped to one selected context.
 *
 * @param {{preserveCreateReceipt?: boolean}} options Clear options.
 * @returns {void}
 */
function clearTransientReleaseState(options = {}) {
	featureFlagState.preview = null;
	featureFlagState.approval = null;
	featureFlagState.publishReceipt = null;
	featureFlagState.monitoringReceipt = null;
	featureFlagState.rollbackPreview = null;
	featureFlagState.rollbackReceipt = null;
	featureFlagState.evaluation = null;
	if (!options.preserveCreateReceipt) featureFlagState.createReceipt = null;
}

/**
 * Commits one workspace mutation and records its activity.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commit(title, detail) {
	featureFlagState.revision += 1;
	featureFlagState.activity.unshift(activity(currentOperator.name, title, detail, 'Just now'));
}

/**
 * Creates a release activity record.
 *
 * @param {string} actor Activity actor.
 * @param {string} title Activity title.
 * @param {string} detail Supporting detail.
 * @param {string} time Display time.
 * @returns {object} Activity row.
 */
function activity(actor, title, detail, time) {
	return { id: nextId('activity'), actor, title, detail, time };
}

/**
 * Resolves a segment label.
 *
 * @param {unknown} value Segment identifier.
 * @returns {string} Human-readable label.
 */
function segmentLabel(value) {
	return segmentOptions.find((option) => option.value === value)?.label || String(value || 'Unknown');
}

/**
 * Resolves an attribute label.
 *
 * @param {unknown} value Attribute identifier.
 * @returns {string} Human-readable label.
 */
function attributeLabel(value) {
	return attributeOptions.find((option) => option.value === value)?.label || String(value || 'Unknown');
}

/**
 * Resolves an operator label.
 *
 * @param {unknown} value Operator identifier.
 * @returns {string} Human-readable label.
 */
function operatorLabel(value) {
	return operatorOptions.find((option) => option.value === value)?.label || String(value || 'Unknown');
}

/**
 * Returns a monotonically increasing deterministic identifier.
 *
 * @param {string} prefix Identifier prefix.
 * @returns {string} New identifier.
 */
function nextId(prefix) {
	sequence += 1;
	return `${prefix}_${sequence}`;
}

/**
 * Creates a conventional API error payload.
 *
 * @param {string} message Human-readable error message.
 * @param {number} status HTTP status code.
 * @returns {object} Error payload.
 */
function error(message, status) {
	return { error: message, status };
}

/**
 * Deep-clones JSON-compatible deterministic demo data.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Detached clone.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
