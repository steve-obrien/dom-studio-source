const segmentOptions = [
	{ value: 'growth', label: 'Growth teams', description: 'Standard product-led package set for scaling teams.' },
	{ value: 'platform', label: 'Developer platforms', description: 'Higher automation limits and technical support emphasis.' },
	{ value: 'agency', label: 'Agency workspaces', description: 'Flexible seats and client workspace packaging.' },
];

const cadenceOptions = [
	{ value: 'annual', label: 'Annual billing', description: 'Use committed annual price IDs and monthly equivalents.' },
	{ value: 'monthly', label: 'Monthly billing', description: 'Use flexible month-to-month price IDs.' },
];

const planSeeds = [
	{
		id: 'starter',
		name: 'Starter',
		description: 'For small teams proving the workflow.',
		monthlyPrice: 19,
		annualPrice: 15,
		includedSeats: 3,
		priceIds: { monthly: 'price_starter_monthly', annual: 'price_starter_annual' },
		customerCount: 1260,
		status: 'public',
	},
	{
		id: 'growth',
		name: 'Growth',
		description: 'For teams standardizing delivery.',
		monthlyPrice: 49,
		annualPrice: 39,
		includedSeats: 12,
		priceIds: { monthly: 'price_growth_monthly', annual: 'price_growth_annual' },
		customerCount: 482,
		status: 'recommended',
	},
	{
		id: 'scale',
		name: 'Scale',
		description: 'For mature teams with compliance needs.',
		monthlyPrice: 129,
		annualPrice: 99,
		includedSeats: 40,
		priceIds: { monthly: 'price_scale_monthly', annual: 'price_scale_annual' },
		customerCount: 74,
		status: 'sales_assisted',
	},
];

const entitlementSeeds = [
	{ key: 'seats.included', group: 'Workspace', label: 'Included seats', detail: 'Default seats before paid expansion.', valueType: 'limit', metered: false, values: { starter: 3, growth: 12, scale: 40 } },
	{ key: 'projects.active', group: 'Workspace', label: 'Active projects', detail: 'Projects visible to the team at once.', valueType: 'text', metered: false, values: { starter: '5', growth: 'Unlimited', scale: 'Unlimited' } },
	{ key: 'storage.total', group: 'Workspace', label: 'Storage', detail: 'Pooled files, exports, and attachments.', valueType: 'text', metered: false, values: { starter: '25 GB', growth: '250 GB', scale: '2 TB' } },
	{ key: 'automation.runs', group: 'Automation', label: 'Workflow runs', detail: 'Monthly automation executions enforced by the usage gateway.', valueType: 'limit', metered: true, values: { starter: 5000, growth: 50000, scale: 250000 } },
	{ key: 'integrations.premium', group: 'Automation', label: 'Premium integrations', detail: 'CRM, warehouse, billing, and identity syncs.', valueType: 'boolean', metered: false, values: { starter: false, growth: true, scale: true } },
	{ key: 'webhooks.retries', group: 'Automation', label: 'Webhook retry window', detail: 'How long failed delivery attempts remain retryable.', valueType: 'text', metered: false, values: { starter: '24 hours', growth: '7 days', scale: '30 days' } },
	{ key: 'support.priority', group: 'Service', label: 'Priority support', detail: 'Raised queue priority for account owners.', valueType: 'boolean', metered: false, values: { starter: false, growth: true, scale: true } },
	{ key: 'security.sso', group: 'Service', label: 'SAML SSO', detail: 'Single sign-on for managed company domains.', valueType: 'text', metered: false, values: { starter: 'Not included', growth: 'Add-on', scale: 'Included' } },
	{ key: 'success.manager', group: 'Service', label: 'Success manager', detail: 'Named owner for rollout planning and renewals.', valueType: 'boolean', metered: false, values: { starter: false, growth: false, scale: true } },
];

const addOnOptions = [
	{ value: 'extra-seats', label: 'Extra seat pack', description: 'Five flexible seats · $8 / month', amount: 8 },
	{ value: 'sso', label: 'SAML SSO', description: 'Managed-domain SSO · $29 / month', amount: 29 },
];

const publishedPlanSnapshot = clone(planSeeds);
const publishedEntitlementSnapshot = clone(entitlementSeeds);
let sequence = 8400;
let packagingState = createPackagingState();

/**
 * Returns the complete packaging draft, catalog, and release evidence.
 *
 * @returns {object} Packaging workspace.
 */
export function getEntitlementWorkspace() {
	return serializeWorkspace();
}

/**
 * Saves the packaging segment and billing cadence with optimistic revision control.
 *
 * @param {Record<string, unknown>} input Settings and current revision.
 * @returns {object} Updated workspace or API error.
 */
export function updatePackagingSettings(input = {}) {
	const mutationError = validateEditableMutation(input.revision);
	if (mutationError) return mutationError;
	const segmentId = String(input.segmentId || '');
	const cadence = String(input.cadence || '');
	if (!segmentOptions.some((option) => option.value === segmentId)) return { error: 'Choose an available customer segment.', status: 422 };
	if (!cadenceOptions.some((option) => option.value === cadence)) return { error: 'Choose an available billing cadence.', status: 422 };

	packagingState.package.segmentId = segmentId;
	packagingState.package.cadence = cadence;
	commitDraftChange('Updated package context', `${segmentLabel(segmentId)} · ${cadenceLabel(cadence)}`);
	return serializeWorkspace();
}

/**
 * Saves commercial fields for one plan with exact-revision protection.
 *
 * @param {string} planId Plan identifier.
 * @param {Record<string, unknown>} input Plan draft and current revision.
 * @returns {object} Updated workspace or API error.
 */
export function updatePlanDraft(planId, input = {}) {
	const mutationError = validateEditableMutation(input.revision);
	if (mutationError) return mutationError;
	const plan = packagingState.plans.find((candidate) => candidate.id === planId);
	if (!plan) return { error: 'Plan not found.', status: 404 };
	const name = String(input.name || '').trim();
	const description = String(input.description || '').trim();
	const monthlyPrice = Number(input.monthlyPrice);
	const annualPrice = Number(input.annualPrice);
	const includedSeats = Number(input.includedSeats);
	const monthlyPriceId = String(input.monthlyPriceId || '').trim();
	const annualPriceId = String(input.annualPriceId || '').trim();
	if (name.length < 2 || description.length < 12) return { error: 'Add a clear plan name and description.', status: 422 };
	if (![monthlyPrice, annualPrice].every((value) => Number.isFinite(value) && value > 0)) return { error: 'Monthly and annual prices must be positive numbers.', status: 422 };
	if (!Number.isInteger(includedSeats) || includedSeats < 1) return { error: 'Included seats must be a positive whole number.', status: 422 };
	if (![monthlyPriceId, annualPriceId].every(isValidPriceId)) return { error: 'Map both billing cadences to stable price IDs.', status: 422 };

	Object.assign(plan, {
		name,
		description,
		monthlyPrice,
		annualPrice,
		includedSeats,
		priceIds: { monthly: monthlyPriceId, annual: annualPriceId },
	});
	commitDraftChange('Updated plan terms', `${name} · $${annualPrice} annual equivalent`);
	return serializeWorkspace();
}

/**
 * Saves all plan values for one stable entitlement key.
 *
 * @param {string} entitlementKey Stable entitlement key.
 * @param {Record<string, unknown>} input Values and current revision.
 * @returns {object} Updated workspace or API error.
 */
export function updateEntitlementDraft(entitlementKey, input = {}) {
	const mutationError = validateEditableMutation(input.revision);
	if (mutationError) return mutationError;
	const entitlement = packagingState.entitlements.find((candidate) => candidate.key === entitlementKey);
	if (!entitlement) return { error: 'Entitlement not found.', status: 404 };
	const normalized = normalizeEntitlementValues(entitlement, input.values);
	if (normalized.error) return normalized;

	entitlement.values = normalized.values;
	commitDraftChange('Updated entitlement values', `${entitlement.key} · ${formatEntitlementSummary(entitlement)}`);
	return serializeWorkspace();
}

/**
 * Calculates affected workspaces and breaking changes against the live version.
 *
 * @param {Record<string, unknown>} input Current revision.
 * @returns {object} Updated workspace and impact evidence or API error.
 */
export function previewPackageImpact(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Impact is locked after publication begins.', status: 409 };
	const changes = calculateChanges();
	const planIds = [...new Set(changes.map((change) => change.planId))];
	const affectedWorkspaces = packagingState.plans
		.filter((plan) => planIds.includes(plan.id))
		.reduce((total, plan) => total + plan.customerCount, 0);
	const breakingChanges = changes.filter((change) => change.breaking).length;
	sequence += 1;
	packagingState.impact = {
		id: `impact_${sequence}`,
		revision: packagingState.package.revision,
		changedCells: changes.length,
		affectedWorkspaces,
		breakingChanges,
		migrationJobs: breakingChanges ? breakingChanges : 0,
		changes: changes.slice(0, 12),
		createdAt: 'Just now',
	};
	packagingState.activity.unshift(createActivity('Impact service', 'Calculated customer impact', `${affectedWorkspaces.toLocaleString('en-US')} workspaces · ${breakingChanges} breaking changes`));
	return {
		...serializeWorkspace(),
		impact: clone(packagingState.impact),
	};
}

/**
 * Runs server-owned catalog, runtime-key, usage-meter, and migration checks.
 *
 * @param {Record<string, unknown>} input Current revision.
 * @returns {object} Updated workspace and validation evidence or API error.
 */
export function validatePackageDraft(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Validation is locked after publication begins.', status: 409 };
	const checks = buildValidationChecks();
	sequence += 1;
	packagingState.validation = {
		id: `validation_${sequence}`,
		revision: packagingState.package.revision,
		ready: checks.every((check) => check.state !== 'blocked'),
		checks,
		createdAt: 'Just now',
	};
	packagingState.activity.unshift(createActivity('Packaging policy', 'Completed release checks', `${checks.filter((check) => check.state === 'passed').length} checks passed`));
	return {
		...serializeWorkspace(),
		validation: clone(packagingState.validation),
	};
}

/**
 * Creates a deterministic billing-provider checkout preview for one plan.
 *
 * @param {Record<string, unknown>} input Plan, cadence, seats, add-ons, and current revision.
 * @returns {object} Updated workspace and checkout receipt or API error.
 */
export function createCheckoutPreview(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Checkout previews are locked after publication begins.', status: 409 };
	const plan = packagingState.plans.find((candidate) => candidate.id === String(input.planId || ''));
	if (!plan) return { error: 'Choose an available plan.', status: 422 };
	const cadence = String(input.cadence || packagingState.package.cadence);
	if (!cadenceOptions.some((option) => option.value === cadence)) return { error: 'Choose an available billing cadence.', status: 422 };
	const seats = Number(input.seats);
	if (!Number.isInteger(seats) || seats < plan.includedSeats) return { error: `Choose at least ${plan.includedSeats} seats for ${plan.name}.`, status: 422 };
	const addOnIds = Array.isArray(input.addOnIds) ? [...new Set(input.addOnIds.map(String))] : [];
	if (addOnIds.some((id) => !addOnOptions.some((option) => option.value === id))) return { error: 'One or more add-ons are unavailable.', status: 422 };
	const unitPrice = cadence === 'annual' ? plan.annualPrice : plan.monthlyPrice;
	const addOnTotal = addOnOptions.filter((option) => addOnIds.includes(option.value)).reduce((total, option) => total + option.amount, 0);
	const monthlyTotal = unitPrice * seats + addOnTotal;
	sequence += 1;
	packagingState.checkoutReceipt = {
		id: `checkout_${sequence}`,
		providerSessionId: `cs_test_${sequence}`,
		revision: packagingState.package.revision,
		planId: plan.id,
		planName: plan.name,
		cadence,
		seats,
		priceId: plan.priceIds[cadence],
		addOnIds,
		monthlyTotal,
		invoiceTotal: cadence === 'annual' ? monthlyTotal * 12 : monthlyTotal,
		currency: 'USD',
		state: 'ready',
		createdAt: 'Just now',
	};
	packagingState.activity.unshift(createActivity('Billing provider', 'Created checkout preview', `${plan.name} · ${seats} seats · ${packagingState.checkoutReceipt.providerSessionId}`));
	return {
		...serializeWorkspace(),
		receipt: clone(packagingState.checkoutReceipt),
	};
}

/**
 * Publishes a checked package draft behind an explicit acknowledgement.
 *
 * @param {Record<string, unknown>} input Current revision and acknowledgement.
 * @returns {object} Updated workspace and immutable release receipt or API error.
 */
export function publishPackageDraft(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'This package version is already publishing.', status: 409 };
	if (input.acknowledged !== true) return { error: 'Confirm the customer impact, checkout mapping, and runtime entitlement changes.', status: 422 };
	if (!packagingState.impact || packagingState.impact.revision !== packagingState.package.revision) return { error: 'Calculate impact for the current revision before publishing.', status: 409 };
	if (!packagingState.validation || packagingState.validation.revision !== packagingState.package.revision || !packagingState.validation.ready) return { error: 'Run release checks for the current revision before publishing.', status: 409 };
	if (!packagingState.checkoutReceipt || packagingState.checkoutReceipt.revision !== packagingState.package.revision) return { error: 'Create a checkout preview for the current revision before publishing.', status: 409 };

	sequence += 1;
	packagingState.release = {
		id: `release_${sequence}`,
		version: packagingState.package.version,
		fromVersion: packagingState.package.liveVersion,
		revision: packagingState.package.revision,
		state: 'queued',
		label: 'Queued for propagation',
		checksum: `pkg_${packagingState.package.version}_${sequence}`,
		affectedWorkspaces: packagingState.impact.affectedWorkspaces,
		changedCells: packagingState.impact.changedCells,
		createdAt: 'Just now',
	};
	packagingState.package.status = 'publishing';
	packagingState.package.revision += 1;
	packagingState.activity.unshift(createActivity('Morgan Lee', 'Published package version', `v${packagingState.release.version} · ${packagingState.release.checksum}`));
	return {
		...serializeWorkspace(),
		release: clone(packagingState.release),
	};
}

/**
 * Advances the deterministic entitlement propagation worker.
 *
 * @returns {object} Updated workspace and rollout evidence or API error.
 */
export function advancePackageRollout() {
	if (!packagingState.release) return { error: 'Publish the package before advancing rollout.', status: 409 };
	if (packagingState.release.state === 'completed') return { error: 'Package rollout is already complete.', status: 409 };
	if (packagingState.release.state === 'queued') {
		packagingState.release.state = 'propagating';
		packagingState.release.label = 'Propagating catalog and runtime gates';
		packagingState.activity.unshift(createActivity('Release worker', 'Started entitlement propagation', 'Billing catalog, feature flags, and usage gateway are updating.'));
	} else {
		packagingState.release.state = 'completed';
		packagingState.release.label = 'Published to every enforcement surface';
		packagingState.package.status = 'published';
		packagingState.package.liveVersion = packagingState.package.version;
		packagingState.activity.unshift(createActivity('Release worker', 'Completed entitlement propagation', `Version ${packagingState.release.version} is live across every enforcement surface.`));
	}
	return {
		...serializeWorkspace(),
		release: clone(packagingState.release),
	};
}

/**
 * Restores the deterministic packaging demonstration state.
 *
 * @returns {object} Fresh packaging workspace.
 */
export function resetEntitlementMatrix() {
	packagingState = createPackagingState();
	return serializeWorkspace();
}

/**
 * Creates isolated mutable state for a packaging draft.
 *
 * @returns {object} Mutable packaging state.
 */
function createPackagingState() {
	return {
		package: {
			id: 'core-plans',
			name: 'Core plans',
			status: 'draft',
			version: 4,
			liveVersion: 3,
			revision: 7,
			segmentId: 'growth',
			cadence: 'annual',
			owner: 'Revenue operations',
		},
		plans: clone(planSeeds),
		entitlements: clone(entitlementSeeds),
		validation: null,
		impact: null,
		checkoutReceipt: null,
		release: null,
		versions: [
			{ id: 'v4', version: 4, status: 'draft', label: 'Draft v4', detail: 'Edited 18 minutes ago' },
			{ id: 'v3', version: 3, status: 'published', label: 'Live v3', detail: 'Published Jul 12' },
			{ id: 'v2', version: 2, status: 'archived', label: 'Archived v2', detail: 'Published Mar 04' },
		],
		activity: [
			createActivity('Morgan Lee', 'Created package draft v4', 'Copied from live version 3.'),
			createActivity('Usage service', 'Verified metered keys', 'automation.runs is connected to the monthly usage ledger.'),
			createActivity('Billing catalog', 'Synchronized live price IDs', 'Six provider prices are active.'),
		],
	};
}

/**
 * Serializes the current packaging state with calculated summaries.
 *
 * @returns {object} Immutable packaging workspace.
 */
function serializeWorkspace() {
	const changes = calculateChanges();
	return {
		package: clone(packagingState.package),
		plans: clone(packagingState.plans),
		entitlements: clone(packagingState.entitlements),
		catalog: {
			segmentOptions: clone(segmentOptions),
			cadenceOptions: clone(cadenceOptions),
			addOnOptions: clone(addOnOptions),
			groups: [...new Set(packagingState.entitlements.map((entitlement) => entitlement.group))],
		},
		summary: {
			planCount: packagingState.plans.length,
			entitlementCount: packagingState.entitlements.length,
			meteredCount: packagingState.entitlements.filter((entitlement) => entitlement.metered).length,
			customerCount: packagingState.plans.reduce((total, plan) => total + plan.customerCount, 0),
			unsavedChanges: changes.length,
		},
		versions: clone(packagingState.versions),
		validation: clone(packagingState.validation),
		impact: clone(packagingState.impact),
		checkoutReceipt: clone(packagingState.checkoutReceipt),
		release: clone(packagingState.release),
		activity: clone(packagingState.activity),
	};
}

/**
 * Commits a draft mutation and invalidates revision-bound release evidence.
 *
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commitDraftChange(action, detail) {
	packagingState.package.revision += 1;
	packagingState.validation = null;
	packagingState.impact = null;
	packagingState.checkoutReceipt = null;
	packagingState.activity.unshift(createActivity('Morgan Lee', action, detail));
}

/**
 * Validates that a mutation targets the current editable revision.
 *
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Mutation error or null.
 */
function validateEditableMutation(revision) {
	const revisionError = validateRevision(revision);
	if (revisionError) return revisionError;
	if (isLocked()) return { error: 'Published package versions are locked. Reset the example to edit another draft.', status: 409 };
	return null;
}

/**
 * Validates an exact package revision.
 *
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Conflict response or null.
 */
function validateRevision(revision) {
	if (Number(revision) === packagingState.package.revision) return null;
	return { error: `Package changed to revision ${packagingState.package.revision}. Reload before continuing.`, status: 409 };
}

/**
 * Reports whether a package has entered its immutable release lifecycle.
 *
 * @returns {boolean} Whether editing is locked.
 */
function isLocked() {
	return Boolean(packagingState.release);
}

/**
 * Normalizes plan values according to an entitlement's value type.
 *
 * @param {object} entitlement Entitlement definition.
 * @param {unknown} inputValues Candidate values.
 * @returns {{ values?: Record<string, boolean|number|string>, error?: string, status?: number }} Normalized values or API error.
 */
function normalizeEntitlementValues(entitlement, inputValues) {
	if (!inputValues || typeof inputValues !== 'object') return { error: 'Provide one value for every plan.', status: 422 };
	const values = {};
	for (const plan of packagingState.plans) {
		const candidate = inputValues[plan.id];
		if (entitlement.valueType === 'boolean') {
			if (typeof candidate !== 'boolean') return { error: `${plan.name} requires an included or excluded value.`, status: 422 };
			values[plan.id] = candidate;
			continue;
		}
		if (entitlement.valueType === 'limit') {
			const number = Number(candidate);
			if (!Number.isInteger(number) || number < 0) return { error: `${plan.name} requires a non-negative whole-number limit.`, status: 422 };
			values[plan.id] = number;
			continue;
		}
		const text = String(candidate ?? '').trim();
		if (!text || text.length > 64) return { error: `${plan.name} requires a concise entitlement value.`, status: 422 };
		values[plan.id] = text;
	}
	return { values };
}

/**
 * Calculates current draft differences against live package version 3.
 *
 * @returns {Array<object>} Plan and entitlement changes.
 */
function calculateChanges() {
	const changes = [];
	for (const plan of packagingState.plans) {
		const published = publishedPlanSnapshot.find((candidate) => candidate.id === plan.id);
		for (const field of ['name', 'description', 'monthlyPrice', 'annualPrice', 'includedSeats']) {
			if (plan[field] === published[field]) continue;
			changes.push({
				kind: 'plan',
				planId: plan.id,
				key: field,
				from: published[field],
				to: plan[field],
				breaking: ['monthlyPrice', 'annualPrice'].includes(field) ? Number(plan[field]) > Number(published[field]) : field === 'includedSeats' && Number(plan[field]) < Number(published[field]),
			});
		}
	}
	for (const entitlement of packagingState.entitlements) {
		const published = publishedEntitlementSnapshot.find((candidate) => candidate.key === entitlement.key);
		for (const plan of packagingState.plans) {
			const from = published.values[plan.id];
			const to = entitlement.values[plan.id];
			if (from === to) continue;
			changes.push({
				kind: 'entitlement',
				planId: plan.id,
				key: entitlement.key,
				from,
				to,
				breaking: isBreakingChange(from, to),
			});
		}
	}
	return changes;
}

/**
 * Reports whether an entitlement change removes or reduces access.
 *
 * @param {boolean|number|string} from Live value.
 * @param {boolean|number|string} to Draft value.
 * @returns {boolean} Whether the change can remove access.
 */
function isBreakingChange(from, to) {
	if (from === true && to === false) return true;
	if (typeof from === 'number' && typeof to === 'number') return to < from;
	if (String(from).toLowerCase() === 'unlimited' && String(to).toLowerCase() !== 'unlimited') return true;
	return false;
}

/**
 * Builds authoritative package release checks.
 *
 * @returns {Array<object>} Validation checks.
 */
function buildValidationChecks() {
	const allPriceIds = packagingState.plans.flatMap((plan) => Object.values(plan.priceIds));
	const uniquePriceIds = new Set(allPriceIds);
	const impactCurrent = packagingState.impact?.revision === packagingState.package.revision;
	return [
		{ id: 'price_ids', label: 'Billing price IDs', detail: `${allPriceIds.length} stable provider mappings`, state: allPriceIds.every(isValidPriceId) && uniquePriceIds.size === allPriceIds.length ? 'passed' : 'blocked' },
		{ id: 'runtime_keys', label: 'Runtime entitlement keys', detail: `${packagingState.entitlements.length} unique keys`, state: new Set(packagingState.entitlements.map((entitlement) => entitlement.key)).size === packagingState.entitlements.length ? 'passed' : 'blocked' },
		{ id: 'usage_meters', label: 'Usage meter coverage', detail: `${packagingState.entitlements.filter((entitlement) => entitlement.metered).length} metered limit connected`, state: packagingState.entitlements.filter((entitlement) => entitlement.metered).every((entitlement) => entitlement.valueType === 'limit') ? 'passed' : 'blocked' },
		{ id: 'impact', label: 'Customer impact preview', detail: impactCurrent ? `${packagingState.impact.affectedWorkspaces.toLocaleString('en-US')} affected workspaces` : 'Run impact before publishing', state: impactCurrent ? 'passed' : 'blocked' },
	];
}

/**
 * Validates a billing provider price identifier.
 *
 * @param {unknown} value Candidate price ID.
 * @returns {boolean} Whether the ID is acceptable.
 */
function isValidPriceId(value) {
	return /^price_[a-z0-9_]+$/.test(String(value || ''));
}

/**
 * Summarizes one entitlement across plan values.
 *
 * @param {object} entitlement Entitlement record.
 * @returns {string} Compact value summary.
 */
function formatEntitlementSummary(entitlement) {
	return packagingState.plans.map((plan) => `${plan.name}: ${formatValue(entitlement.values[plan.id])}`).join(' · ');
}

/**
 * Formats an entitlement value for audit and activity copy.
 *
 * @param {boolean|number|string} value Entitlement value.
 * @returns {string} Readable value.
 */
function formatValue(value) {
	if (value === true) return 'Included';
	if (value === false) return 'Not included';
	return String(value);
}

/**
 * Resolves a customer segment label.
 *
 * @param {string} value Segment value.
 * @returns {string} Segment label.
 */
function segmentLabel(value) {
	return segmentOptions.find((option) => option.value === value)?.label || value;
}

/**
 * Resolves a billing cadence label.
 *
 * @param {string} value Cadence value.
 * @returns {string} Cadence label.
 */
function cadenceLabel(value) {
	return cadenceOptions.find((option) => option.value === value)?.label || value;
}

/**
 * Builds a compact activity event.
 *
 * @param {string} actor Activity actor.
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {object} Activity record.
 */
function createActivity(actor, action, detail) {
	sequence += 1;
	return { id: `activity_${sequence}`, actor, action, detail, createdAt: 'Just now' };
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
