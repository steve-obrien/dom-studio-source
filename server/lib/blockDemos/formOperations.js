import { createHash } from 'node:crypto';

const audienceOptions = Object.freeze([
	{ value: 'product_teams', label: 'Product teams', description: 'Qualify teams evaluating a component system.' },
	{ value: 'agencies', label: 'Design agencies', description: 'Collect project scope from client-service teams.' },
	{ value: 'enterprise', label: 'Enterprise buyers', description: 'Capture governance, procurement, and rollout needs.' },
]);

const ownerOptions = Object.freeze([
	{ value: 'steve', label: 'Steve O’Brien', description: 'Product and technical discovery.' },
	{ value: 'maya', label: 'Maya Chen', description: 'Enterprise and partnership requests.' },
	{ value: 'jo', label: 'Jo Bell', description: 'Agency and implementation support.' },
]);

const spamPolicyOptions = Object.freeze([
	{ value: 'standard', label: 'Balanced protection', description: 'Reject disposable email domains and repeated payloads.' },
	{ value: 'strict', label: 'Strict protection', description: 'Also require a verified business email domain.' },
]);

const companySizeOptions = Object.freeze([
	{ value: 'solo', label: 'Just me', description: 'Independent creator or consultant.' },
	{ value: '2_20', label: '2–20 people', description: 'Small product or agency team.' },
	{ value: '21_100', label: '21–100 people', description: 'Growing product organization.' },
	{ value: '101_plus', label: '101+ people', description: 'Large or multi-team organization.' },
]);

const useCaseOptions = Object.freeze([
	{ value: 'design_system', label: 'Design system', description: 'Shared components, tokens, and documentation.' },
	{ value: 'saas_product', label: 'SaaS product', description: 'Customer-facing product interface.' },
	{ value: 'internal_tools', label: 'Internal tools', description: 'Operations and administration workflows.' },
	{ value: 'mobile_app', label: 'Mobile app', description: 'Responsive or Capacitor application.' },
	{ value: 'ai_product', label: 'AI product', description: 'Agent, copilot, or model-backed workflow.' },
]);

const contactPreferenceOptions = Object.freeze([
	{ value: 'email', label: 'Email me a useful next step' },
	{ value: 'call', label: 'Invite me to a 20-minute call' },
	{ value: 'none', label: 'No follow-up yet' },
]);

const responseStatusOptions = Object.freeze([
	{ value: 'new', label: 'New' },
	{ value: 'reviewed', label: 'Reviewed' },
	{ value: 'qualified', label: 'Qualified' },
	{ value: 'archived', label: 'Archived' },
]);

const responseFilterOptions = Object.freeze([
	{ value: 'all', label: 'All responses' },
	...responseStatusOptions,
]);

const assigneeOptions = Object.freeze([
	{ value: 'unassigned', label: 'Unassigned', description: 'Leave in the shared intake queue.' },
	...ownerOptions,
]);

const formFields = Object.freeze([
	{ id: 'name', label: 'Name', type: 'Text input', required: true, detail: 'Person completing the form.' },
	{ id: 'email', label: 'Work email', type: 'Email input', required: true, detail: 'Used for follow-up and duplicate detection.' },
	{ id: 'companySize', label: 'Team size', type: 'Rich select', required: true, detail: 'Routes requests to an appropriate owner.' },
	{ id: 'useCases', label: 'What are you building?', type: 'Tag combobox', required: true, detail: 'Allows several structured use cases.' },
	{ id: 'contactPreference', label: 'Preferred next step', type: 'Radio group', required: true, detail: 'Makes follow-up consent explicit.' },
	{ id: 'details', label: 'Project context', type: 'Textarea', required: true, detail: 'Collects timeline, constraints, and desired outcome.' },
	{ id: 'consent', label: 'Data consent', type: 'Checkbox', required: true, detail: 'Records acceptance of the privacy notice.' },
]);

let form = createInitialForm();
let responses = createInitialResponses();
let publicationSequence = 92;
let responseSequence = 703;

/**
 * Returns the editable form, response inbox, and reusable option records.
 *
 * @returns {Record<string, unknown>} Complete form-operations bootstrap payload.
 */
export function getFormOperationsBootstrap() {
	return cloneValue({
		workspace: { name: 'DOM Studio', area: 'Growth forms' },
		options: {
			audiences: audienceOptions,
			owners: ownerOptions,
			spamPolicies: spamPolicyOptions,
			companySizes: companySizeOptions,
			useCases: useCaseOptions,
			contactPreferences: contactPreferenceOptions,
			responseStatuses: responseStatusOptions,
			responseFilters: responseFilterOptions,
			assignees: assigneeOptions,
		},
		fields: formFields,
		form: serializeForm(),
		responses: serializeResponses(),
	});
}

/**
 * Returns one current form with its server-owned readiness state.
 *
 * @param {string} formId Form identifier.
 * @returns {Record<string, unknown>} Form payload or structured API error.
 */
export function getFormOperationsForm(formId) {
	const formError = validateFormId(formId);
	if (formError) return formError;
	return cloneValue({ form: serializeForm(), responses: serializeResponses() });
}

/**
 * Saves editable form settings with optimistic revision protection.
 *
 * @param {string} formId Form identifier.
 * @param {Record<string, unknown>} input Form settings and current revision.
 * @returns {Record<string, unknown>} Updated form or structured API error.
 */
export function updateFormOperationsForm(formId, input = {}) {
	const formError = validateFormId(formId);
	if (formError) return formError;
	const revisionError = validateFormRevision(input.revision);
	if (revisionError) return revisionError;
	const next = normalizeFormInput(input);
	const fields = validateEditableForm(next);
	if (fields.length) return validation('Check the form settings and try again.', fields);
	form = {
		...form,
		...next,
		status: 'draft',
		lastValidation: null,
		publication: null,
	};
	commitForm('Form settings saved', 'Draft settings changed by Steve O’Brien.');
	return success('Form settings saved and publication checks refreshed.', { form: serializeForm() });
}

/**
 * Runs authoritative readiness checks for the current form revision.
 *
 * @param {string} formId Form identifier.
 * @param {Record<string, unknown>} input Current form revision.
 * @returns {Record<string, unknown>} Validation proof and updated form.
 */
export function validateFormOperationsForm(formId, input = {}) {
	const formError = validateFormId(formId);
	if (formError) return formError;
	const revisionError = validateFormRevision(input.revision);
	if (revisionError) return revisionError;
	const readiness = buildReadiness();
	form.lastValidation = {
		id: `form-check-${form.revision + 1}`,
		formRevision: form.revision + 1,
		status: readiness.ready ? 'passed' : 'failed',
		checkedAt: new Date().toISOString(),
		checks: readiness.checks,
	};
	commitForm(readiness.ready ? 'Publication checks passed' : 'Publication checks need attention', `${readiness.passedCount} of ${readiness.checks.length} checks passed.`);
	return success(readiness.ready ? 'Publication checks passed for this revision.' : 'Publication checks found blockers to resolve.', {
		form: serializeForm(),
		validation: cloneValue(form.lastValidation),
	});
}

/**
 * Publishes a validated form and returns an immutable publication receipt.
 *
 * @param {string} formId Form identifier.
 * @param {Record<string, unknown>} input Current revision and operator acknowledgement.
 * @returns {Record<string, unknown>} Published form or structured API error.
 */
export function publishFormOperationsForm(formId, input = {}) {
	const formError = validateFormId(formId);
	if (formError) return formError;
	const revisionError = validateFormRevision(input.revision);
	if (revisionError) return revisionError;
	const readiness = buildReadiness();
	if (!readiness.ready) {
		return validation('Resolve publication blockers before publishing.', readiness.checks
			.filter((check) => check.status !== 'passed')
			.map((check) => ({ field: check.id, message: check.detail })));
	}
	if (form.lastValidation?.status !== 'passed' || form.lastValidation.formRevision !== form.revision) {
		return validation('Run publication checks for the current revision first.', [{ field: 'validation', message: 'Passing proof is missing for this exact revision.' }]);
	}
	if (input.acknowledged !== true) {
		return validation('Confirm the public form behavior before publishing.', [{ field: 'acknowledged', message: 'Publication requires explicit acknowledgement.' }]);
	}
	const publishedAt = new Date().toISOString();
	const publicationId = `form-publication-${++publicationSequence}`;
	const formRevision = form.revision + 1;
	form.status = 'published';
	form.publication = {
		id: publicationId,
		version: `FORM-${publicationSequence}`,
		formRevision,
		publishedAt,
		publicUrl: `/f/${form.slug}`,
		proof: createHash('sha256').update(JSON.stringify({ publicationId, formId: form.id, formRevision, publishedAt, slug: form.slug })).digest('hex'),
	};
	commitForm('Form published', `${form.publication.version} is accepting responses.`);
	return success('Form published with an immutable version and proof.', { form: serializeForm(), publication: cloneValue(form.publication) });
}

/**
 * Creates a public response after form availability, spam, and field checks.
 *
 * @param {string} formId Form identifier.
 * @param {Record<string, unknown>} input Public response values.
 * @returns {Record<string, unknown>} Created response and confirmation receipt.
 */
export function createFormOperationsSubmission(formId, input = {}) {
	const formError = validateFormId(formId);
	if (formError) return formError;
	if (form.status !== 'published' || !form.publication) {
		return conflict('This form is not accepting responses yet.', { code: 'form_not_published', form: serializeForm() });
	}
	const values = normalizeSubmission(input.values || input);
	const fields = validateSubmission(values);
	if (fields.length) return validation('Complete the required form fields.', fields);
	if (values.email.endsWith('@mailinator.com') || values.email.endsWith('@example.test')) {
		return validation('Use a deliverable work email address.', [{ field: 'email', message: 'Disposable and test email domains are blocked by this form.' }], 'spam_detected');
	}
	const submittedAt = new Date().toISOString();
	const response = {
		id: `response-${++responseSequence}`,
		reference: `RSP-${responseSequence}`,
		revision: 1,
		status: 'new',
		assignee: 'unassigned',
		note: '',
		values,
		submittedAt,
		updatedAt: submittedAt,
	};
	responses.unshift(response);
	const confirmation = {
		reference: response.reference,
		receivedAt: submittedAt,
		message: form.confirmationMessage,
		proof: createHash('sha256').update(JSON.stringify({ responseId: response.id, publicationId: form.publication.id, email: values.email, submittedAt })).digest('hex'),
	};
	return success('Response received and added to the triage inbox.', { response: cloneValue(response), confirmation });
}

/**
 * Saves triage status, assignee, and internal note for one response.
 *
 * @param {string} formId Form identifier.
 * @param {string} responseId Response identifier.
 * @param {Record<string, unknown>} input Response update and optimistic revision.
 * @returns {Record<string, unknown>} Updated response inbox or structured API error.
 */
export function updateFormOperationsResponse(formId, responseId, input = {}) {
	const formError = validateFormId(formId);
	if (formError) return formError;
	const index = responses.findIndex((response) => response.id === String(responseId || ''));
	if (index < 0) return notFound('Response');
	const current = responses[index];
	if (Number(input.revision) !== current.revision) {
		return conflict('This response changed in another tab. Reload its current triage state.', { code: 'response_revision_conflict', response: cloneValue(current), responses: serializeResponses() });
	}
	const status = String(input.status || '');
	const assignee = String(input.assignee || '');
	const note = normalizeText(input.note, 240);
	const fields = [];
	if (!responseStatusOptions.some((option) => option.value === status)) fields.push({ field: 'status', message: 'Choose an available response status.' });
	if (!assigneeOptions.some((option) => option.value === assignee)) fields.push({ field: 'assignee', message: 'Choose an available assignee.' });
	if (status === 'archived' && note.length < 8) fields.push({ field: 'note', message: 'Add a short reason before archiving a response.' });
	if (fields.length) return validation('Check the response triage fields.', fields);
	responses[index] = {
		...current,
		status,
		assignee,
		note,
		revision: current.revision + 1,
		updatedAt: new Date().toISOString(),
	};
	return success('Response triage saved.', { response: cloneValue(responses[index]), responses: serializeResponses(), form: serializeForm() });
}

/**
 * Resets the process-local form workspace to its initial draft and responses.
 *
 * @param {string} formId Form identifier.
 * @returns {Record<string, unknown>} Fresh workspace or structured API error.
 */
export function resetFormOperations(formId) {
	const formError = validateFormId(formId);
	if (formError) return formError;
	form = createInitialForm();
	responses = createInitialResponses();
	publicationSequence = 92;
	responseSequence = 703;
	return success('Form workspace reset to the initial draft.', { form: serializeForm(), responses: serializeResponses() });
}

/**
 * Creates the initial editable form definition.
 *
 * @returns {Record<string, unknown>} Initial form state.
 */
function createInitialForm() {
	const now = new Date().toISOString();
	return {
		id: 'form_discovery_intake',
		revision: 12,
		status: 'draft',
		title: 'Tell us what you’re building',
		description: 'Share your product context and we’ll recommend the most useful DOM Studio starting point.',
		audience: 'product_teams',
		owner: 'steve',
		closeDate: '2026-09-30',
		confirmationMessage: 'Thanks — your context is in the right hands. We’ll reply with a practical next step.',
		allowDrafts: true,
		spamPolicy: 'standard',
		slug: 'product-discovery',
		lastValidation: null,
		publication: null,
		createdAt: now,
		updatedAt: now,
		activity: [
			{ id: 'form-activity-3', label: 'Required fields reviewed', detail: 'Email, use case, context, and consent are required.', createdAt: now },
			{ id: 'form-activity-2', label: 'Follow-up routing added', detail: 'Responses route by audience and contact preference.', createdAt: now },
			{ id: 'form-activity-1', label: 'Draft created', detail: 'Started from Product discovery.', createdAt: now },
		],
	};
}

/**
 * Creates realistic saved responses for the triage workspace.
 *
 * @returns {Array<Record<string, unknown>>} Initial response records.
 */
function createInitialResponses() {
	const now = Date.now();
	return [
		createSeedResponse('response-701', 'RSP-701', 'Priya Shah', 'priya@northstar.dev', '21_100', ['design_system', 'saas_product'], 'call', 'We are replacing three product-specific component sets before a Q4 platform consolidation.', 'new', 'unassigned', '', new Date(now - 18 * 60 * 1000).toISOString()),
		createSeedResponse('response-700', 'RSP-700', 'Liam Carter', 'liam@harbor.agency', '2_20', ['design_system', 'internal_tools'], 'email', 'Our agency needs an inspectable starting point for client admin tools without adding another black-box dependency.', 'qualified', 'jo', 'Send the agency source-access outline and implementation examples.', new Date(now - 3 * 60 * 60 * 1000).toISOString()),
		createSeedResponse('response-699', 'RSP-699', 'Anika Rao', 'anika@atlas.ai', '101_plus', ['ai_product', 'mobile_app'], 'call', 'We need shared interaction contracts across an AI operations console and a Capacitor field application.', 'reviewed', 'maya', 'Security and mobile architecture review requested.', new Date(now - 26 * 60 * 60 * 1000).toISOString()),
	];
}

/**
 * Creates one normalized seeded response.
 *
 * @param {string} id Response identifier.
 * @param {string} reference Human-readable response reference.
 * @param {string} name Respondent name.
 * @param {string} email Respondent email.
 * @param {string} companySize Company-size value.
 * @param {Array<string>} useCases Selected use cases.
 * @param {string} contactPreference Follow-up preference.
 * @param {string} details Project context.
 * @param {string} status Triage status.
 * @param {string} assignee Assigned teammate.
 * @param {string} note Internal note.
 * @param {string} submittedAt Submission timestamp.
 * @returns {Record<string, unknown>} Seeded response.
 */
function createSeedResponse(id, reference, name, email, companySize, useCases, contactPreference, details, status, assignee, note, submittedAt) {
	return {
		id,
		reference,
		revision: 1,
		status,
		assignee,
		note,
		values: { name, email, companySize, useCases, contactPreference, details, consent: true },
		submittedAt,
		updatedAt: submittedAt,
	};
}

/**
 * Normalizes submitted editable form settings.
 *
 * @param {Record<string, unknown>} input Raw form settings.
 * @returns {Record<string, unknown>} Normalized settings.
 */
function normalizeFormInput(input) {
	return {
		title: normalizeText(input.title, 72),
		description: normalizeText(input.description, 180),
		audience: String(input.audience || ''),
		owner: String(input.owner || ''),
		closeDate: String(input.closeDate || ''),
		confirmationMessage: normalizeText(input.confirmationMessage, 180),
		allowDrafts: input.allowDrafts === true,
		spamPolicy: String(input.spamPolicy || ''),
	};
}

/**
 * Validates editable form settings before committing them.
 *
 * @param {Record<string, unknown>} input Normalized form settings.
 * @returns {Array<Record<string, string>>} Structured field errors.
 */
function validateEditableForm(input) {
	const fields = [];
	if (String(input.title).length < 5) fields.push({ field: 'title', message: 'Use at least five characters for the public title.' });
	if (String(input.description).length < 20) fields.push({ field: 'description', message: 'Explain what respondents should share in at least 20 characters.' });
	if (!audienceOptions.some((option) => option.value === input.audience)) fields.push({ field: 'audience', message: 'Choose an available audience.' });
	if (!ownerOptions.some((option) => option.value === input.owner)) fields.push({ field: 'owner', message: 'Choose an available owner.' });
	if (!/^\d{4}-\d{2}-\d{2}$/.test(String(input.closeDate)) || input.closeDate < '2026-08-02') fields.push({ field: 'closeDate', message: 'Choose a closing date after 1 August 2026.' });
	if (String(input.confirmationMessage).length < 16) fields.push({ field: 'confirmationMessage', message: 'Write a useful confirmation of at least 16 characters.' });
	if (!spamPolicyOptions.some((option) => option.value === input.spamPolicy)) fields.push({ field: 'spamPolicy', message: 'Choose an available spam policy.' });
	return fields;
}

/**
 * Normalizes public response values.
 *
 * @param {Record<string, unknown>} input Raw public response.
 * @returns {Record<string, unknown>} Normalized response values.
 */
function normalizeSubmission(input) {
	return {
		name: normalizeText(input.name, 80),
		email: normalizeText(input.email, 120).toLowerCase(),
		companySize: String(input.companySize || ''),
		useCases: Array.isArray(input.useCases) ? [...new Set(input.useCases.map(String))] : [],
		contactPreference: String(input.contactPreference || ''),
		details: normalizeText(input.details, 800),
		consent: input.consent === true,
	};
}

/**
 * Validates a public response against the published form contract.
 *
 * @param {Record<string, unknown>} values Normalized response values.
 * @returns {Array<Record<string, string>>} Structured field errors.
 */
function validateSubmission(values) {
	const fields = [];
	if (values.name.length < 2) fields.push({ field: 'name', message: 'Enter your name.' });
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) fields.push({ field: 'email', message: 'Enter a valid work email address.' });
	if (!companySizeOptions.some((option) => option.value === values.companySize)) fields.push({ field: 'companySize', message: 'Choose your team size.' });
	if (!values.useCases.length || values.useCases.some((value) => !useCaseOptions.some((option) => option.value === value))) fields.push({ field: 'useCases', message: 'Choose at least one supported use case.' });
	if (!contactPreferenceOptions.some((option) => option.value === values.contactPreference)) fields.push({ field: 'contactPreference', message: 'Choose a preferred next step.' });
	if (values.details.length < 20) fields.push({ field: 'details', message: 'Share at least 20 characters of project context.' });
	if (!values.consent) fields.push({ field: 'consent', message: 'Accept the privacy notice before submitting.' });
	return fields;
}

/**
 * Serializes form state with derived readiness and response counts.
 *
 * @returns {Record<string, unknown>} Public form payload.
 */
function serializeForm() {
	const readiness = buildReadiness();
	return cloneValue({
		...form,
		readiness,
		fieldCount: formFields.length,
		responseCount: responses.length,
		newResponseCount: responses.filter((response) => response.status === 'new').length,
	});
}

/**
 * Serializes responses in newest-first order.
 *
 * @returns {Array<Record<string, unknown>>} Public response records.
 */
function serializeResponses() {
	return cloneValue(responses);
}

/**
 * Builds server-owned publication readiness checks.
 *
 * @returns {{ ready: boolean, passedCount: number, checks: Array<Record<string, unknown>> }} Readiness summary.
 */
function buildReadiness() {
	const editableErrors = validateEditableForm(normalizeFormInput(form));
	const checks = [
		buildCheck('identity', 'Public title and description', !editableErrors.some((field) => ['title', 'description'].includes(field.field)), 'Respondents can understand what the form collects.'),
		buildCheck('routing', 'Audience and owner routing', !editableErrors.some((field) => ['audience', 'owner'].includes(field.field)), 'Every response has an accountable owner and segment.'),
		buildCheck('availability', 'Closing date is valid', !editableErrors.some((field) => field.field === 'closeDate'), `Responses close on ${form.closeDate}.`),
		buildCheck('confirmation', 'Confirmation message is useful', !editableErrors.some((field) => field.field === 'confirmationMessage'), 'Successful submissions receive a clear next step.'),
		buildCheck('fields', 'Required response schema', formFields.every((field) => field.required), `${formFields.length} required fields have labels and expected values.`),
		buildCheck('spam', 'Spam protection configured', !editableErrors.some((field) => field.field === 'spamPolicy'), `${form.spamPolicy === 'strict' ? 'Strict' : 'Balanced'} protection is active.`),
	];
	const passedCount = checks.filter((check) => check.status === 'passed').length;
	return { ready: passedCount === checks.length, passedCount, checks };
}

/**
 * Creates one normalized readiness check.
 *
 * @param {string} id Check identifier.
 * @param {string} label Check label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Supporting detail.
 * @returns {Record<string, unknown>} Readiness check.
 */
function buildCheck(id, label, passed, detail) {
	return { id, label, status: passed ? 'passed' : 'blocked', detail };
}

/**
 * Validates a requested form identifier.
 *
 * @param {string} formId Requested identifier.
 * @returns {Record<string, unknown>|null} Missing-form response when mismatched.
 */
function validateFormId(formId) {
	return String(formId || '') === form.id ? null : notFound('Form');
}

/**
 * Validates optimistic form revision state.
 *
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response when stale.
 */
function validateFormRevision(revision) {
	if (Number(revision) === form.revision) return null;
	return conflict('This form changed in another tab. Reload the latest draft before saving.', { code: 'form_revision_conflict', form: serializeForm() });
}

/**
 * Commits a form mutation and adds activity evidence.
 *
 * @param {string} label Activity label.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commitForm(label, detail) {
	form.revision += 1;
	form.updatedAt = new Date().toISOString();
	form.activity.unshift({ id: `form-activity-${form.revision}`, label, detail, createdAt: form.updatedAt });
	form.activity = form.activity.slice(0, 10);
}

/**
 * Normalizes short text authored by an operator or respondent.
 *
 * @param {unknown} value Submitted value.
 * @param {number} maxLength Maximum retained length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Creates a successful API result.
 *
 * @param {string} message Confirmation message.
 * @param {Record<string, unknown>} data Response payload.
 * @returns {Record<string, unknown>} Successful response.
 */
function success(message, data = {}) {
	return { ...data, message };
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Array<Record<string, string>>} fields Field errors.
 * @param {string} code Stable error code.
 * @returns {Record<string, unknown>} Validation error response.
 */
function validation(message, fields = [], code = 'validation_failed') {
	return { status: 422, error: { code, message, fields } };
}

/**
 * Creates a structured optimistic-conflict response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Record<string, unknown>} details Recovery details.
 * @returns {Record<string, unknown>} Conflict response.
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
