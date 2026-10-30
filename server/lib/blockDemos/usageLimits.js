const planSeeds = [
	{ id: 'starter', name: 'Starter', description: 'Product-led teams proving repeatable usage.', customers: 248, monthlyRevenue: 18400, status: 'public' },
	{ id: 'growth', name: 'Growth', description: 'Scaling teams with predictable monthly demand.', customers: 94, monthlyRevenue: 42800, status: 'recommended' },
	{ id: 'scale', name: 'Scale', description: 'High-volume customers with negotiated controls.', customers: 31, monthlyRevenue: 78200, status: 'contracted' },
];

const meterSeeds = [
	{
		id: 'workflow_runs',
		name: 'Workflow runs',
		description: 'Completed automation executions reported by the workflow ledger.',
		unit: 'runs',
		period: 'Monthly',
		step: 10000,
		overageRate: 0.008,
		current: { starter: 22000, growth: 84200, scale: 401000 },
		forecast: { starter: 31000, growth: 132400, scale: 612000 },
		recommended: { starter: 40000, growth: 140000, scale: 650000 },
		maximum: { starter: 50000, growth: 200000, scale: 750000 },
		trend: { starter: '+9%', growth: '+18%', scale: '+12%' },
		risk: { starter: { near: 4, crossing: 1 }, growth: { near: 9, crossing: 3 }, scale: { near: 5, crossing: 2 } },
	},
	{
		id: 'ai_credits',
		name: 'AI credits',
		description: 'Model credits consumed across generation and automation features.',
		unit: 'credits',
		period: 'Monthly',
		step: 100000,
		overageRate: 0.00002,
		current: { starter: 780000, growth: 3180000, scale: 11900000 },
		forecast: { starter: 1030000, growth: 4680000, scale: 15100000 },
		recommended: { starter: 1200000, growth: 4600000, scale: 16000000 },
		maximum: { starter: 1600000, growth: 8000000, scale: 20000000 },
		trend: { starter: '+14%', growth: '+31%', scale: '+22%' },
		risk: { starter: { near: 7, crossing: 2 }, growth: { near: 14, crossing: 6 }, scale: { near: 8, crossing: 3 } },
	},
	{
		id: 'storage_gb',
		name: 'Storage',
		description: 'Average retained files, exports, and attachment storage.',
		unit: 'GB',
		period: 'Monthly average',
		step: 10,
		overageRate: 0.35,
		current: { starter: 38, growth: 182, scale: 714 },
		forecast: { starter: 43, growth: 224, scale: 802 },
		recommended: { starter: 50, growth: 300, scale: 900 },
		maximum: { starter: 75, growth: 500, scale: 1200 },
		trend: { starter: '+5%', growth: '+7%', scale: '+11%' },
		risk: { starter: { near: 2, crossing: 0 }, growth: { near: 5, crossing: 1 }, scale: { near: 4, crossing: 1 } },
	},
];

const customerSeeds = [
	{ id: 'cus_arcadia', name: 'Arcadia Health', planId: 'growth', owner: 'Customer success' },
	{ id: 'cus_northstar', name: 'Northstar Labs', planId: 'growth', owner: 'Revenue operations' },
	{ id: 'cus_harbor', name: 'Harbor Retail', planId: 'scale', owner: 'Support lead' },
	{ id: 'cus_brightline', name: 'Brightline Commerce', planId: 'growth', owner: 'Account management' },
];

const graceOptions = [
	{ value: 0, label: 'No grace window', description: 'Apply the selected action immediately.' },
	{ value: 12, label: '12 hours', description: 'Give owners half a day to respond.' },
	{ value: 24, label: '24 hours', description: 'Allow one full day before enforcement.' },
	{ value: 72, label: '72 hours', description: 'Allow a three-day recovery window.' },
];

const overageOptions = [
	{ value: 'charge', label: 'Bill overages', description: 'Keep service running and invoice excess units.' },
	{ value: 'grace', label: 'Allow a grace window', description: 'Continue temporarily, then block new usage.' },
	{ value: 'pause', label: 'Pause new usage', description: 'Block new metered work when the limit is reached.' },
];

let sequence = 9100;
let livePolicySnapshot = clone(createPolicySeeds());
let usageLimitState = createUsageLimitState();

/**
 * Returns the complete usage-governance workspace.
 *
 * @returns {object} Usage limits workspace.
 */
export function getUsageLimitsWorkspace() {
	return serializeWorkspace();
}

/**
 * Saves one metered policy with exact-revision protection.
 *
 * @param {string} planId Plan identifier.
 * @param {string} meterId Meter identifier.
 * @param {Record<string, unknown>} input Policy fields and current revision.
 * @returns {object} Updated workspace or API error.
 */
export function updateUsagePolicy(planId, meterId, input = {}) {
	const mutationError = validateEditableMutation(input.revision);
	if (mutationError) return mutationError;
	const policy = findPolicy(planId, meterId);
	if (!policy) return { error: 'Usage policy not found.', status: 404 };

	const hardLimit = Number(input.hardLimit);
	const softThreshold = Number(input.softThreshold);
	const overagePolicy = String(input.overagePolicy || '');
	const graceHours = Number(input.graceHours);
	const alertChannels = Array.isArray(input.alertChannels) ? [...new Set(input.alertChannels.map(String))] : [];
	const webhookUrl = String(input.webhookUrl || '').trim();
	const requireApproval = input.requireApproval === true;

	if (!Number.isInteger(hardLimit) || hardLimit <= policy.current) return { error: `Set the hard limit above current usage of ${formatNumber(policy.current)} ${policy.unit}.`, status: 422 };
	if (hardLimit > policy.maximum) return { error: `The ${policy.planName} maximum is ${formatNumber(policy.maximum)} ${policy.unit}.`, status: 422 };
	if (!Number.isInteger(softThreshold) || softThreshold < 50 || softThreshold > 95 || softThreshold % 5 !== 0) return { error: 'Choose an alert threshold from 50% to 95% in 5% steps.', status: 422 };
	if (!overageOptions.some((option) => option.value === overagePolicy)) return { error: 'Choose an available enforcement action.', status: 422 };
	if (!graceOptions.some((option) => option.value === graceHours)) return { error: 'Choose an available grace window.', status: 422 };
	if (!alertChannels.length || alertChannels.some((channel) => !['owner', 'billing', 'webhook'].includes(channel))) return { error: 'Choose at least one supported alert channel.', status: 422 };
	if (alertChannels.includes('webhook') && !/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(webhookUrl)) return { error: 'Add a valid HTTPS webhook URL.', status: 422 };

	Object.assign(policy, {
		hardLimit,
		softThreshold,
		overagePolicy,
		graceHours,
		alertChannels,
		webhookUrl: alertChannels.includes('webhook') ? webhookUrl : '',
		requireApproval,
	});
	commitPolicyChange('Updated usage policy', `${policy.planName} · ${policy.name} · ${formatNumber(hardLimit)} ${policy.unit}`);
	return serializeWorkspace();
}

/**
 * Calculates forecast, customer, billing, and interruption impact for one policy.
 *
 * @param {Record<string, unknown>} input Plan, meter, and current revision.
 * @returns {object} Updated workspace and impact evidence or API error.
 */
export function previewUsagePolicyImpact(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Impact evidence is locked after publication begins.', status: 409 };
	const policy = findPolicy(String(input.planId || ''), String(input.meterId || ''));
	if (!policy) return { error: 'Choose an available usage policy.', status: 422 };
	const changes = calculatePolicyChanges(policy);
	const projectedOverage = Math.max(0, policy.forecast - policy.hardLimit);
	const estimatedCharge = policy.overagePolicy === 'charge' ? roundMoney(projectedOverage * policy.overageRate) : 0;
	sequence += 1;
	usageLimitState.impact = {
		id: `impact_${sequence}`,
		revision: usageLimitState.policy.revision,
		planId: policy.planId,
		meterId: policy.meterId,
		changedFields: changes.length,
		affectedAccounts: policy.risk.near,
		forecastCrossingAccounts: policy.forecast > policy.hardLimit ? policy.risk.crossing : 0,
		projectedOverage,
		estimatedCharge,
		interruptionRisk: policy.overagePolicy !== 'charge' && policy.forecast > policy.hardLimit,
		forecastCrossingDate: policy.forecast > policy.hardLimit ? 'Aug 27' : null,
		changes,
		createdAt: 'Just now',
	};
	usageLimitState.activity.unshift(createActivity('Forecast service', 'Calculated policy impact', `${policy.name} · ${policy.risk.near} accounts need attention`));
	return serializeWorkspace();
}

/**
 * Sends deterministic test notifications for one current policy revision.
 *
 * @param {Record<string, unknown>} input Plan, meter, and current revision.
 * @returns {object} Updated workspace and notification receipt or API error.
 */
export function testUsagePolicyNotifications(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Notification tests are locked after publication begins.', status: 409 };
	const policy = findPolicy(String(input.planId || ''), String(input.meterId || ''));
	if (!policy) return { error: 'Choose an available usage policy.', status: 422 };
	if (!policy.alertChannels.length) return { error: 'Save at least one alert channel first.', status: 422 };
	sequence += 1;
	usageLimitState.notificationReceipt = {
		id: `notify_${sequence}`,
		revision: usageLimitState.policy.revision,
		planId: policy.planId,
		meterId: policy.meterId,
		threshold: policy.softThreshold,
		deliveries: policy.alertChannels.map(buildNotificationDelivery),
		signature: policy.alertChannels.includes('webhook') ? `sig_test_${sequence}` : null,
		createdAt: 'Just now',
	};
	usageLimitState.activity.unshift(createActivity('Notification gateway', 'Delivered threshold test', `${policy.alertChannels.length} channels · ${policy.softThreshold}% threshold`));
	return serializeWorkspace();
}

/**
 * Requests approval for a policy that exceeds an automated guardrail.
 *
 * @param {Record<string, unknown>} input Plan, meter, and current revision.
 * @returns {object} Updated workspace and approval request or API error.
 */
export function requestUsagePolicyApproval(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Approval is locked after publication begins.', status: 409 };
	const policy = findPolicy(String(input.planId || ''), String(input.meterId || ''));
	if (!policy) return { error: 'Choose an available usage policy.', status: 422 };
	if (!requiresApproval(policy)) return { error: 'This policy is inside automated guardrails and does not require approval.', status: 422 };
	if (!usageLimitState.impact || usageLimitState.impact.revision !== usageLimitState.policy.revision || usageLimitState.impact.meterId !== policy.meterId || usageLimitState.impact.planId !== policy.planId) return { error: 'Calculate current customer impact before requesting approval.', status: 409 };

	sequence += 1;
	usageLimitState.approval = {
		id: `approval_${sequence}`,
		revision: usageLimitState.policy.revision,
		planId: policy.planId,
		meterId: policy.meterId,
		status: 'pending',
		requestedBy: 'Maya Chen',
		reviewer: 'Finance admin',
		reason: policy.hardLimit > policy.recommended ? 'Limit exceeds the forecast recommendation.' : 'Enforcement can interrupt customer usage.',
		createdAt: 'Just now',
	};
	usageLimitState.validation = null;
	usageLimitState.activity.unshift(createActivity('Maya Chen', 'Requested policy approval', `${policy.name} · Finance admin`));
	return serializeWorkspace();
}

/**
 * Records an approval decision for the current policy revision.
 *
 * @param {string} approvalId Approval identifier.
 * @param {Record<string, unknown>} input Decision payload.
 * @returns {object} Updated workspace or API error.
 */
export function decideUsagePolicyApproval(approvalId, input = {}) {
	const approval = usageLimitState.approval;
	if (!approval || approval.id !== approvalId) return { error: 'Approval request not found.', status: 404 };
	if (approval.status !== 'pending') return { error: 'This approval request already has a decision.', status: 409 };
	if (approval.revision !== usageLimitState.policy.revision) return { error: 'The policy changed after this approval was requested.', status: 409 };
	const decision = String(input.decision || '');
	if (!['approved', 'rejected'].includes(decision)) return { error: 'Choose approve or reject.', status: 422 };

	approval.status = decision;
	approval.decidedBy = 'Finance admin';
	approval.decidedAt = 'Just now';
	usageLimitState.validation = null;
	usageLimitState.activity.unshift(createActivity('Finance admin', `${decision === 'approved' ? 'Approved' : 'Rejected'} policy change`, `${approval.planId} · ${approval.meterId}`));
	return serializeWorkspace();
}

/**
 * Runs authoritative checks for the selected policy revision.
 *
 * @param {Record<string, unknown>} input Plan, meter, and current revision.
 * @returns {object} Updated workspace and validation evidence or API error.
 */
export function validateUsagePolicy(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Validation is locked after publication begins.', status: 409 };
	const policy = findPolicy(String(input.planId || ''), String(input.meterId || ''));
	if (!policy) return { error: 'Choose an available usage policy.', status: 422 };
	const impactCurrent = usageLimitState.impact?.revision === usageLimitState.policy.revision && usageLimitState.impact.planId === policy.planId && usageLimitState.impact.meterId === policy.meterId;
	const notificationCurrent = usageLimitState.notificationReceipt?.revision === usageLimitState.policy.revision && usageLimitState.notificationReceipt.planId === policy.planId && usageLimitState.notificationReceipt.meterId === policy.meterId;
	const approvalReady = !requiresApproval(policy) || (usageLimitState.approval?.revision === usageLimitState.policy.revision && usageLimitState.approval.status === 'approved');
	const checks = [
		{ id: 'policy_change', label: 'Saved policy changes', detail: `${calculatePolicyChanges(policy).length} fields differ from live`, state: calculatePolicyChanges(policy).length ? 'passed' : 'blocked' },
		{ id: 'meter_contract', label: 'Meter contract', detail: `${policy.meterId} · usage ledger connected`, state: policy.hardLimit <= policy.maximum ? 'passed' : 'blocked' },
		{ id: 'impact', label: 'Customer impact', detail: impactCurrent ? `${usageLimitState.impact.affectedAccounts} accounts need attention` : 'Run current impact analysis', state: impactCurrent ? 'passed' : 'blocked' },
		{ id: 'notifications', label: 'Alert delivery', detail: notificationCurrent ? `${usageLimitState.notificationReceipt.deliveries.length} channels delivered` : 'Send a threshold test', state: notificationCurrent ? 'passed' : 'blocked' },
		{ id: 'approval', label: 'Policy approval', detail: approvalReady ? (requiresApproval(policy) ? 'Finance admin approved' : 'Inside automated guardrails') : 'Finance approval required', state: approvalReady ? 'passed' : 'blocked' },
	];
	sequence += 1;
	usageLimitState.validation = {
		id: `validation_${sequence}`,
		revision: usageLimitState.policy.revision,
		planId: policy.planId,
		meterId: policy.meterId,
		ready: checks.every((check) => check.state === 'passed'),
		checks,
		createdAt: 'Just now',
	};
	usageLimitState.activity.unshift(createActivity('Usage policy service', 'Completed policy checks', `${checks.filter((check) => check.state === 'passed').length}/${checks.length} passed`));
	return serializeWorkspace();
}

/**
 * Creates a temporary customer exception request.
 *
 * @param {Record<string, unknown>} input Exception fields and exception revision.
 * @returns {object} Updated workspace and exception record or API error.
 */
export function createUsageException(input = {}) {
	const revisionError = validateExceptionRevision(input.revision);
	if (revisionError) return revisionError;
	const customer = customerSeeds.find((candidate) => candidate.id === String(input.customerId || ''));
	if (!customer) return { error: 'Choose an available customer.', status: 422 };
	const policy = findPolicy(customer.planId, String(input.meterId || ''));
	if (!policy) return { error: 'Choose a meter available to this customer.', status: 422 };
	const hardLimit = Number(input.hardLimit);
	const expiresAt = String(input.expiresAt || '');
	const reason = String(input.reason || '').trim();
	if (!Number.isInteger(hardLimit) || hardLimit <= policy.hardLimit) return { error: `Set the exception above the ${formatNumber(policy.hardLimit)} ${policy.unit} plan default.`, status: 422 };
	if (hardLimit > policy.maximum * 1.5) return { error: `Exception requests cannot exceed ${formatNumber(policy.maximum * 1.5)} ${policy.unit}.`, status: 422 };
	if (!/^2026-(08|09)-\d{2}$/.test(expiresAt) || expiresAt <= '2026-08-02') return { error: 'Choose an expiry after today in the current review window.', status: 422 };
	if (reason.length < 12 || reason.length > 240) return { error: 'Add a clear reason between 12 and 240 characters.', status: 422 };

	sequence += 1;
	const exception = {
		id: `exception_${sequence}`,
		customerId: customer.id,
		customerName: customer.name,
		planId: customer.planId,
		planName: planName(customer.planId),
		meterId: policy.meterId,
		meterName: policy.name,
		unit: policy.unit,
		hardLimit,
		expiresAt,
		reason,
		owner: customer.owner,
		status: 'pending',
		createdAt: 'Just now',
	};
	usageLimitState.exceptions.unshift(exception);
	usageLimitState.exceptionsRevision += 1;
	usageLimitState.activity.unshift(createActivity('Maya Chen', 'Created exception request', `${customer.name} · ${policy.name}`));
	return serializeWorkspace();
}

/**
 * Approves or rejects a pending customer exception.
 *
 * @param {string} exceptionId Exception identifier.
 * @param {Record<string, unknown>} input Decision and current exception revision.
 * @returns {object} Updated workspace or API error.
 */
export function decideUsageException(exceptionId, input = {}) {
	const revisionError = validateExceptionRevision(input.revision);
	if (revisionError) return revisionError;
	const exception = usageLimitState.exceptions.find((candidate) => candidate.id === exceptionId);
	if (!exception) return { error: 'Exception request not found.', status: 404 };
	if (exception.status !== 'pending') return { error: 'This exception request already has a decision.', status: 409 };
	const decision = String(input.decision || '');
	if (!['approved', 'rejected'].includes(decision)) return { error: 'Choose approve or reject.', status: 422 };

	exception.status = decision;
	exception.decidedBy = 'Revenue operations';
	exception.decidedAt = 'Just now';
	usageLimitState.exceptionsRevision += 1;
	usageLimitState.activity.unshift(createActivity('Revenue operations', `${decision === 'approved' ? 'Approved' : 'Rejected'} customer exception`, `${exception.customerName} · ${exception.meterName}`));
	return serializeWorkspace();
}

/**
 * Publishes a checked policy behind an explicit customer-impact acknowledgement.
 *
 * @param {Record<string, unknown>} input Plan, meter, revision, and acknowledgement.
 * @returns {object} Updated workspace and release receipt or API error.
 */
export function publishUsagePolicy(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'This policy version is already publishing.', status: 409 };
	if (input.acknowledged !== true) return { error: 'Acknowledge forecast, billing, and customer interruption impact.', status: 422 };
	const policy = findPolicy(String(input.planId || ''), String(input.meterId || ''));
	if (!policy) return { error: 'Choose an available usage policy.', status: 422 };
	if (!usageLimitState.validation || !usageLimitState.validation.ready || usageLimitState.validation.revision !== usageLimitState.policy.revision || usageLimitState.validation.planId !== policy.planId || usageLimitState.validation.meterId !== policy.meterId) return { error: 'Run passing checks for the current policy revision.', status: 409 };

	sequence += 1;
	usageLimitState.release = {
		id: `release_${sequence}`,
		version: usageLimitState.policy.version,
		fromVersion: usageLimitState.policy.liveVersion,
		revision: usageLimitState.policy.revision,
		planId: policy.planId,
		meterId: policy.meterId,
		state: 'queued',
		label: 'Queued for enforcement rollout',
		checksum: `usage_${policy.planId}_${policy.meterId}_${sequence}`,
		createdAt: 'Just now',
	};
	usageLimitState.policy.status = 'publishing';
	usageLimitState.policy.revision += 1;
	usageLimitState.activity.unshift(createActivity('Maya Chen', 'Published usage policy', `${policy.planName} · ${policy.name} · v${usageLimitState.release.version}`));
	return serializeWorkspace();
}

/**
 * Advances the deterministic usage enforcement worker by one state.
 *
 * @returns {object} Updated workspace and release state or API error.
 */
export function advanceUsagePolicyRollout() {
	if (!usageLimitState.release) return { error: 'Publish a usage policy before advancing rollout.', status: 409 };
	if (usageLimitState.release.state === 'completed') return { error: 'Usage policy rollout is already complete.', status: 409 };
	if (usageLimitState.release.state === 'queued') {
		usageLimitState.release.state = 'propagating';
		usageLimitState.release.label = 'Updating meter, billing, and notification services';
		usageLimitState.activity.unshift(createActivity('Policy worker', 'Started enforcement rollout', 'Usage gateway, billing meter, and notification rules are updating.'));
	} else {
		usageLimitState.release.state = 'completed';
		usageLimitState.release.label = 'Live across every usage surface';
		usageLimitState.policy.status = 'published';
		usageLimitState.policy.liveVersion = usageLimitState.policy.version;
		livePolicySnapshot = clone(usageLimitState.policies);
		usageLimitState.activity.unshift(createActivity('Policy worker', 'Completed enforcement rollout', `Usage policy version ${usageLimitState.release.version} is live.`));
	}
	return serializeWorkspace();
}

/**
 * Restores the deterministic usage-limit demonstration.
 *
 * @returns {object} Fresh usage limits workspace.
 */
export function resetUsageLimits() {
	livePolicySnapshot = clone(createPolicySeeds());
	usageLimitState = createUsageLimitState();
	return serializeWorkspace();
}

/**
 * Creates the initial mutable usage-limit state.
 *
 * @returns {object} Mutable usage-limit state.
 */
function createUsageLimitState() {
	return {
		policy: {
			status: 'draft',
			version: 6,
			liveVersion: 5,
			revision: 12,
			cycleLabel: 'Aug 1 – Aug 31',
			owner: 'Revenue operations',
		},
		plans: clone(planSeeds),
		meters: clone(meterSeeds),
		policies: clone(livePolicySnapshot),
		impact: null,
		notificationReceipt: null,
		approval: null,
		validation: null,
		release: null,
		exceptionsRevision: 4,
		exceptions: [
			{ id: 'exception_arcadia', customerId: 'cus_arcadia', customerName: 'Arcadia Health', planId: 'growth', planName: 'Growth', meterId: 'workflow_runs', meterName: 'Workflow runs', unit: 'runs', hardLimit: 180000, expiresAt: '2026-08-31', reason: 'Migration workload requires temporary headroom.', owner: 'Customer success', status: 'approved', createdAt: 'Today 09:45', decidedBy: 'Revenue operations', decidedAt: 'Today 10:05' },
			{ id: 'exception_northstar', customerId: 'cus_northstar', customerName: 'Northstar Labs', planId: 'growth', planName: 'Growth', meterId: 'ai_credits', meterName: 'AI credits', unit: 'credits', hardLimit: 5500000, expiresAt: '2026-08-28', reason: 'Evaluation batch increased model usage.', owner: 'Revenue operations', status: 'pending', createdAt: 'Today 11:05' },
			{ id: 'exception_harbor', customerId: 'cus_harbor', customerName: 'Harbor Retail', planId: 'scale', planName: 'Scale', meterId: 'storage_gb', meterName: 'Storage', unit: 'GB', hardLimit: 1080, expiresAt: '2026-09-15', reason: 'Seasonal media archive retention.', owner: 'Support lead', status: 'approved', createdAt: 'Yesterday', decidedBy: 'Revenue operations', decidedAt: 'Yesterday' },
		],
		activity: [
			createActivity('Usage gateway', 'Synchronized current usage', 'Nine meter and plan combinations refreshed.'),
			createActivity('Billing meter', 'Reconciled overage ledger', 'No unpriced usage events remain.'),
			createActivity('Maya Chen', 'Created policy draft v6', 'Copied from live version 5.'),
		],
	};
}

/**
 * Creates the seeded policy matrix across every plan and meter.
 *
 * @returns {Array<object>} Usage policy records.
 */
function createPolicySeeds() {
	const policies = [];
	for (const plan of planSeeds) {
		for (const meter of meterSeeds) {
			policies.push(createPolicySeed(plan, meter));
		}
	}
	return policies;
}

/**
 * Creates one plan and meter policy seed.
 *
 * @param {object} plan Plan definition.
 * @param {object} meter Meter definition.
 * @returns {object} Usage policy record.
 */
function createPolicySeed(plan, meter) {
	const hardLimit = {
		starter: { workflow_runs: 30000, ai_credits: 1000000, storage_gb: 50 },
		growth: { workflow_runs: 120000, ai_credits: 4000000, storage_gb: 250 },
		scale: { workflow_runs: 600000, ai_credits: 15000000, storage_gb: 900 },
	}[plan.id][meter.id];
	return {
		id: `${plan.id}:${meter.id}`,
		planId: plan.id,
		planName: plan.name,
		meterId: meter.id,
		name: meter.name,
		description: meter.description,
		unit: meter.unit,
		period: meter.period,
		step: meter.step,
		overageRate: meter.overageRate,
		current: meter.current[plan.id],
		forecast: meter.forecast[plan.id],
		recommended: meter.recommended[plan.id],
		maximum: meter.maximum[plan.id],
		trend: meter.trend[plan.id],
		risk: clone(meter.risk[plan.id]),
		hardLimit,
		softThreshold: meter.id === 'ai_credits' ? 75 : meter.id === 'storage_gb' ? 85 : 80,
		overagePolicy: plan.id === 'starter' ? 'grace' : 'charge',
		graceHours: plan.id === 'starter' ? 12 : 24,
		alertChannels: ['owner', 'billing'],
		webhookUrl: '',
		requireApproval: false,
	};
}

/**
 * Serializes state with catalog and calculated summaries.
 *
 * @returns {object} Immutable usage-limits workspace.
 */
function serializeWorkspace() {
	return {
		policy: clone(usageLimitState.policy),
		plans: clone(usageLimitState.plans),
		meters: clone(usageLimitState.meters),
		policies: clone(usageLimitState.policies),
		catalog: {
			graceOptions: clone(graceOptions),
			overageOptions: clone(overageOptions),
			customerOptions: customerSeeds.map(buildCustomerOption),
			alertChannels: [
				{ value: 'owner', label: 'Account owners', description: 'Email and in-product warning.' },
				{ value: 'billing', label: 'Billing admins', description: 'Include projected charge context.' },
				{ value: 'webhook', label: 'Signed webhook', description: 'POST threshold and reset events.' },
			],
		},
		summary: {
			changedPolicyCount: usageLimitState.policies.filter(hasPolicyChanges).length,
			pendingExceptions: usageLimitState.exceptions.filter((exception) => exception.status === 'pending').length,
			activeExceptions: usageLimitState.exceptions.filter((exception) => exception.status === 'approved').length,
			totalCustomers: planSeeds.reduce((total, plan) => total + plan.customers, 0),
		},
		impact: clone(usageLimitState.impact),
		notificationReceipt: clone(usageLimitState.notificationReceipt),
		approval: clone(usageLimitState.approval),
		validation: clone(usageLimitState.validation),
		release: clone(usageLimitState.release),
		exceptionsRevision: usageLimitState.exceptionsRevision,
		exceptions: clone(usageLimitState.exceptions),
		activity: clone(usageLimitState.activity),
	};
}

/**
 * Finds one usage policy by plan and meter.
 *
 * @param {string} planId Plan identifier.
 * @param {string} meterId Meter identifier.
 * @returns {object|null} Usage policy or null.
 */
function findPolicy(planId, meterId) {
	return usageLimitState.policies.find((policy) => policy.planId === planId && policy.meterId === meterId) || null;
}

/**
 * Commits a policy mutation and invalidates revision-bound evidence.
 *
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commitPolicyChange(action, detail) {
	usageLimitState.policy.revision += 1;
	usageLimitState.impact = null;
	usageLimitState.notificationReceipt = null;
	usageLimitState.approval = null;
	usageLimitState.validation = null;
	usageLimitState.activity.unshift(createActivity('Maya Chen', action, detail));
}

/**
 * Validates that a draft mutation targets the current editable revision.
 *
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Mutation error or null.
 */
function validateEditableMutation(revision) {
	const revisionError = validateRevision(revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Published policy versions are locked. Reset the example to edit another draft.', status: 409 };
	return null;
}

/**
 * Validates an exact policy revision.
 *
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Conflict response or null.
 */
function validateRevision(revision) {
	if (Number(revision) === usageLimitState.policy.revision) return null;
	return { error: `Usage policy changed to revision ${usageLimitState.policy.revision}. Reload before continuing.`, status: 409 };
}

/**
 * Validates an exact customer-exception revision.
 *
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Conflict response or null.
 */
function validateExceptionRevision(revision) {
	if (Number(revision) === usageLimitState.exceptionsRevision) return null;
	return { error: `Exception queue changed to revision ${usageLimitState.exceptionsRevision}. Reload before continuing.`, status: 409 };
}

/**
 * Reports whether publication has locked policy editing.
 *
 * @returns {boolean} Whether the policy is locked.
 */
function isLocked() {
	return Boolean(usageLimitState.release);
}

/**
 * Reports whether a policy crosses a manual approval guardrail.
 *
 * @param {object} policy Usage policy.
 * @returns {boolean} Whether approval is required.
 */
function requiresApproval(policy) {
	return policy.requireApproval || policy.hardLimit > policy.recommended || policy.overagePolicy === 'pause';
}

/**
 * Calculates saved policy differences against live version 5.
 *
 * @param {object} policy Usage policy.
 * @returns {Array<object>} Changed policy fields.
 */
function calculatePolicyChanges(policy) {
	const live = livePolicySnapshot.find((candidate) => candidate.id === policy.id);
	if (!live) return [];
	const changes = [];
	for (const field of ['hardLimit', 'softThreshold', 'overagePolicy', 'graceHours', 'webhookUrl', 'requireApproval']) {
		if (policy[field] === live[field]) continue;
		changes.push({ field, from: live[field], to: policy[field] });
	}
	if (JSON.stringify(policy.alertChannels) !== JSON.stringify(live.alertChannels)) changes.push({ field: 'alertChannels', from: live.alertChannels, to: policy.alertChannels });
	return changes;
}

/**
 * Reports whether one policy differs from its live counterpart.
 *
 * @param {object} policy Usage policy.
 * @returns {boolean} Whether the policy changed.
 */
function hasPolicyChanges(policy) {
	return calculatePolicyChanges(policy).length > 0;
}

/**
 * Builds one notification delivery result.
 *
 * @param {string} channel Channel identifier.
 * @returns {object} Notification delivery.
 */
function buildNotificationDelivery(channel) {
	return {
		channel,
		label: { owner: 'Account owners', billing: 'Billing admins', webhook: 'Signed webhook' }[channel] || channel,
		target: { owner: '94 workspace owners', billing: 'billing-admins@acme.test', webhook: 'Configured HTTPS endpoint' }[channel] || channel,
		state: 'delivered',
	};
}

/**
 * Builds a rich customer option for exception creation.
 *
 * @param {object} customer Customer record.
 * @returns {object} Select option.
 */
function buildCustomerOption(customer) {
	return {
		value: customer.id,
		label: customer.name,
		description: `${planName(customer.planId)} · ${customer.owner}`,
	};
}

/**
 * Resolves a plan label.
 *
 * @param {string} planId Plan identifier.
 * @returns {string} Plan label.
 */
function planName(planId) {
	return planSeeds.find((plan) => plan.id === planId)?.name || planId;
}

/**
 * Creates a compact activity event.
 *
 * @param {string} actor Activity actor.
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {object} Activity event.
 */
function createActivity(actor, action, detail) {
	sequence += 1;
	return { id: `activity_${sequence}`, actor, action, detail, createdAt: 'Just now' };
}

/**
 * Formats a numeric count for server copy.
 *
 * @param {number} value Numeric value.
 * @returns {string} Localized number.
 */
function formatNumber(value) {
	return Number(value || 0).toLocaleString('en-US');
}

/**
 * Rounds a currency amount to two decimal places.
 *
 * @param {number} value Numeric amount.
 * @returns {number} Rounded currency amount.
 */
function roundMoney(value) {
	return Math.round(Number(value || 0) * 100) / 100;
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
