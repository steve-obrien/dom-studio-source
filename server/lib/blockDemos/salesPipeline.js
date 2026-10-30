const STAGE_OPTIONS = Object.freeze([
	{ value: 'qualified', label: 'Qualified', description: 'Budget and problem are confirmed.', probability: 25, tone: 'neutral', slaDays: 10 },
	{ value: 'solution', label: 'Solution fit', description: 'Discovery is complete and scope is mapped.', probability: 45, tone: 'primary', slaDays: 8 },
	{ value: 'proposal', label: 'Proposal', description: 'Commercial terms are with the buyer.', probability: 65, tone: 'warning', slaDays: 7 },
	{ value: 'legal', label: 'Legal review', description: 'Security, procurement, and legal are active.', probability: 80, tone: 'warning', slaDays: 6 },
	{ value: 'commit', label: 'Commit', description: 'The mutual close plan is active.', probability: 90, tone: 'success', slaDays: 5 },
]);

const OWNER_OPTIONS = Object.freeze([
	{ value: 'ada', label: 'Ada Riley', initials: 'AR', role: 'Enterprise AE' },
	{ value: 'maya', label: 'Maya Chen', initials: 'MC', role: 'Strategic AE' },
	{ value: 'jon', label: 'Jon Bell', initials: 'JB', role: 'Growth AE' },
	{ value: 'sam', label: 'Sam Patel', initials: 'SP', role: 'Partner lead' },
]);

const REGION_OPTIONS = Object.freeze([
	{ value: 'na', label: 'North America', description: 'United States and Canada' },
	{ value: 'emea', label: 'EMEA', description: 'Europe, Middle East, and Africa' },
	{ value: 'apac', label: 'APAC', description: 'Asia-Pacific expansion' },
]);

const FORECAST_OPTIONS = Object.freeze([
	{ value: 'pipeline', label: 'Pipeline', description: 'Uncommitted opportunity.', tone: 'neutral' },
	{ value: 'best_case', label: 'Best case', description: 'Possible this period with active work.', tone: 'primary' },
	{ value: 'commit', label: 'Commit', description: 'Expected to close this period.', tone: 'success' },
]);

const ACTIVITY_TYPE_OPTIONS = Object.freeze([
	{ value: 'call', label: 'Customer call', description: 'Retain the call outcome and next action.' },
	{ value: 'email', label: 'Email', description: 'Record a material buyer or seller email.' },
	{ value: 'meeting', label: 'Meeting', description: 'Retain an internal or customer meeting.' },
	{ value: 'note', label: 'Operator note', description: 'Add durable revenue-operations context.' },
]);

let workspace = createInitialWorkspace();

/**
 * Returns the complete authoritative sales-pipeline workspace.
 *
 * @returns {Record<string, unknown>} Serialized sales-pipeline payload.
 */
export function getSalesPipelineWorkspace() {
	return serializeResponse('Revenue workspace loaded.');
}

/**
 * Restores the deterministic sales-pipeline demo.
 *
 * @returns {Record<string, unknown>} Reset sales-pipeline payload.
 */
export function resetSalesPipelineWorkspace() {
	workspace = createInitialWorkspace();
	return serializeResponse('Revenue workspace reset.');
}

/**
 * Selects one deal at an exact workspace revision.
 *
 * @param {Record<string, unknown>} input Selection request.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function selectSalesPipelineDeal(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const deal = findDeal(input.dealId);
	if (!deal) return notFound('Deal');
	workspace.selectedDealId = deal.id;
	workspace.transitionPreview = null;
	workspace.revision += 1;
	return serializeResponse(`${deal.account} opened.`);
}

/**
 * Creates an immutable server-evaluated deal transition preview.
 *
 * @param {Record<string, unknown>} input Exact deal version and transition draft.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function previewSalesPipelineTransition(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const deal = findDeal(input.dealId);
	if (!deal) return notFound('Deal');
	if (Number(input.dealVersion) !== deal.version) return conflict('The deal changed while the transition was being prepared.');

	const draft = normalizeTransitionDraft(input);
	const draftError = validateTransitionDraft(draft);
	if (draftError) return draftError;
	const candidate = buildTransitionCandidate(deal, draft);
	const checksum = checksumFor(JSON.stringify({
		workspaceRevision: workspace.revision,
		dealId: deal.id,
		dealVersion: deal.version,
		draft,
		checks: candidate.checks.map((check) => [check.key, check.status]),
		forecastDelta: candidate.forecastDelta,
	}));

	workspace.selectedDealId = deal.id;
	workspace.transitionPreview = {
		id: `transition-plan-${workspace.sequence++}`,
		checksum,
		dealId: deal.id,
		dealVersion: deal.version,
		draft,
		candidate,
		createdAt: nowIso(),
		expiresAt: futureIso(15),
		requestedBy: workspace.actor.name,
	};
	workspace.revision += 1;
	return serializeResponse('Exact deal transition prepared.', {
		mutationReceipt: createMutationReceipt('deal_transition_previewed', deal),
	});
}

/**
 * Commits one acknowledged exact deal transition.
 *
 * @param {Record<string, unknown>} input Preview checksum and acknowledgement.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function commitSalesPipelineTransition(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const preview = workspace.transitionPreview;
	if (!preview) return validation('Review an exact deal transition before saving.', { previewChecksum: ['No active transition preview exists.'] });
	if (input.previewChecksum !== preview.checksum) return conflict('The transition plan changed. Review the latest deal evidence.');
	if (input.acknowledged !== true) return validation('Acknowledge the exact transition and forecast impact.', { acknowledged: ['Acknowledgement is required.'] });

	const deal = findDeal(preview.dealId);
	if (!deal) return notFound('Deal');
	if (deal.version !== preview.dealVersion) return conflict('The deal changed after the transition preview was created.');
	const failedChecks = preview.candidate.checks.filter((check) => check.status !== 'passed');
	if (failedChecks.length) return validation('Resolve every transition check before saving.', { policy: failedChecks.map((check) => check.detail) });

	const previousStage = deal.stage;
	const previousProbability = deal.probability;
	deal.stage = preview.draft.stage;
	deal.probability = preview.draft.probability;
	deal.forecast = preview.draft.forecast;
	deal.nextStep = preview.draft.nextStep;
	deal.closePlan = preview.draft.closePlan;
	deal.daysInStage = previousStage === deal.stage ? deal.daysInStage : 0;
	deal.version += 1;
	deal.updatedAt = nowIso();
	deal.crmReceipt = `crm-sync-${workspace.sequence++}`;
	workspace.transitionPreview = null;
	workspace.revision += 1;
	appendActivity('Deal transition saved', `${deal.account}: ${stageLabel(previousStage)} → ${stageLabel(deal.stage)} · ${previousProbability}% → ${deal.probability}%`, 'success', deal, deal.crmReceipt);

	return serializeResponse(`${deal.account} saved and synchronized.`, {
		transitionReceipt: {
			id: `transition-${workspace.sequence++}`,
			providerReceipt: deal.crmReceipt,
			dealId: deal.id,
			previousStage,
			stage: deal.stage,
			forecastDelta: preview.candidate.forecastDelta,
			checksum: preview.checksum,
			createdAt: nowIso(),
		},
		mutationReceipt: createMutationReceipt('deal_transition_committed', deal),
	});
}

/**
 * Logs one acknowledged sales activity against an exact deal version.
 *
 * @param {string} dealId Stable deal identifier.
 * @param {Record<string, unknown>} input Activity details and exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function logSalesPipelineActivity(dealId, input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const deal = findDeal(dealId);
	if (!deal) return notFound('Deal');
	if (Number(input.dealVersion) !== deal.version) return conflict('The deal changed while the activity was being logged.');

	const type = ACTIVITY_TYPE_OPTIONS.find((option) => option.value === String(input.type || ''));
	const title = String(input.title || '').trim();
	const outcome = String(input.outcome || '').trim();
	const nextStep = String(input.nextStep || '').trim();
	const fields = {};
	if (!type) fields.type = ['Choose a supported activity type.'];
	if (title.length < 5) fields.title = ['Summarize the activity in at least 5 characters.'];
	if (outcome.length < 12) fields.outcome = ['Retain a useful outcome of at least 12 characters.'];
	if (nextStep.length < 5) fields.nextStep = ['Add a clear next step.'];
	if (input.acknowledged !== true) fields.acknowledged = ['Confirm that the activity and outcome are accurate.'];
	if (Object.keys(fields).length) return validation('Review the activity record.', fields);

	const receipt = {
		id: `activity-${workspace.sequence++}`,
		providerReceipt: `engagement-${workspace.sequence++}`,
		type: type.label,
		title,
		outcome,
		nextStep,
		actor: workspace.actor.name,
		createdAt: nowIso(),
	};
	deal.lastActivity = title;
	deal.activityState = 'future';
	deal.nextStep = nextStep;
	deal.version += 1;
	deal.updatedAt = nowIso();
	deal.activityReceipts.unshift(receipt);
	workspace.revision += 1;
	appendActivity('Sales activity retained', `${deal.account} · ${type.label} · ${receipt.providerReceipt}`, 'success', deal, receipt.providerReceipt);

	return serializeResponse(`${type.label} retained for ${deal.account}.`, {
		activityReceipt: receipt,
		mutationReceipt: createMutationReceipt('sales_activity_logged', deal),
	});
}

/**
 * Refreshes deterministic CRM and forecast evidence.
 *
 * @param {Record<string, unknown>} input Exact workspace revision.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function refreshSalesPipelineForecast(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	workspace.forecastSyncs += 1;
	workspace.forecastProvider = {
		status: 'synchronized',
		provider: 'Revenue Cloud demo adapter',
		providerReceipt: `forecast-${workspace.sequence++}`,
		updatedAt: nowIso(),
	};
	workspace.revision += 1;
	appendActivity('Forecast synchronized', `${workspace.deals.length} opportunities reconciled with the CRM adapter.`, 'info', null, workspace.forecastProvider.providerReceipt);
	return serializeResponse('CRM and forecast evidence refreshed.', {
		mutationReceipt: createMutationReceipt('forecast_refreshed'),
	});
}

/**
 * Creates the deterministic seeded sales-pipeline workspace.
 *
 * @returns {Record<string, any>} Mutable workspace state.
 */
function createInitialWorkspace() {
	return {
		revision: 41,
		sequence: 701,
		forecastSyncs: 0,
		selectedDealId: 'deal_northstar',
		transitionPreview: null,
		actor: { id: 'usr-revops-1', name: 'Nadia Park', role: 'Revenue operations' },
		forecastProvider: {
			status: 'synchronized',
			provider: 'Revenue Cloud demo adapter',
			providerReceipt: 'forecast-698',
			updatedAt: '2026-08-02T08:42:00.000Z',
		},
		deals: [
			createDeal({ id: 'deal_northstar', version: 7, account: 'Northstar Labs', description: 'Enterprise product analytics rollout', stage: 'proposal', value: 128000, probability: 65, forecast: 'best_case', ownerId: 'ada', regionId: 'emea', closeDate: '2026-08-28', nextStep: 'Security review', activityState: 'today', daysInStage: 12, risks: ['Security', 'Legal'], stakeholders: ['Dana Moore · CFO', 'Eli Ramos · VP Product'], primaryBuyer: 'Dana Moore · CFO', closePlan: 'Confirm the security exception path, complete procurement review, then send the final order form.', pricingApproved: true, securityApproved: true, legalApproved: false, mutualPlan: false, lastActivity: 'Security workshop · 31 Jul' }),
			createDeal({ id: 'deal_evergreen', version: 9, account: 'Evergreen Clinics', description: 'Multi-location patient scheduling suite', stage: 'legal', value: 94000, probability: 78, forecast: 'commit', ownerId: 'maya', regionId: 'na', closeDate: '2026-08-21', nextStep: 'Resolve final MSA redline', activityState: 'overdue', daysInStage: 9, risks: ['MSA'], stakeholders: ['Lena Shah · COO', 'Procurement'], primaryBuyer: 'Lena Shah · COO', closePlan: 'Resolve the remaining MSA redline and confirm implementation dates before signature.', pricingApproved: true, securityApproved: true, legalApproved: false, mutualPlan: true, lastActivity: 'Procurement call · 29 Jul' }),
			createDeal({ id: 'deal_clearpath', version: 4, account: 'Clearpath Freight', description: 'Dispatch automation and customer portal', stage: 'solution', value: 76000, probability: 42, forecast: 'pipeline', ownerId: 'sam', regionId: 'na', closeDate: '2026-09-10', nextStep: 'Run EDI solution workshop', activityState: 'future', daysInStage: 4, risks: ['Integration'], stakeholders: ['Mira Cole · VP Ops'], primaryBuyer: 'Mira Cole · VP Ops', closePlan: 'Map the EDI integration scope and operational rollout before pricing approval.', pricingApproved: false, securityApproved: false, legalApproved: false, mutualPlan: false, lastActivity: 'Discovery call · 01 Aug' }),
			createDeal({ id: 'deal_summit', version: 11, account: 'Summit Finance', description: 'Compliance workflow expansion', stage: 'commit', value: 156000, probability: 91, forecast: 'commit', ownerId: 'ada', regionId: 'emea', closeDate: '2026-08-17', nextStep: 'Send final order form', activityState: 'today', daysInStage: 3, risks: [], stakeholders: ['Priya Desai · CIO', 'General Counsel'], primaryBuyer: 'Priya Desai · CIO', closePlan: 'Attach the data residency addendum and send the approved final order form for signature.', pricingApproved: true, securityApproved: true, legalApproved: true, mutualPlan: true, lastActivity: 'Legal approval · 01 Aug' }),
			createDeal({ id: 'deal_riverline', version: 3, account: 'Riverline Market', description: 'Seller onboarding and payouts workflow', stage: 'qualified', value: 52000, probability: 22, forecast: 'pipeline', ownerId: 'jon', regionId: 'na', closeDate: '2026-09-24', nextStep: 'Confirm implementation budget', activityState: 'missing', daysInStage: 14, risks: ['Budget'], stakeholders: ['Alex King · Founder'], primaryBuyer: 'Alex King · Founder', closePlan: 'Confirm implementation budget and the marketplace launch date before solution discovery.', pricingApproved: false, securityApproved: false, legalApproved: false, mutualPlan: false, lastActivity: 'No activity scheduled' }),
			createDeal({ id: 'deal_monarch', version: 6, account: 'Monarch Education', description: 'District onboarding and parent portal', stage: 'proposal', value: 112000, probability: 58, forecast: 'best_case', ownerId: 'maya', regionId: 'emea', closeDate: '2026-09-03', nextStep: 'Deliver board packet', activityState: 'overdue', daysInStage: 8, risks: ['Timeline'], stakeholders: ['Nora Bell · Superintendent', 'Finance'], primaryBuyer: 'Nora Bell · Superintendent', closePlan: 'Package the implementation timeline and proof points for the district board review.', pricingApproved: true, securityApproved: true, legalApproved: false, mutualPlan: false, lastActivity: 'Board prep · 30 Jul' }),
			createDeal({ id: 'deal_atlas', version: 5, account: 'Atlas Robotics', description: 'Developer platform usage expansion', stage: 'solution', value: 88000, probability: 50, forecast: 'best_case', ownerId: 'jon', regionId: 'apac', closeDate: '2026-09-14', nextStep: 'Align usage model', activityState: 'future', daysInStage: 6, risks: ['Pricing'], stakeholders: ['Kai Ito · CTO', 'Finance'], primaryBuyer: 'Kai Ito · CTO', closePlan: 'Align the usage model with the procurement cap before drafting the proposal.', pricingApproved: false, securityApproved: true, legalApproved: false, mutualPlan: false, lastActivity: 'Technical review · 01 Aug' }),
			createDeal({ id: 'deal_pixel', version: 2, account: 'Pixel Grove', description: 'Creative operations workspace', stage: 'qualified', value: 38000, probability: 30, forecast: 'pipeline', ownerId: 'sam', regionId: 'apac', closeDate: '2026-10-02', nextStep: 'Identify executive sponsor', activityState: 'missing', daysInStage: 11, risks: [], stakeholders: ['Rae Lin · Head of Studio'], primaryBuyer: '', closePlan: 'Identify an executive sponsor and confirm the agency rollout path before discovery.', pricingApproved: false, securityApproved: false, legalApproved: false, mutualPlan: false, lastActivity: 'No activity scheduled' }),
		],
		activity: [
			{ id: 'audit-700', title: 'Forecast synchronized', detail: '8 opportunities reconciled with the CRM adapter.', tone: 'info', actor: 'System', providerReceipt: 'forecast-698', dealId: null, createdAt: '2026-08-02T08:42:00.000Z' },
			{ id: 'audit-699', title: 'Security evidence approved', detail: 'Northstar Labs security package marked ready for legal review.', tone: 'success', actor: 'Nadia Park', providerReceipt: 'crm-sync-697', dealId: 'deal_northstar', createdAt: '2026-08-02T08:28:00.000Z' },
		],
	};
}

/**
 * Applies defaults to one seeded deal.
 *
 * @param {Record<string, any>} input Deal fields.
 * @returns {Record<string, any>} Complete mutable deal.
 */
function createDeal(input) {
	return {
		crmReceipt: `crm-seed-${input.id}`,
		activityReceipts: [],
		updatedAt: '2026-08-02T08:00:00.000Z',
		...input,
	};
}

/**
 * Serializes the workspace into a client-facing response.
 *
 * @param {string} message Human-readable response message.
 * @param {Record<string, unknown>} [extra={}] Extra receipt fields.
 * @returns {Record<string, unknown>} Client-safe payload.
 */
function serializeResponse(message, extra = {}) {
	const deals = workspace.deals.map(serializeDeal);
	const selectedDeal = deals.find((deal) => deal.id === workspace.selectedDealId) || deals[0];
	const metrics = calculateMetrics(deals);
	return {
		message,
		workspace: {
			revision: workspace.revision,
			period: 'Q3 enterprise',
			actor: workspace.actor,
			forecastProvider: workspace.forecastProvider,
			metrics,
		},
		catalogs: {
			stages: STAGE_OPTIONS,
			owners: OWNER_OPTIONS,
			regions: REGION_OPTIONS,
			forecasts: FORECAST_OPTIONS,
			activityTypes: ACTIVITY_TYPE_OPTIONS,
		},
		stages: STAGE_OPTIONS.map((stage) => {
			const stageDeals = deals.filter((deal) => deal.stage === stage.value);
			return {
				...stage,
				count: stageDeals.length,
				pipelineValue: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
				weightedValue: Math.round(stageDeals.reduce((sum, deal) => sum + deal.weightedValue, 0)),
				attentionCount: stageDeals.filter((deal) => ['overdue', 'missing'].includes(deal.activityState)).length,
			};
		}),
		deals,
		selectedDeal,
		transitionPreview: workspace.transitionPreview ? serializeTransitionPreview(workspace.transitionPreview) : null,
		activity: workspace.activity.slice(0, 40),
		...extra,
	};
}

/**
 * Adds catalog metadata and calculated health to one deal.
 *
 * @param {Record<string, any>} deal Mutable deal.
 * @returns {Record<string, any>} Decorated client deal.
 */
function serializeDeal(deal) {
	const stage = STAGE_OPTIONS.find((option) => option.value === deal.stage);
	const owner = OWNER_OPTIONS.find((option) => option.value === deal.ownerId);
	const region = REGION_OPTIONS.find((option) => option.value === deal.regionId);
	const forecast = FORECAST_OPTIONS.find((option) => option.value === deal.forecast);
	const activityMeta = activityStateMeta(deal.activityState);
	return {
		...deal,
		stageMeta: stage,
		owner,
		region,
		forecastMeta: forecast,
		activityMeta,
		weightedValue: Math.round(deal.value * deal.probability / 100),
		stageHealth: deal.daysInStage > stage.slaDays ? 'stale' : 'healthy',
		stageTargetOptions: STAGE_OPTIONS.map((option) => ({
			...option,
			disabled: Math.abs(stageIndex(option.value) - stageIndex(deal.stage)) > 1,
		})),
		evidence: {
			crmReceipt: deal.crmReceipt,
			version: deal.version,
			updatedAt: deal.updatedAt,
			activityReceipts: deal.activityReceipts,
			qualification: {
				primaryBuyer: deal.primaryBuyer,
				pricingApproved: deal.pricingApproved,
				securityApproved: deal.securityApproved,
				legalApproved: deal.legalApproved,
				mutualPlan: deal.mutualPlan,
			},
		},
	};
}

/**
 * Serializes a transition preview with current deal metadata.
 *
 * @param {Record<string, any>} preview Mutable preview.
 * @returns {Record<string, any>} Client transition preview.
 */
function serializeTransitionPreview(preview) {
	const deal = findDeal(preview.dealId);
	return {
		...preview,
		deal: deal ? serializeDeal(deal) : null,
		targetStage: STAGE_OPTIONS.find((option) => option.value === preview.draft.stage),
		forecast: FORECAST_OPTIONS.find((option) => option.value === preview.draft.forecast),
	};
}

/**
 * Calculates top-level pipeline metrics.
 *
 * @param {Array<Record<string, any>>} deals Decorated deals.
 * @returns {Record<string, number>} Pipeline metrics.
 */
function calculateMetrics(deals) {
	const pipeline = deals.reduce((sum, deal) => sum + deal.value, 0);
	const weighted = Math.round(deals.reduce((sum, deal) => sum + deal.weightedValue, 0));
	const commit = deals.filter((deal) => deal.forecast === 'commit').reduce((sum, deal) => sum + deal.value, 0);
	const attention = deals.filter((deal) => ['overdue', 'missing'].includes(deal.activityState) || deal.stageHealth === 'stale').length;
	return {
		pipeline,
		weighted,
		commit,
		attention,
		openDeals: deals.length,
		commitCoverage: pipeline ? Math.round(commit / pipeline * 100) : 0,
	};
}

/**
 * Normalizes a transition draft from an HTTP payload.
 *
 * @param {Record<string, unknown>} input Transition request.
 * @returns {Record<string, any>} Normalized draft.
 */
function normalizeTransitionDraft(input) {
	return {
		stage: String(input.stage || ''),
		probability: Number(input.probability),
		forecast: String(input.forecast || ''),
		nextStep: String(input.nextStep || '').trim(),
		closePlan: String(input.closePlan || '').trim(),
	};
}

/**
 * Validates transition draft field shape before policy evaluation.
 *
 * @param {Record<string, any>} draft Normalized draft.
 * @returns {Record<string, unknown>|null} Validation error or null.
 */
function validateTransitionDraft(draft) {
	const fields = {};
	if (!STAGE_OPTIONS.some((option) => option.value === draft.stage)) fields.stage = ['Choose a supported sales stage.'];
	if (!Number.isFinite(draft.probability) || draft.probability < 0 || draft.probability > 100) fields.probability = ['Use a probability between 0 and 100.'];
	if (!FORECAST_OPTIONS.some((option) => option.value === draft.forecast)) fields.forecast = ['Choose a supported forecast category.'];
	if (draft.nextStep.length < 5) fields.nextStep = ['Add a clear next step.'];
	if (draft.closePlan.length < 20) fields.closePlan = ['Retain a close plan of at least 20 characters.'];
	return Object.keys(fields).length ? validation('Review the transition details.', fields) : null;
}

/**
 * Builds server-owned stage and forecast checks for a deal transition.
 *
 * @param {Record<string, any>} deal Current deal.
 * @param {Record<string, any>} draft Normalized transition draft.
 * @returns {Record<string, any>} Candidate checks and forecast impact.
 */
function buildTransitionCandidate(deal, draft) {
	const currentIndex = stageIndex(deal.stage);
	const targetIndex = stageIndex(draft.stage);
	const stageDelta = targetIndex - currentIndex;
	const checks = [
		check('sequential', 'Stage path is valid', Math.abs(stageDelta) <= 1, stageDelta > 1 ? 'Advance one governed stage at a time.' : 'The target is current, previous, or next stage.'),
		check('buyer', 'Primary buyer is identified', Boolean(deal.primaryBuyer), deal.primaryBuyer || 'Identify a primary buyer before advancing.'),
		check('next_step', 'Next step is actionable', draft.nextStep.length >= 10, draft.nextStep.length >= 10 ? draft.nextStep : 'Add a more specific next step.'),
		check('close_plan', 'Close plan is retained', draft.closePlan.length >= 30, draft.closePlan.length >= 30 ? 'Close plan contains enough operational detail.' : 'Expand the close plan before advancing.'),
		check('close_date', 'Close date is in the active horizon', new Date(deal.closeDate).getTime() >= new Date('2026-08-02T00:00:00.000Z').getTime(), `Close date ${deal.closeDate}.`),
	];

	if (targetIndex >= stageIndex('legal')) {
		checks.push(check('pricing', 'Pricing approval is complete', deal.pricingApproved, deal.pricingApproved ? 'Approved pricing evidence is retained.' : 'Pricing approval is required for legal review.'));
		checks.push(check('security', 'Security evidence is complete', deal.securityApproved, deal.securityApproved ? 'Security evidence is approved.' : 'Security evidence is required for legal review.'));
	}
	if (targetIndex >= stageIndex('commit')) {
		checks.push(check('legal', 'Legal approval is complete', deal.legalApproved, deal.legalApproved ? 'Legal approval is retained.' : 'Legal approval is required for Commit.'));
		checks.push(check('mutual_plan', 'Mutual close plan is active', deal.mutualPlan, deal.mutualPlan ? 'Buyer and seller milestones are retained.' : 'Activate a mutual close plan before Commit.'));
		checks.push(check('forecast', 'Forecast category is Commit', draft.forecast === 'commit', draft.forecast === 'commit' ? 'Forecast category matches the target stage.' : 'Use Commit forecast category for this stage.'));
	}

	const currentWeighted = Math.round(deal.value * deal.probability / 100);
	const projectedWeighted = Math.round(deal.value * draft.probability / 100);
	return {
		checks,
		stageDelta,
		currentWeighted,
		projectedWeighted,
		forecastDelta: projectedWeighted - currentWeighted,
	};
}

/**
 * Creates one normalized policy check.
 *
 * @param {string} key Stable check key.
 * @param {string} label Human-readable label.
 * @param {boolean} passed Whether the policy passed.
 * @param {string} detail Evidence or remediation.
 * @returns {Record<string, string>} Serialized check.
 */
function check(key, label, passed, detail) {
	return { key, label, status: passed ? 'passed' : 'failed', detail };
}

/**
 * Finds one mutable deal by identifier.
 *
 * @param {unknown} dealId Deal identifier.
 * @returns {Record<string, any>|null} Matching deal or null.
 */
function findDeal(dealId) {
	return workspace.deals.find((deal) => deal.id === String(dealId || '')) || null;
}

/**
 * Returns the position of a stage in the governed pipeline.
 *
 * @param {string} stageId Stage identifier.
 * @returns {number} Zero-based stage position.
 */
function stageIndex(stageId) {
	return STAGE_OPTIONS.findIndex((option) => option.value === stageId);
}

/**
 * Returns the display label for a stage.
 *
 * @param {string} stageId Stage identifier.
 * @returns {string} Stage label.
 */
function stageLabel(stageId) {
	return STAGE_OPTIONS.find((option) => option.value === stageId)?.label || stageId;
}

/**
 * Returns display metadata for a next-activity state.
 *
 * @param {string} state Activity state.
 * @returns {Record<string, string>} Tone and label.
 */
function activityStateMeta(state) {
	return {
		overdue: { tone: 'danger', label: 'Activity overdue' },
		today: { tone: 'warning', label: 'Due today' },
		future: { tone: 'success', label: 'Next step scheduled' },
		missing: { tone: 'neutral', label: 'No activity' },
	}[state] || { tone: 'neutral', label: 'Unknown' };
}

/**
 * Appends one immutable workspace activity record.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @param {Record<string, any>|null} [deal=null] Related deal.
 * @param {string} [providerReceipt=''] Provider receipt.
 * @returns {void}
 */
function appendActivity(title, detail, tone, deal = null, providerReceipt = '') {
	workspace.activity.unshift({
		id: `audit-${workspace.sequence++}`,
		title,
		detail,
		tone,
		actor: workspace.actor.name,
		providerReceipt,
		dealId: deal?.id || null,
		createdAt: nowIso(),
	});
}

/**
 * Creates a mutation receipt for one state change.
 *
 * @param {string} action Stable mutation action.
 * @param {Record<string, any>|null} [deal=null] Related deal.
 * @returns {Record<string, unknown>} Mutation receipt.
 */
function createMutationReceipt(action, deal = null) {
	return {
		id: `mutation-${workspace.sequence++}`,
		action,
		workspaceRevision: workspace.revision,
		dealId: deal?.id || null,
		dealVersion: deal?.version || null,
		actor: workspace.actor.name,
		createdAt: nowIso(),
	};
}

/**
 * Requires an exact workspace revision.
 *
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict error or null.
 */
function requireWorkspaceRevision(revision) {
	return Number(revision) === workspace.revision
		? null
		: conflict(`Workspace revision ${workspace.revision} is current. Refresh before continuing.`);
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human-readable message.
 * @param {Record<string, string[]>} fields Field-specific errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { status: 422, error: 'validation_failed', message, fields };
}

/**
 * Creates a structured conflict response.
 *
 * @param {string} message Human-readable message.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message) {
	return { status: 409, error: 'revision_conflict', message };
}

/**
 * Creates a structured missing-resource response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { status: 404, error: 'not_found', message: `${resource} was not found.` };
}

/**
 * Returns the current ISO timestamp.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Returns a future ISO timestamp.
 *
 * @param {number} minutes Minutes from now.
 * @returns {string} Future ISO timestamp.
 */
function futureIso(minutes) {
	return new Date(Date.now() + minutes * 60000).toISOString();
}

/**
 * Creates a compact deterministic checksum for demo plans.
 *
 * @param {string} value Source value.
 * @returns {string} Demo checksum.
 */
function checksumFor(value) {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return `sha256:demo-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
