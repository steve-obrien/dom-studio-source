import { createHash } from 'node:crypto';

const goalOptions = Object.freeze([
	{ value: 'activation', label: 'Activation', description: 'Help new workspaces reach their first useful outcome.' },
	{ value: 'adoption', label: 'Feature adoption', description: 'Introduce a released capability to qualified accounts.' },
	{ value: 'expansion', label: 'Expansion', description: 'Guide engaged teams toward a paid capability.' },
]);

const targetOptions = Object.freeze([
	{ value: 'setup-card', label: 'Setup checklist', selector: '[data-tour="setup-card"]', route: '/home', screen: 'Home', description: 'Workspace setup progress and first-run tasks.', devices: ['desktop', 'mobile'] },
	{ value: 'connect-data', label: 'Connect data', selector: '[data-tour="connect-data"]', route: '/home', screen: 'Home', description: 'Primary data-source connection surface.', devices: ['desktop', 'mobile'] },
	{ value: 'invite-button', label: 'Invite team', selector: '[data-tour="invite-button"]', route: '/home', screen: 'Home', description: 'Member invitation action in the workspace header.', devices: ['desktop'] },
	{ value: 'publish-workflow', label: 'Publish workflow', selector: '[data-tour="publish-workflow"]', route: '/workflows', screen: 'Workflow', description: 'First workflow publication action.', devices: ['desktop', 'mobile'] },
	{ value: 'usage-insights', label: 'Usage insights', selector: '[data-tour="usage-insights"]', route: '/insights', screen: 'Insights', description: 'Adoption analytics navigation item.', devices: ['desktop'] },
]);

const placementOptions = Object.freeze([
	{ value: 'start-bottom', label: 'Start bottom', description: 'Before the target, aligned toward its lower edge.' },
	{ value: 'start', label: 'Start', description: 'Before the target in the current writing direction.' },
	{ value: 'start-top', label: 'Start top', description: 'Before the target, aligned toward its upper edge.' },
	{ value: 'top-start', label: 'Top start', description: 'Above the target, aligned toward its leading edge.' },
	{ value: 'top', label: 'Top', description: 'Above the target with automatic collision handling.' },
	{ value: 'top-end', label: 'Top end', description: 'Above the target, aligned toward its trailing edge.' },
	{ value: 'end-top', label: 'End top', description: 'After the target, aligned toward its upper edge.' },
	{ value: 'end', label: 'End', description: 'After the target in the current writing direction.' },
	{ value: 'end-bottom', label: 'End bottom', description: 'After the target, aligned toward its lower edge.' },
	{ value: 'bottom-end', label: 'Bottom end', description: 'Below the target, aligned toward its trailing edge.' },
	{ value: 'bottom', label: 'Bottom', description: 'Below the target with automatic collision handling.' },
	{ value: 'bottom-start', label: 'Bottom start', description: 'Below the target, aligned toward its leading edge.' },
]);

const triggerOptions = Object.freeze([
	{ value: 'page_load', label: 'Page load', description: 'Evaluate eligibility when the target route becomes ready.' },
	{ value: 'intent', label: 'Intent signal', description: 'Launch after a matching product action or analytics event.' },
	{ value: 'manual', label: 'Manual', description: 'Let product code request this tour explicitly.' },
]);

const segmentOptions = Object.freeze([
	{ value: 'trial_admins', label: 'Trial admins', description: 'Workspace owners inside the first fourteen days.', count: 12400 },
	{ value: 'starter_owners', label: 'Starter owners', description: 'Paid self-serve owners with upgrade signals.', count: 3800 },
	{ value: 'new_members', label: 'New members', description: 'People in their first seven days after accepting an invite.', count: 6100 },
]);

const behaviorOptions = Object.freeze([
	{ value: 'no_connected_source', label: 'No connected source', description: 'Exclude workspaces that already completed data setup.', ratio: 0.64 },
	{ value: 'no_published_workflow', label: 'No published workflow', description: 'Target teams that have not completed a first launch.', ratio: 0.48 },
	{ value: 'all_eligible', label: 'All eligible accounts', description: 'Do not add a behavioral eligibility filter.', ratio: 1 },
]);

const timezoneOptions = Object.freeze([
	{ value: 'Europe/London', label: 'London', description: 'GMT / British Summer Time' },
	{ value: 'America/New_York', label: 'New York', description: 'Eastern Time' },
	{ value: 'America/Los_Angeles', label: 'Los Angeles', description: 'Pacific Time' },
	{ value: 'Asia/Singapore', label: 'Singapore', description: 'Singapore Standard Time' },
]);

let tour = createInitialTour();
let previewSequence = 220;
let releaseSequence = 810;

/**
 * Returns the authoring product, reusable choices, and current tour draft.
 *
 * @returns {Record<string, unknown>} Complete product-tour builder payload.
 */
export function getProductTourBuilderBootstrap() {
	return cloneValue({
		product: {
			name: 'Northstar',
			workspace: 'Growth workspace',
		},
		viewer: {
			name: 'Maya Chen',
			initials: 'MC',
			role: 'Product growth',
		},
		options: {
			goals: goalOptions,
			targets: targetOptions,
			placements: placementOptions,
			triggers: triggerOptions,
			segments: segmentOptions,
			behaviors: behaviorOptions,
			timezones: timezoneOptions,
		},
		tour: serializeTour(),
	});
}

/**
 * Returns one tour draft by its stable identifier.
 *
 * @param {string} tourId Tour identifier.
 * @returns {Record<string, unknown>} Tour payload or structured API error.
 */
export function getProductTour(tourId) {
	const tourError = validateTourId(tourId);
	if (tourError) return tourError;
	return cloneValue({ tour: serializeTour() });
}

/**
 * Saves tour-level goal, audience, trigger, and schedule settings.
 *
 * @param {string} tourId Tour identifier.
 * @param {Record<string, unknown>} input Settings and optimistic revision.
 * @returns {Record<string, unknown>} Updated tour or structured API error.
 */
export function updateProductTourSettings(tourId, input = {}) {
	const tourError = validateTourId(tourId);
	if (tourError) return tourError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const name = normalizeText(input.name, 72);
	const goal = String(input.goal || '');
	const trigger = String(input.trigger || '');
	const segment = String(input.segment || '');
	const behavior = String(input.behavior || '');
	const holdoutPercent = Number(input.holdoutPercent);
	const launchDate = normalizeDate(input.launchDate);
	const timezone = String(input.timezone || '');
	const fields = [];
	if (name.length < 3) fields.push({ field: 'name', message: 'Use at least three characters.' });
	if (!goalOptions.some((option) => option.value === goal)) fields.push({ field: 'goal', message: 'Choose an available goal.' });
	if (!triggerOptions.some((option) => option.value === trigger)) fields.push({ field: 'trigger', message: 'Choose an available trigger.' });
	if (!segmentOptions.some((option) => option.value === segment)) fields.push({ field: 'segment', message: 'Choose an audience segment.' });
	if (!behaviorOptions.some((option) => option.value === behavior)) fields.push({ field: 'behavior', message: 'Choose an eligibility rule.' });
	if (!Number.isInteger(holdoutPercent) || holdoutPercent < 5 || holdoutPercent > 50) fields.push({ field: 'holdoutPercent', message: 'Use a whole-number holdout between 5% and 50%.' });
	if (!isFutureDate(launchDate)) fields.push({ field: 'launchDate', message: 'Choose today or a future launch date.' });
	if (!timezoneOptions.some((option) => option.value === timezone)) fields.push({ field: 'timezone', message: 'Choose a supported timezone.' });
	if (fields.length) return validation('Check the tour setup and try again.', fields);
	tour.name = name;
	tour.goal = goal;
	tour.trigger = trigger;
	tour.audience = { segment, behavior, holdoutPercent };
	tour.schedule = { launchDate, timezone };
	tour.status = tour.status === 'scheduled' ? 'draft' : tour.status;
	tour.release = null;
	tour.lastValidation = null;
	commitTour('Tour setup saved');
	return success('Tour setup saved.', { tour: serializeTour() });
}

/**
 * Validates and saves one product-tour step.
 *
 * @param {string} tourId Tour identifier.
 * @param {string} stepId Step identifier.
 * @param {Record<string, unknown>} input Editable step fields and optimistic revision.
 * @returns {Record<string, unknown>} Updated tour and step or structured API error.
 */
export function updateProductTourStep(tourId, stepId, input = {}) {
	const tourError = validateTourId(tourId);
	if (tourError) return tourError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const step = tour.steps.find((candidate) => candidate.id === String(stepId || ''));
	if (!step) return notFound('Tour step');
	const title = normalizeText(input.title, 72);
	const body = normalizeText(input.body, 240);
	const cta = normalizeText(input.cta, 32);
	const targetId = String(input.targetId || '');
	const placement = String(input.placement || '');
	const target = targetOptions.find((option) => option.value === targetId);
	const fields = [];
	if (title.length < 3) fields.push({ field: 'title', message: 'Use at least three characters.' });
	if (body.length < 12) fields.push({ field: 'body', message: 'Explain the action in at least twelve characters.' });
	if (cta.length < 2) fields.push({ field: 'cta', message: 'Add a clear call to action.' });
	if (!target) fields.push({ field: 'targetId', message: 'Choose a registered product target.' });
	if (!placementOptions.some((option) => option.value === placement)) fields.push({ field: 'placement', message: 'Choose an available placement.' });
	if (fields.length) return validation('Check the selected step and try again.', fields);
	const targetChanged = step.targetId !== targetId;
	step.title = title;
	step.body = body;
	step.cta = cta;
	step.targetId = targetId;
	step.targetLabel = target.label;
	step.targetSelector = target.selector;
	step.route = target.route;
	step.placement = placement;
	step.status = input.reviewed === true && target.devices.includes('mobile') ? 'ready' : targetChanged || input.reviewed !== true ? 'review_required' : 'ready';
	step.updatedAt = new Date().toISOString();
	tour.status = 'draft';
	tour.release = null;
	tour.lastValidation = null;
	commitTour(input.reviewed === true ? `Step reviewed: ${title}` : `Step saved: ${title}`);
	return success(input.reviewed === true && step.status === 'ready'
		? 'Step saved and marked ready.'
		: target.devices.includes('mobile')
			? 'Step saved. Review the preview before publishing.'
			: 'Step saved. This target still needs a mobile alternative.', {
		tour: serializeTour(),
		step: cloneValue(step),
	});
}

/**
 * Duplicates one step directly after its source for iterative authoring.
 *
 * @param {string} tourId Tour identifier.
 * @param {string} stepId Source step identifier.
 * @param {Record<string, unknown>} input Optimistic revision.
 * @returns {Record<string, unknown>} Updated tour and duplicated step or API error.
 */
export function duplicateProductTourStep(tourId, stepId, input = {}) {
	const tourError = validateTourId(tourId);
	if (tourError) return tourError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const index = tour.steps.findIndex((step) => step.id === String(stepId || ''));
	if (index < 0) return notFound('Tour step');
	if (tour.steps.length >= 8) return validation('This demo supports up to eight tour steps.');
	const source = tour.steps[index];
	const duplicate = {
		...cloneValue(source),
		id: `step-${Date.now().toString(36)}`,
		title: `${source.title} copy`,
		status: 'review_required',
		updatedAt: new Date().toISOString(),
	};
	tour.steps.splice(index + 1, 0, duplicate);
	tour.lastValidation = null;
	commitTour(`Step duplicated: ${source.title}`);
	return success('Step duplicated and added to the sequence.', { tour: serializeTour(), step: cloneValue(duplicate) });
}

/**
 * Runs server-owned content, selector, audience, and scheduling checks.
 *
 * @param {string} tourId Tour identifier.
 * @param {Record<string, unknown>} input Optimistic revision.
 * @returns {Record<string, unknown>} Validation results and updated tour or API error.
 */
export function validateProductTour(tourId, input = {}) {
	const tourError = validateTourId(tourId);
	if (tourError) return tourError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const validationResult = buildValidation();
	tour.lastValidation = {
		id: `validation-${tour.revision + 1}`,
		tourRevision: tour.revision + 1,
		status: validationResult.ready ? 'passed' : 'failed',
		checkedAt: new Date().toISOString(),
		checks: validationResult.checks,
	};
	commitTour(validationResult.ready ? 'Launch validation passed' : 'Launch validation needs attention');
	return success(validationResult.ready ? 'All launch checks passed.' : 'Launch checks found work to review.', {
		tour: serializeTour(),
		validation: cloneValue(tour.lastValidation),
	});
}

/**
 * Creates an expiring preview session backed by the current draft revision.
 *
 * @param {string} tourId Tour identifier.
 * @param {Record<string, unknown>} input Device and optimistic revision.
 * @returns {Record<string, unknown>} Preview session proof or API error.
 */
export function createProductTourPreview(tourId, input = {}) {
	const tourError = validateTourId(tourId);
	if (tourError) return tourError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const device = ['desktop', 'mobile'].includes(String(input.device)) ? String(input.device) : 'desktop';
	const now = Date.now();
	const id = `preview-${++previewSequence}`;
	const proof = createHash('sha256').update(`${id}:${tour.id}:${tour.revision}:${device}`).digest('hex');
	return success('Preview session created from the current draft.', {
		preview: {
			id,
			device,
			tourRevision: tour.revision,
			url: `/preview/product-tours/${id}`,
			createdAt: new Date(now).toISOString(),
			expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
			proof,
		},
	});
}

/**
 * Schedules a validated tour and returns immutable publication proof.
 *
 * @param {string} tourId Tour identifier.
 * @param {Record<string, unknown>} input Acknowledgement and optimistic revision.
 * @returns {Record<string, unknown>} Scheduled release receipt or API error.
 */
export function publishProductTour(tourId, input = {}) {
	const tourError = validateTourId(tourId);
	if (tourError) return tourError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (tour.release) return success('This tour is already scheduled.', { tour: serializeTour(), receipt: cloneValue(tour.release) });
	const validationResult = buildValidation();
	if (!validationResult.ready) return validation('Resolve every launch check before publishing.', validationResult.checks.filter((check) => check.status !== 'passed').map((check) => ({ field: check.id, message: check.detail })), { checks: validationResult.checks });
	if (tour.lastValidation?.status !== 'passed' || tour.lastValidation?.tourRevision !== tour.revision) {
		return validation('Run launch checks for the current revision before publishing.', [{ field: 'validation', message: 'The current revision does not have a passing server validation.' }]);
	}
	if (input.acknowledged !== true) return validation('Confirm the audience and schedule before publishing.', [{ field: 'acknowledged', message: 'Publication requires acknowledgement.' }]);
	const publishedAt = new Date().toISOString();
	const reference = `TOUR-${++releaseSequence}`;
	const proof = createHash('sha256').update(JSON.stringify({
		reference,
		tourId: tour.id,
		revision: tour.revision,
		steps: tour.steps.map(({ id, targetSelector, placement }) => ({ id, targetSelector, placement })),
		audience: tour.audience,
		schedule: tour.schedule,
		publishedAt,
	})).digest('hex');
	tour.status = 'scheduled';
	tour.release = {
		id: `release-${releaseSequence}`,
		reference,
		status: 'scheduled',
		scheduledFor: `${tour.schedule.launchDate}T09:00:00.000Z`,
		publishedAt,
		proof,
	};
	commitTour('Tour scheduled');
	return success(`${tour.name} is scheduled.`, { tour: serializeTour(), receipt: cloneValue(tour.release) });
}

/**
 * Creates the initial process-local authoring draft.
 *
 * @returns {Record<string, unknown>} Initial product-tour record.
 */
function createInitialTour() {
	const now = new Date().toISOString();
	return {
		id: 'tour_activation_v4',
		name: 'Trial activation tour',
		status: 'draft',
		revision: 28,
		goal: 'activation',
		trigger: 'page_load',
		audience: {
			segment: 'trial_admins',
			behavior: 'no_connected_source',
			holdoutPercent: 10,
		},
		schedule: {
			launchDate: futureDate(5),
			timezone: 'Europe/London',
		},
		steps: [
			createStep('step-setup', 'Show setup progress', 'Start with the setup checklist so new admins can see what remains before activation.', 'Show me', 'setup-card', 'bottom', 'ready'),
			createStep('step-connect', 'Connect source data', 'Point teams to the source that unlocks dashboards, automations, and account health.', 'Connect source', 'connect-data', 'start', 'review_required'),
			createStep('step-invite', 'Invite collaborators', 'Ask admins to bring reviewers into the workspace before publishing their first workflow.', 'Invite team', 'invite-button', 'bottom', 'ready'),
			createStep('step-publish', 'Publish the first workflow', 'Close the loop by guiding activated teams to ship their first automated workflow.', 'Publish', 'publish-workflow', 'top', 'ready'),
		],
		lastValidation: null,
		release: null,
		createdAt: now,
		updatedAt: now,
		activity: [
			{ id: 'activity-3', label: 'Connect source placement changed', detail: 'Maya Chen', createdAt: now },
			{ id: 'activity-2', label: 'Audience holdout updated to 10%', detail: 'Maya Chen', createdAt: now },
			{ id: 'activity-1', label: 'Tour draft created', detail: 'Maya Chen', createdAt: now },
		],
	};
}

/**
 * Builds one initial tour step from a registered product target.
 *
 * @param {string} id Step identifier.
 * @param {string} title Step title.
 * @param {string} body Step body.
 * @param {string} cta Call-to-action label.
 * @param {string} targetId Registered target identifier.
 * @param {string} placement Preferred placement.
 * @param {string} status Review status.
 * @returns {Record<string, unknown>} Tour step.
 */
function createStep(id, title, body, cta, targetId, placement, status) {
	const target = targetOptions.find((option) => option.value === targetId);
	return {
		id,
		title,
		body,
		cta,
		targetId,
		targetLabel: target.label,
		targetSelector: target.selector,
		route: target.route,
		placement,
		status,
		updatedAt: new Date().toISOString(),
	};
}

/**
 * Serializes the tour with calculated reach, readiness, and target health.
 *
 * @returns {Record<string, unknown>} Public tour payload.
 */
function serializeTour() {
	const validationResult = buildValidation();
	const segment = segmentOptions.find((option) => option.value === tour.audience.segment);
	const behavior = behaviorOptions.find((option) => option.value === tour.audience.behavior);
	const eligible = Math.round((segment?.count || 0) * (behavior?.ratio || 0));
	const reach = Math.round(eligible * (1 - tour.audience.holdoutPercent / 100));
	return cloneValue({
		...tour,
		readyStepCount: tour.steps.filter((step) => step.status === 'ready').length,
		reach: {
			segmentCount: segment?.count || 0,
			eligible,
			holdout: eligible - reach,
			reach,
		},
		readiness: validationResult,
	});
}

/**
 * Builds publication checks from the authoritative tour record.
 *
 * @returns {{ ready: boolean, passedCount: number, checks: Array<Record<string, unknown>> }} Validation summary.
 */
function buildValidation() {
	const checks = [
		buildCheck('content', 'Step copy is complete', tour.steps.every((step) => step.title.length >= 3 && step.body.length >= 12 && step.cta.length >= 2), `${tour.steps.filter((step) => step.title.length >= 3 && step.body.length >= 12 && step.cta.length >= 2).length} of ${tour.steps.length} steps have complete copy.`),
		buildCheck('targets', 'Targets resolve in the registry', tour.steps.every((step) => targetOptions.some((target) => target.value === step.targetId)), `${tour.steps.filter((step) => targetOptions.some((target) => target.value === step.targetId)).length} selectors map to registered app surfaces.`),
		buildCheck('review', 'Every step is reviewed', tour.steps.every((step) => step.status === 'ready'), `${tour.steps.filter((step) => step.status === 'ready').length} of ${tour.steps.length} steps are ready.`),
		buildCheck('audience', 'Audience and holdout are safe', Boolean(tour.audience.segment && tour.audience.behavior && tour.audience.holdoutPercent >= 10), `${tour.audience.holdoutPercent}% holdout protects an experiment baseline.`),
		buildCheck('schedule', 'Launch schedule is valid', isFutureDate(tour.schedule.launchDate) && timezoneOptions.some((option) => option.value === tour.schedule.timezone), `${tour.schedule.launchDate} in ${tour.schedule.timezone}.`),
	];
	const passedCount = checks.filter((check) => check.status === 'passed').length;
	return { ready: passedCount === checks.length, passedCount, checks };
}

/**
 * Builds one normalized validation check.
 *
 * @param {string} id Check identifier.
 * @param {string} label Check label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Supporting detail.
 * @returns {Record<string, unknown>} Validation check.
 */
function buildCheck(id, label, passed, detail) {
	return { id, label, status: passed ? 'passed' : 'blocked', detail };
}

/**
 * Validates the requested tour identifier.
 *
 * @param {string} tourId Requested identifier.
 * @returns {Record<string, unknown>|null} Not-found response when mismatched.
 */
function validateTourId(tourId) {
	return String(tourId || '') === tour.id ? null : notFound('Product tour');
}

/**
 * Validates an optimistic revision against current server state.
 *
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response when stale.
 */
function validateRevision(revision) {
	if (Number(revision) === tour.revision) return null;
	return conflict('This tour changed in another tab. Reload the latest draft before saving.', {
		code: 'revision_conflict',
		tour: serializeTour(),
	});
}

/**
 * Commits a revision and records authoring activity.
 *
 * @param {string} label Activity label.
 * @returns {void}
 */
function commitTour(label) {
	tour.revision += 1;
	tour.updatedAt = new Date().toISOString();
	tour.activity.unshift({ id: `activity-${tour.revision}`, label, detail: 'Maya Chen', createdAt: tour.updatedAt });
	tour.activity = tour.activity.slice(0, 10);
}

/**
 * Returns an ISO date a fixed number of days in the future.
 *
 * @param {number} days Future-day offset.
 * @returns {string} ISO date.
 */
function futureDate(days) {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

/**
 * Normalizes a submitted ISO date.
 *
 * @param {unknown} value Submitted value.
 * @returns {string} ISO date or empty string.
 */
function normalizeDate(value) {
	const date = String(value || '').trim();
	return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

/**
 * Checks whether a date is today or later.
 *
 * @param {string} value ISO date.
 * @returns {boolean} Whether the date is acceptable.
 */
function isFutureDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const candidate = new Date(`${value}T00:00:00`);
	return Number.isFinite(candidate.getTime()) && candidate >= today;
}

/**
 * Normalizes short author-entered text.
 *
 * @param {unknown} value Submitted value.
 * @param {number} maxLength Maximum retained length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Creates a successful API response.
 *
 * @param {string} message Confirmation message.
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
 * @param {Record<string, unknown>} details Additional validation context.
 * @returns {Record<string, unknown>} Validation error response.
 */
function validation(message, fields = [], details = {}) {
	return { status: 422, error: { code: 'validation_failed', message, fields, ...details } };
}

/**
 * Creates a structured conflict response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Record<string, unknown>} details Recovery details.
 * @returns {Record<string, unknown>} Conflict error response.
 */
function conflict(message, details = {}) {
	return { status: 409, error: { code: details.code || 'conflict', message, ...details } };
}

/**
 * Creates a missing-resource response.
 *
 * @param {string} label Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(label) {
	return { status: 404, error: { code: 'not_found', message: `${label} was not found.` } };
}

/**
 * Clones process-local state into a JSON-safe value.
 *
 * @param {unknown} value Value to clone.
 * @returns {any} JSON-safe copy.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
