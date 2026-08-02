const environments = [
	{ value: 'production', label: 'Production', description: 'Customer data in the primary product environment.' },
	{ value: 'staging', label: 'Staging', description: 'Pre-production test data and imported fixtures.' },
	{ value: 'eu', label: 'EU region', description: 'EU-resident customer data with regional policy overrides.' },
];

const actionOptions = [
	{ value: 'archive-delete', label: 'Archive, then delete', description: 'Move eligible records to cold storage before permanent deletion.' },
	{ value: 'anonymize-delete', label: 'Anonymize, then delete', description: 'Remove personal fields before the deletion window completes.' },
	{ value: 'archive-only', label: 'Archive only', description: 'Retain records in cold storage without a deletion job.' },
	{ value: 'delete', label: 'Delete permanently', description: 'Delete eligible records without creating an archive copy.' },
];

const basisOptions = [
	{ value: 'contract', label: 'Contract performance', description: 'Retain data while it is required to provide the service.' },
	{ value: 'legitimate-interest', label: 'Legitimate interest', description: 'Retain limited data for security, reliability, or product operation.' },
	{ value: 'legal-obligation', label: 'Legal obligation', description: 'Retain records required by law or regulatory controls.' },
	{ value: 'consent', label: 'Customer consent', description: 'Retention depends on a revocable customer choice.' },
];

const dataClasses = [
	{
		id: 'messages',
		name: 'Customer messages',
		description: 'Chat transcripts, attachments, reactions, and delivery metadata.',
		owner: 'Support Ops',
		recordCount: 18420,
		bytes: 4800000000,
		risk: 'medium',
		icon: 'M5 6h14v9H9l-4 4V6Z',
	},
	{
		id: 'files',
		name: 'Uploaded files',
		description: 'Documents, images, and generated exports attached to projects.',
		owner: 'Product',
		recordCount: 9864,
		bytes: 42800000000,
		risk: 'high',
		icon: 'M7 3h7l4 4v14H7V3Zm7 0v5h5',
	},
	{
		id: 'analytics',
		name: 'Analytics events',
		description: 'Usage telemetry used for product analytics and adoption reports.',
		owner: 'Data',
		recordCount: 2100480,
		bytes: 12400000000,
		risk: 'low',
		icon: 'M5 20V10m7 10V4m7 16v-7',
	},
	{
		id: 'support',
		name: 'Support cases',
		description: 'Customer requests, internal notes, escalation evidence, and CSAT.',
		owner: 'Customer Success',
		recordCount: 42670,
		bytes: 7600000000,
		risk: 'medium',
		icon: 'M4 5h16v12H8l-4 4V5Zm4 5h8M8 13h5',
	},
	{
		id: 'audit',
		name: 'Audit events',
		description: 'Immutable access, security, billing, and administration evidence.',
		owner: 'Security',
		recordCount: 684210,
		bytes: 9100000000,
		risk: 'high',
		icon: 'M6 3h12v18H6V3Zm3 5h6m-6 4h6m-6 4h4',
	},
];

const policies = new Map();
const runsByPolicy = new Map();
const holds = [
	createHold({ id: 'hold_dispute', name: 'Enterprise dispute', dataClassId: 'messages', environment: 'production', recordCount: 240, owner: 'Legal', reason: 'Preserve correspondence for active contract litigation.', expiresOn: '' }),
	createHold({ id: 'hold_security', name: 'Security investigation', dataClassId: 'files', environment: 'production', recordCount: 42, owner: 'Security', reason: 'Preserve uploaded evidence while the incident remains open.', expiresOn: '2026-08-28' }),
	createHold({ id: 'hold_billing', name: 'Billing evidence', dataClassId: 'support', environment: 'production', recordCount: 13, owner: 'Finance', reason: 'Retain account communications for an active charge dispute.', expiresOn: '2026-09-05' }),
];

let holdSequence = 3;
let runSequence = 880;

initializePolicies();

/**
 * Returns workspace context, policy summaries, legal holds, and rich controls.
 *
 * @returns {Record<string, unknown>} Retention workspace bootstrap payload.
 */
export function getDataRetentionBootstrap() {
	return {
		workspace: { id: 'wrk_tempo', name: 'Tempo', plan: 'Enterprise' },
		currentUser: { name: 'Avery Stone', email: 'avery@tempo.example', initials: 'AS', role: 'Security admin' },
		environments: cloneValue(environments),
		actionOptions: cloneValue(actionOptions),
		basisOptions: cloneValue(basisOptions),
		dataClasses: dataClasses.map(serializeDataClass),
		holds: holds.filter((hold) => hold.status === 'active').map(serializeHold),
	};
}

/**
 * Returns one policy, its current impact, holds, and execution history.
 *
 * @param {string} dataClassId Data class identifier.
 * @param {string} environment Environment identifier.
 * @returns {Record<string, unknown>} Policy workspace detail or API error.
 */
export function getDataRetentionPolicy(dataClassId, environment) {
	const policy = findPolicy(dataClassId, environment);
	if (!policy) return notFound('Retention policy');
	return serializePolicyWorkspace(policy);
}

/**
 * Calculates lifecycle impact for an unsaved policy configuration.
 *
 * @param {Record<string, unknown>} input Preview configuration.
 * @returns {Record<string, unknown>} Calculated impact or validation error.
 */
export function previewDataRetentionPolicy(input = {}) {
	const dataClass = findDataClass(input.dataClassId);
	if (!dataClass) return notFound('Data class');
	const environment = normalizeOptionValue(input.environment, environments, 'production');
	const validation = validateConfig(input.config || {});
	if (validation.error) return validation;
	const preview = calculatePreview(dataClass, environment, validation.config);
	return { preview, message: `${formatCount(preview.deleteEligible)} records are eligible for the next lifecycle window.` };
}

/**
 * Saves an editable policy draft with optimistic revision protection.
 *
 * @param {string} dataClassId Data class identifier.
 * @param {Record<string, unknown>} input Draft configuration and revision.
 * @returns {Record<string, unknown>} Saved policy workspace or API error.
 */
export function saveDataRetentionDraft(dataClassId, input = {}) {
	const policy = findPolicy(dataClassId, input.environment);
	if (!policy) return notFound('Retention policy');
	const revisionError = validateRevision(policy, input.revision);
	if (revisionError) return revisionError;
	const validation = validateConfig(input.config || {});
	if (validation.error) return validation;
	policy.config = validation.config;
	policy.revision += 1;
	policy.status = 'draft';
	policy.approvedBy = policy.config.requireApproval ? ['Legal'] : [];
	policy.updatedAt = new Date().toISOString();
	policy.updatedBy = 'Avery Stone';
	policy.lastPreview = calculatePreview(findDataClass(policy.dataClassId), policy.environment, policy.config);
	appendRun(policy.id, {
		type: 'draft',
		status: 'complete',
		label: `Draft revision ${policy.revision} saved`,
		detail: `${formatCount(policy.lastPreview.deleteEligible)} deletion-eligible records calculated`,
	});
	return { ...serializePolicyWorkspace(policy), message: 'Draft saved and impact recalculated against current legal holds.' };
}

/**
 * Records the current security administrator's approval for a saved draft.
 *
 * @param {string} dataClassId Data class identifier.
 * @param {Record<string, unknown>} input Approval revision and environment.
 * @returns {Record<string, unknown>} Approved policy workspace or API error.
 */
export function approveDataRetentionPolicy(dataClassId, input = {}) {
	const policy = findPolicy(dataClassId, input.environment);
	if (!policy) return notFound('Retention policy');
	const revisionError = validateRevision(policy, input.revision);
	if (revisionError) return revisionError;
	if (policy.status !== 'draft' && policy.status !== 'ready') return { error: 'Save a policy draft before requesting approval.', status: 422 };
	if (!policy.lastPreview?.checks?.every((check) => check.status === 'passed')) return { error: 'Resolve every safety check before approval.', status: 422 };
	if (!policy.approvedBy.includes('Security')) policy.approvedBy.push('Security');
	policy.status = requiredApprovals(policy).every((role) => policy.approvedBy.includes(role)) ? 'ready' : 'draft';
	policy.revision += 1;
	policy.updatedAt = new Date().toISOString();
	policy.updatedBy = 'Avery Stone';
	appendRun(policy.id, {
		type: 'approval',
		status: 'complete',
		label: 'Security approval recorded',
		detail: policy.status === 'ready' ? 'All required approvals are complete' : 'Additional approval is still required',
	});
	return { ...serializePolicyWorkspace(policy), message: policy.status === 'ready' ? 'Security approval recorded. The policy is ready to publish.' : 'Approval recorded.' };
}

/**
 * Publishes a signed policy version and schedules its first lifecycle run.
 *
 * @param {string} dataClassId Data class identifier.
 * @param {Record<string, unknown>} input Publish revision and environment.
 * @returns {Record<string, unknown>} Published policy workspace or API error.
 */
export function publishDataRetentionPolicy(dataClassId, input = {}) {
	const policy = findPolicy(dataClassId, input.environment);
	if (!policy) return notFound('Retention policy');
	const revisionError = validateRevision(policy, input.revision);
	if (revisionError) return revisionError;
	if (policy.config.requireApproval && policy.status !== 'ready') return { error: 'Legal and Security approval are required before publishing.', status: 422 };
	if (!policy.lastPreview?.checks?.every((check) => check.status === 'passed')) return { error: 'Recalculate impact and resolve safety checks before publishing.', status: 422 };
	policy.version += 1;
	policy.revision += 1;
	policy.status = 'active';
	policy.lastPublishedConfig = cloneValue(policy.config);
	policy.publishedAt = new Date().toISOString();
	policy.updatedAt = policy.publishedAt;
	policy.updatedBy = 'Avery Stone';
	const nextRunAt = nextRunTimestamp(policy.environment);
	policy.nextRunAt = nextRunAt;
	appendRun(policy.id, {
		type: 'lifecycle',
		status: 'scheduled',
		label: `Version ${policy.version} scheduled`,
		detail: `${formatCount(policy.lastPreview.deleteEligible)} records will be processed after hold exclusions`,
		startedAt: nextRunAt,
	});
	return {
		...serializePolicyWorkspace(policy),
		publication: {
			version: policy.version,
			policyId: policy.id,
			signedBy: 'Avery Stone',
			publishedAt: policy.publishedAt,
			nextRunAt,
			checksum: `sha256:${(Date.now() + policy.version).toString(16).padStart(16, '0')}`,
		},
		message: `Policy version ${policy.version} is active and the first run is scheduled.`,
	};
}

/**
 * Creates a legal hold that overrides matching lifecycle deletion jobs.
 *
 * @param {Record<string, unknown>} input Legal hold configuration.
 * @returns {Record<string, unknown>} Created hold or validation error.
 */
export function createDataRetentionHold(input = {}) {
	const name = normalizeText(input.name, 80);
	const reason = normalizeText(input.reason, 240);
	const dataClass = findDataClass(input.dataClassId);
	const environment = normalizeOptionValue(input.environment, environments, 'production');
	const requestedRecordCount = Math.floor(Number(input.recordCount));
	if (name.length < 4) return { error: 'Give the legal hold a name with at least 4 characters.', status: 422 };
	if (!dataClass) return notFound('Data class');
	if (reason.length < 12) return { error: 'Explain why these records must be preserved.', status: 422 };
	if (!Number.isFinite(requestedRecordCount) || requestedRecordCount < 1) return { error: 'Enter at least one record for the legal hold scope.', status: 422 };
	const recordCount = Math.min(dataClass.recordCount, requestedRecordCount);
	holdSequence += 1;
	const hold = createHold({
		id: `hold_${holdSequence}`,
		name,
		dataClassId: dataClass.id,
		environment,
		recordCount,
		owner: 'Security',
		reason,
		expiresOn: normalizeDate(input.expiresOn),
	});
	holds.unshift(hold);
	return { hold: serializeHold(hold), message: `${formatCount(recordCount)} ${dataClass.name.toLowerCase()} records are now protected.` };
}

/**
 * Releases an active legal hold with optimistic revision protection.
 *
 * @param {string} holdId Legal hold identifier.
 * @param {Record<string, unknown>} input Release reason and revision.
 * @returns {Record<string, unknown>} Released hold or API error.
 */
export function releaseDataRetentionHold(holdId, input = {}) {
	const hold = holds.find((item) => item.id === String(holdId));
	if (!hold) return notFound('Legal hold');
	if (Number(input.revision) !== hold.revision) return { error: 'This legal hold changed while you were reviewing it. Refresh and try again.', status: 409 };
	if (hold.status !== 'active') return { error: 'This legal hold has already been released.', status: 409 };
	const reason = normalizeText(input.reason, 180);
	if (reason.length < 8) return { error: 'Add a release reason with at least 8 characters.', status: 422 };
	hold.status = 'released';
	hold.releaseReason = reason;
	hold.releasedAt = new Date().toISOString();
	hold.releasedBy = 'Avery Stone';
	hold.revision += 1;
	return { hold: serializeHold(hold), message: `Legal hold “${hold.name}” was released.` };
}

/**
 * Initializes environment-specific policy state and run history.
 *
 * @returns {void}
 */
function initializePolicies() {
	for (const dataClass of dataClasses) {
		for (const environment of environments) {
			const multiplier = environment.value === 'staging' ? 0.35 : environment.value === 'eu' ? 0.75 : 1;
			const config = defaultConfig(dataClass.id, environment.value);
			const policy = {
				id: `policy_${dataClass.id}_${environment.value}`,
				dataClassId: dataClass.id,
				environment: environment.value,
				revision: 1,
				version: dataClass.id === 'messages' ? 12 : dataClass.id === 'files' ? 7 : 5,
				status: dataClass.id === 'files' && environment.value === 'production' ? 'draft' : 'active',
				config,
				lastPublishedConfig: cloneValue(config),
				approvedBy: ['Legal', 'Security'],
				updatedAt: '2026-08-01T09:18:00.000Z',
				updatedBy: 'Priya Shah',
				publishedAt: '2026-07-28T16:10:00.000Z',
				nextRunAt: environment.value === 'production' ? '2026-08-03T02:00:00.000Z' : '2026-08-02T01:30:00.000Z',
				recordMultiplier: multiplier,
				lastPreview: null,
			};
			policy.lastPreview = calculatePreview(dataClass, environment.value, policy.config);
			if (policy.status === 'draft') policy.approvedBy = ['Legal'];
			policies.set(policyKey(dataClass.id, environment.value), policy);
			runsByPolicy.set(policy.id, seedRuns(policy));
		}
	}
}

/**
 * Returns sensible default policy settings for a data class and environment.
 *
 * @param {string} dataClassId Data class identifier.
 * @param {string} environment Environment identifier.
 * @returns {Record<string, unknown>} Default policy configuration.
 */
function defaultConfig(dataClassId, environment) {
	const classDefaults = {
		messages: { retentionDays: 365, archiveAfterDays: 180, action: 'archive-delete', legalBasis: 'contract', anonymize: true },
		files: { retentionDays: 730, archiveAfterDays: 365, action: 'archive-delete', legalBasis: 'contract', anonymize: false },
		analytics: { retentionDays: 180, archiveAfterDays: 90, action: 'anonymize-delete', legalBasis: 'legitimate-interest', anonymize: true },
		support: { retentionDays: 540, archiveAfterDays: 270, action: 'archive-delete', legalBasis: 'contract', anonymize: true },
		audit: { retentionDays: 1095, archiveAfterDays: 730, action: 'archive-only', legalBasis: 'legal-obligation', anonymize: false },
	}[dataClassId];
	const scale = environment === 'staging' ? 0.5 : 1;
	return {
		retentionDays: Math.max(30, Math.round((classDefaults.retentionDays * scale) / 30) * 30),
		archiveAfterDays: Math.max(30, Math.round((classDefaults.archiveAfterDays * scale) / 30) * 30),
		action: classDefaults.action,
		legalBasis: classDefaults.legalBasis,
		anonymize: classDefaults.anonymize,
		requireApproval: true,
	};
}

/**
 * Validates and normalizes a consumer-supplied policy configuration.
 *
 * @param {Record<string, unknown>} input Candidate configuration.
 * @returns {{config?: Record<string, unknown>, error?: string, status?: number}} Validated config or error.
 */
function validateConfig(input) {
	const retentionDays = clampNumber(input.retentionDays, 30, 3650, 0);
	const archiveAfterDays = clampNumber(input.archiveAfterDays, 0, 3650, -1);
	const action = normalizeOptionValue(input.action, actionOptions, '');
	const legalBasis = normalizeOptionValue(input.legalBasis, basisOptions, '');
	if (!retentionDays) return { error: 'Retention must be between 30 days and 10 years.', status: 422 };
	if (archiveAfterDays < 0 || archiveAfterDays >= retentionDays) return { error: 'Archive must begin before the retention window ends.', status: 422 };
	if (!action) return { error: 'Choose a supported lifecycle action.', status: 422 };
	if (!legalBasis) return { error: 'Choose the legal basis for retaining this data.', status: 422 };
	if (action === 'delete' && !input.anonymize) return { error: 'Permanent deletion requires anonymization in this demo policy.', status: 422 };
	return {
		config: {
			retentionDays,
			archiveAfterDays,
			action,
			legalBasis,
			anonymize: Boolean(input.anonymize),
			requireApproval: Boolean(input.requireApproval),
		},
	};
}

/**
 * Calculates record impact and safety checks from server-owned data totals.
 *
 * @param {Record<string, unknown>} dataClass Data class record.
 * @param {string} environment Environment identifier.
 * @param {Record<string, unknown>} config Valid policy configuration.
 * @returns {Record<string, unknown>} Impact preview.
 */
function calculatePreview(dataClass, environment, config) {
	const environmentScale = environment === 'staging' ? 0.35 : environment === 'eu' ? 0.75 : 1;
	const totalRecords = Math.round(dataClass.recordCount * environmentScale);
	const ageFactor = Math.max(0.04, Math.min(0.78, 0.83 - config.retentionDays / 4200));
	const eligibleRecords = Math.round(totalRecords * ageFactor);
	const holdProtected = holds
		.filter((hold) => hold.status === 'active' && hold.dataClassId === dataClass.id && hold.environment === environment)
		.reduce((total, hold) => total + hold.recordCount, 0);
	const archiveCandidate = config.action.includes('archive') ? Math.round(Math.max(0, eligibleRecords - holdProtected) * 0.62) : 0;
	const deleteEligible = config.action === 'archive-only' ? 0 : Math.max(0, eligibleRecords - holdProtected - archiveCandidate);
	const activeRecords = Math.max(0, totalRecords - eligibleRecords);
	const estimatedBytes = Math.round(dataClass.bytes * environmentScale * (eligibleRecords / Math.max(1, totalRecords)));
	const checks = [
		{ id: 'minimum', label: 'Minimum retention', status: config.retentionDays >= 30 ? 'passed' : 'blocked', detail: `${config.retentionDays} day retention window` },
		{ id: 'archive', label: 'Archive order', status: config.archiveAfterDays < config.retentionDays ? 'passed' : 'blocked', detail: `Archive begins on day ${config.archiveAfterDays}` },
		{ id: 'holds', label: 'Legal hold override', status: 'passed', detail: `${formatCount(holdProtected)} protected records excluded` },
		{ id: 'approval', label: 'Approval route', status: config.requireApproval ? 'passed' : 'blocked', detail: config.requireApproval ? 'Legal and Security approval required' : 'Approval route is disabled' },
		{ id: 'privacy', label: 'Privacy-safe deletion', status: config.action !== 'delete' || config.anonymize ? 'passed' : 'blocked', detail: config.anonymize ? 'Personal fields anonymized first' : 'No anonymization step' },
	];
	return {
		calculatedAt: new Date().toISOString(),
		totalRecords,
		activeRecords,
		eligibleRecords,
		archiveCandidate,
		holdProtected,
		deleteEligible,
		estimatedBytes,
		firstRunAt: nextRunTimestamp(environment),
		checks,
		segments: [
			{ key: 'active', label: 'active', value: activeRecords, tone: 'neutral' },
			{ key: 'archive', label: 'archive', value: archiveCandidate, tone: 'primary' },
			{ key: 'held', label: 'on hold', value: holdProtected, tone: 'warning' },
			{ key: 'delete', label: 'delete', value: deleteEligible, tone: 'danger' },
		],
	};
}

/**
 * Builds a complete policy response including live holds and history.
 *
 * @param {Record<string, unknown>} policy Mutable policy state.
 * @returns {Record<string, unknown>} Detached policy workspace.
 */
function serializePolicyWorkspace(policy) {
	const dataClass = findDataClass(policy.dataClassId);
	policy.lastPreview = calculatePreview(dataClass, policy.environment, policy.config);
	return {
		policy: serializePolicy(policy),
		dataClass: serializeDataClass(dataClass),
		preview: cloneValue(policy.lastPreview),
		holds: holds.filter((hold) => hold.status === 'active' && hold.dataClassId === policy.dataClassId && hold.environment === policy.environment).map(serializeHold),
		runs: cloneValue(runsByPolicy.get(policy.id) || []),
	};
}

/**
 * Serializes a policy without exposing mutable server state.
 *
 * @param {Record<string, unknown>} policy Policy state.
 * @returns {Record<string, unknown>} Detached policy record.
 */
function serializePolicy(policy) {
	return {
		id: policy.id,
		dataClassId: policy.dataClassId,
		environment: policy.environment,
		revision: policy.revision,
		version: policy.version,
		status: policy.status,
		config: cloneValue(policy.config),
		lastPublishedConfig: cloneValue(policy.lastPublishedConfig),
		approvedBy: cloneValue(policy.approvedBy),
		requiredApprovals: requiredApprovals(policy),
		updatedAt: policy.updatedAt,
		updatedBy: policy.updatedBy,
		publishedAt: policy.publishedAt,
		nextRunAt: policy.nextRunAt,
	};
}

/**
 * Serializes a data class with live policy and legal-hold summary state.
 *
 * @param {Record<string, unknown>} dataClass Data class record.
 * @returns {Record<string, unknown>} Data class summary.
 */
function serializeDataClass(dataClass) {
	const productionPolicy = findPolicy(dataClass.id, 'production');
	const activeHolds = holds.filter((hold) => hold.status === 'active' && hold.dataClassId === dataClass.id);
	return {
		...cloneValue(dataClass),
		status: productionPolicy?.status || 'active',
		version: productionPolicy?.version || 1,
		holdCount: activeHolds.length,
		heldRecords: activeHolds.reduce((total, hold) => total + hold.recordCount, 0),
	};
}

/**
 * Creates a normalized legal hold record.
 *
 * @param {Record<string, unknown>} input Legal hold seed.
 * @returns {Record<string, unknown>} Complete legal hold.
 */
function createHold(input) {
	return {
		id: input.id,
		name: input.name,
		dataClassId: input.dataClassId,
		environment: input.environment,
		recordCount: input.recordCount,
		owner: input.owner,
		reason: input.reason,
		expiresOn: input.expiresOn,
		status: 'active',
		createdAt: '2026-08-01T08:30:00.000Z',
		revision: 1,
		releaseReason: '',
		releasedAt: '',
		releasedBy: '',
	};
}

/**
 * Serializes a legal hold with a human-readable data class label.
 *
 * @param {Record<string, unknown>} hold Legal hold state.
 * @returns {Record<string, unknown>} Legal hold response.
 */
function serializeHold(hold) {
	return {
		...cloneValue(hold),
		dataClassName: findDataClass(hold.dataClassId)?.name || hold.dataClassId,
	};
}

/**
 * Seeds representative lifecycle, approval, and policy-version events.
 *
 * @param {Record<string, unknown>} policy Policy state.
 * @returns {Array<Record<string, unknown>>} Newest-first run history.
 */
function seedRuns(policy) {
	return [
		{
			id: `run_${policy.id}_1`,
			type: 'lifecycle',
			status: policy.status === 'draft' ? 'paused' : 'complete',
			label: policy.status === 'draft' ? 'Lifecycle run paused' : `Version ${policy.version} lifecycle completed`,
			detail: policy.status === 'draft' ? 'A draft policy requires review before the next run' : 'Eligible records processed after legal-hold exclusions',
			startedAt: '2026-07-31T02:00:00.000Z',
		},
		{
			id: `run_${policy.id}_2`,
			type: 'preview',
			status: 'complete',
			label: 'Impact preview calculated',
			detail: 'Record eligibility and hold coverage recalculated',
			startedAt: '2026-07-30T10:18:00.000Z',
		},
		{
			id: `run_${policy.id}_3`,
			type: 'approval',
			status: 'complete',
			label: 'Legal approval recorded',
			detail: 'Policy controls reviewed against the workspace DPA',
			startedAt: '2026-07-29T16:44:00.000Z',
		},
	];
}

/**
 * Prepends a run or policy activity record.
 *
 * @param {string} policyId Policy identifier.
 * @param {Record<string, unknown>} input Activity values.
 * @returns {void}
 */
function appendRun(policyId, input) {
	runSequence += 1;
	const runs = runsByPolicy.get(policyId) || [];
	runs.unshift({
		id: `run_${runSequence}`,
		type: input.type,
		status: input.status,
		label: input.label,
		detail: input.detail,
		startedAt: input.startedAt || new Date().toISOString(),
	});
	runsByPolicy.set(policyId, runs.slice(0, 12));
}

/**
 * Returns the required approval roles for a policy.
 *
 * @param {Record<string, unknown>} policy Policy state.
 * @returns {string[]} Required approval roles.
 */
function requiredApprovals(policy) {
	return policy.config.requireApproval ? ['Legal', 'Security'] : [];
}

/**
 * Finds a data class by identifier.
 *
 * @param {unknown} dataClassId Candidate identifier.
 * @returns {Record<string, unknown>|undefined} Matching data class.
 */
function findDataClass(dataClassId) {
	return dataClasses.find((item) => item.id === String(dataClassId));
}

/**
 * Finds an environment-specific policy.
 *
 * @param {unknown} dataClassId Candidate data class identifier.
 * @param {unknown} environment Candidate environment identifier.
 * @returns {Record<string, unknown>|undefined} Matching policy.
 */
function findPolicy(dataClassId, environment) {
	const environmentValue = normalizeOptionValue(environment, environments, 'production');
	return policies.get(policyKey(String(dataClassId), environmentValue));
}

/**
 * Creates the stable map key for a data class and environment.
 *
 * @param {string} dataClassId Data class identifier.
 * @param {string} environment Environment identifier.
 * @returns {string} Policy map key.
 */
function policyKey(dataClassId, environment) {
	return `${dataClassId}:${environment}`;
}

/**
 * Validates an optimistic policy revision.
 *
 * @param {Record<string, unknown>} policy Policy state.
 * @param {unknown} revision Candidate revision.
 * @returns {{error: string, status: number}|null} Revision error or null.
 */
function validateRevision(policy, revision) {
	if (Number(revision) === policy.revision) return null;
	return { error: 'This policy changed while you were editing it. Reload the latest draft and try again.', status: 409 };
}

/**
 * Returns the next deterministic lifecycle job window.
 *
 * @param {string} environment Environment identifier.
 * @returns {string} ISO schedule timestamp.
 */
function nextRunTimestamp(environment) {
	return environment === 'production' ? '2026-08-03T02:00:00.000Z' : '2026-08-02T01:30:00.000Z';
}

/**
 * Normalizes a date-only string.
 *
 * @param {unknown} value Candidate date.
 * @returns {string} Valid date-only value or empty string.
 */
function normalizeDate(value) {
	const date = String(value || '').trim();
	return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

/**
 * Resolves a candidate value against a supported option list.
 *
 * @param {unknown} value Candidate option value.
 * @param {Array<{value: string}>} options Supported option records.
 * @param {string} fallback Fallback value.
 * @returns {string} Supported option value.
 */
function normalizeOptionValue(value, options, fallback) {
	const candidate = String(value || '');
	return options.some((option) => option.value === candidate) ? candidate : fallback;
}

/**
 * Trims user-authored text to a bounded length.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Converts a candidate number into a bounded integer.
 *
 * @param {unknown} value Candidate numeric value.
 * @param {number} minimum Minimum value.
 * @param {number} maximum Maximum value.
 * @param {number} fallback Fallback value.
 * @returns {number} Bounded integer.
 */
function clampNumber(value, minimum, maximum, fallback) {
	const number = Math.floor(Number(value));
	if (!Number.isFinite(number)) return fallback;
	return Math.min(maximum, Math.max(minimum, number));
}

/**
 * Formats a record count for product copy.
 *
 * @param {number} value Record count.
 * @returns {string} Compact count.
 */
function formatCount(value) {
	return new Intl.NumberFormat('en-GB', { notation: value >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

/**
 * Produces a standard not-found response.
 *
 * @param {string} resource Resource label.
 * @returns {{error: string, status: number}} Not-found response.
 */
function notFound(resource) {
	return { error: `${resource} not found.`, status: 404 };
}

/**
 * Clones JSON-safe demo state before returning it to a consumer.
 *
 * @param {unknown} value Serializable value.
 * @returns {unknown} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
