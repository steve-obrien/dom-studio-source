import { createHash } from 'node:crypto';

const sourceColumns = Object.freeze([
	{ value: 'company', label: 'Company', sample: 'Northstar Labs', detectedType: 'Text', confidence: 0.99 },
	{ value: 'primary_email', label: 'Primary email', sample: 'ops@northstar.example', detectedType: 'Email', confidence: 0.98 },
	{ value: 'lifecycle_stage', label: 'Lifecycle stage', sample: 'Customer', detectedType: 'Category', confidence: 0.94 },
	{ value: 'plan', label: 'Plan', sample: 'Scale', detectedType: 'Category', confidence: 0.96 },
	{ value: 'seats', label: 'Seats', sample: '42', detectedType: 'Number', confidence: 0.99 },
	{ value: 'renewal_date', label: 'Renewal date', sample: '14/08/2026', detectedType: 'Date', confidence: 0.87 },
	{ value: 'owner', label: 'Owner', sample: 'Maya Chen', detectedType: 'Text', confidence: 0.91 },
	{ value: 'skip', label: 'Do not import', sample: 'Exclude this target field', detectedType: 'Skip', confidence: 1 },
]);

const targetFields = Object.freeze([
	{ key: 'companyName', label: 'Company name', description: 'Customer account display name.', required: true, type: 'Text' },
	{ key: 'email', label: 'Primary email', description: 'Unique contact and merge identifier.', required: true, type: 'Email' },
	{ key: 'stage', label: 'Lifecycle stage', description: 'Normalized customer lifecycle value.', required: false, type: 'Category' },
	{ key: 'plan', label: 'Plan', description: 'Current commercial plan.', required: false, type: 'Category' },
	{ key: 'seats', label: 'Seats', description: 'Purchased or active seat count.', required: false, type: 'Number' },
	{ key: 'renewalDate', label: 'Renewal date', description: 'Next contract renewal in ISO format.', required: false, type: 'Date' },
	{ key: 'owner', label: 'Account owner', description: 'Internal teammate responsible for the account.', required: false, type: 'Text' },
]);

const presetOptions = Object.freeze([
	{ value: 'hubspot_customer', label: 'HubSpot customer export', description: 'Company, primary email, lifecycle, plan, seats, renewal date, and owner.' },
	{ value: 'minimal_accounts', label: 'Minimal account import', description: 'Map only the required company and email fields.' },
	{ value: 'blank', label: 'Start from blank', description: 'Clear every mapping and choose columns manually.' },
]);

const importModeOptions = Object.freeze([
	{ value: 'valid_only', label: 'Import valid rows', description: 'Queue 1,268 valid rows and keep 16 blocked rows in an error report.' },
	{ value: 'strict', label: 'Require every row', description: 'Do not start until all blocked rows are corrected.' },
]);

const duplicatePolicyOptions = Object.freeze([
	{ value: 'merge_newer', label: 'Merge newer values', description: 'Update matching customers only when the CSV value is newer.' },
	{ value: 'skip_existing', label: 'Skip existing customers', description: 'Create new customers and leave every existing record unchanged.' },
	{ value: 'overwrite', label: 'Overwrite mapped fields', description: 'Replace mapped values for every matching customer.' },
]);

const previewRows = Object.freeze([
	{ id: 'row-1', company: 'Northstar Labs', email: 'ops@northstar.example', stage: 'Customer', plan: 'Scale', seats: 42, renewalDate: '2026-08-14', status: 'ready', note: 'New customer' },
	{ id: 'row-2', company: 'Harbor Finance', email: 'billing@harbor.example', stage: 'Lead', plan: 'Business', seats: 18, renewalDate: '2026-09-01', status: 'warning', note: 'Lifecycle alias: Prospect → Lead' },
	{ id: 'row-3', company: 'Atlas Robotics', email: 'admin@atlas.example', stage: 'Customer', plan: 'Enterprise', seats: 116, renewalDate: '2026-10-30', status: 'ready', note: 'Will update existing customer' },
	{ id: 'row-4', company: 'Bluebird Retail', email: '', stage: 'Trial', plan: 'Starter', seats: 8, renewalDate: '2026-11-12', status: 'blocked', note: 'Primary email is required' },
	{ id: 'row-5', company: 'Cedar Health', email: 'team@cedar.example', stage: 'Customer', plan: 'Business', seats: 25, renewalDate: '2026-08-22', status: 'warning', note: 'Date normalized from DD/MM/YYYY' },
]);

let session = createInitialSession();
let reportSequence = 90;
let jobSequence = 410;

/**
 * Returns the import workspace, reusable choices, and current server session.
 *
 * @returns {Record<string, unknown>} Complete data-import bootstrap payload.
 */
export function getDataImportBootstrap() {
	return cloneValue({
		workspace: { name: 'Northstar operations', viewer: 'Maya Chen' },
		options: {
			sourceColumns,
			targetFields,
			presets: presetOptions,
			importModes: importModeOptions,
			duplicatePolicies: duplicatePolicyOptions,
		},
		session: serializeSession(),
	});
}

/**
 * Returns one resumable data-import session.
 *
 * @param {string} sessionId Import-session identifier.
 * @returns {Record<string, unknown>} Import session or structured API error.
 */
export function getDataImportSession(sessionId) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	return cloneValue({ session: serializeSession() });
}

/**
 * Saves a complete target-to-source mapping with optimistic revision checks.
 *
 * @param {string} sessionId Import-session identifier.
 * @param {Record<string, unknown>} input Mapping payload and current revision.
 * @returns {Record<string, unknown>} Updated import session or API error.
 */
export function updateDataImportMapping(sessionId, input = {}) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const nextMapping = input.mapping && typeof input.mapping === 'object' ? input.mapping : {};
	const allowedColumns = new Set(sourceColumns.map((column) => column.value));
	const fields = [];
	const normalized = {};
	for (const target of targetFields) {
		const value = String(nextMapping[target.key] || 'skip');
		if (!allowedColumns.has(value)) fields.push({ field: target.key, message: 'Choose a column from the parsed file.' });
		normalized[target.key] = allowedColumns.has(value) ? value : 'skip';
	}
	const usedColumns = Object.entries(normalized).filter(([, value]) => value !== 'skip');
	const duplicates = usedColumns.filter(([, value], index) => usedColumns.findIndex(([, candidate]) => candidate === value) !== index);
	for (const [field] of duplicates) fields.push({ field, message: 'Each source column can map to only one target field.' });
	if (fields.length) return validation('Check the field mapping and try again.', fields);
	session.mapping = normalized;
	session.preset = String(input.preset || session.preset || 'blank');
	session.lastValidation = null;
	session.job = null;
	commitSession('Field mapping saved');
	return success('Field mapping saved and server checks refreshed.', { session: serializeSession() });
}

/**
 * Saves import behavior that affects readiness and record mutation.
 *
 * @param {string} sessionId Import-session identifier.
 * @param {Record<string, unknown>} input Settings and current revision.
 * @returns {Record<string, unknown>} Updated import session or API error.
 */
export function updateDataImportSettings(sessionId, input = {}) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const importMode = String(input.importMode || '');
	const duplicatePolicy = String(input.duplicatePolicy || '');
	const batchName = normalizeText(input.batchName, 72);
	const fields = [];
	if (!importModeOptions.some((option) => option.value === importMode)) fields.push({ field: 'importMode', message: 'Choose an available import mode.' });
	if (!duplicatePolicyOptions.some((option) => option.value === duplicatePolicy)) fields.push({ field: 'duplicatePolicy', message: 'Choose an available duplicate policy.' });
	if (batchName.length < 3) fields.push({ field: 'batchName', message: 'Use at least three characters for the batch name.' });
	if (fields.length) return validation('Check the import settings and try again.', fields);
	session.settings = { importMode, duplicatePolicy, batchName };
	session.lastValidation = null;
	session.job = null;
	commitSession('Import behavior saved');
	return success('Import behavior saved.', { session: serializeSession() });
}

/**
 * Runs authoritative mapping, row, and policy validation for the current revision.
 *
 * @param {string} sessionId Import-session identifier.
 * @param {Record<string, unknown>} input Current revision.
 * @returns {Record<string, unknown>} Validation proof and updated session.
 */
export function validateDataImport(sessionId, input = {}) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const validationSummary = buildValidationSummary();
	session.lastValidation = {
		id: `validation-${session.revision + 1}`,
		sessionRevision: session.revision + 1,
		status: validationSummary.ready ? 'passed' : 'failed',
		checkedAt: new Date().toISOString(),
		checks: validationSummary.checks,
	};
	commitSession(validationSummary.ready ? 'Import validation passed' : 'Import validation needs attention');
	return success(validationSummary.ready ? 'Import checks passed for the current revision.' : 'Import checks found blockers to resolve.', {
		session: serializeSession(),
		validation: cloneValue(session.lastValidation),
	});
}

/**
 * Creates a background import job after exact-revision validation and consent.
 *
 * @param {string} sessionId Import-session identifier.
 * @param {Record<string, unknown>} input Current revision and acknowledgement.
 * @returns {Record<string, unknown>} Created job or structured API error.
 */
export function createDataImportJob(sessionId, input = {}) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const summary = buildValidationSummary();
	if (!summary.ready) return validation('Resolve the import blockers before creating a job.', summary.checks.filter((check) => check.status !== 'passed').map((check) => ({ field: check.id, message: check.detail })));
	if (session.lastValidation?.status !== 'passed' || session.lastValidation?.sessionRevision !== session.revision) {
		return validation('Run validation for the current revision before creating a job.', [{ field: 'validation', message: 'The current revision does not have passing validation proof.' }]);
	}
	if (input.acknowledged !== true) return validation('Confirm the import behavior before creating a job.', [{ field: 'acknowledged', message: 'Job creation requires explicit acknowledgement.' }]);
	if (session.job && session.job.status !== 'completed') return conflict('An import job is already active for this session.', { code: 'job_active', session: serializeSession() });
	const analysis = buildRowAnalysis();
	const now = new Date().toISOString();
	session.job = {
		id: `import-job-${++jobSequence}`,
		reference: `IMP-${jobSequence}`,
		status: 'queued',
		revision: 1,
		total: session.settings.importMode === 'valid_only' ? analysis.validRows : session.file.rowCount,
		processed: 0,
		created: 0,
		updated: 0,
		failed: 0,
		skipped: session.settings.importMode === 'valid_only' ? analysis.blockedRows : 0,
		createdAt: now,
		startedAt: null,
		completedAt: null,
		proof: null,
		activity: [{ id: 'job-event-1', label: 'Job queued', detail: 'Waiting for the first worker batch.', createdAt: now }],
	};
	commitSession('Import job created');
	return success('Import job queued with an immutable reference.', { session: serializeSession(), job: cloneValue(session.job) });
}

/**
 * Processes one deterministic worker batch and records job progress.
 *
 * @param {string} sessionId Import-session identifier.
 * @param {string} jobId Import-job identifier.
 * @param {Record<string, unknown>} input Current job revision.
 * @returns {Record<string, unknown>} Updated job and session or API error.
 */
export function processDataImportJob(sessionId, jobId, input = {}) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	if (!session.job || session.job.id !== String(jobId || '')) return notFound('Import job');
	if (Number(input.jobRevision) !== session.job.revision) {
		return conflict('This job advanced in another tab. Refresh its latest progress before retrying.', { code: 'job_revision_conflict', job: cloneValue(session.job), session: serializeSession() });
	}
	if (session.job.status === 'completed') return success('This import job is already complete.', { session: serializeSession(), job: cloneValue(session.job) });
	const remaining = session.job.total - session.job.processed;
	const batch = Math.min(320, remaining);
	const created = Math.round(batch * 0.72);
	const updated = batch - created;
	const now = new Date().toISOString();
	session.job.status = batch === remaining ? 'completed' : 'running';
	session.job.startedAt ||= now;
	session.job.processed += batch;
	session.job.created += created;
	session.job.updated += updated;
	session.job.revision += 1;
	session.job.activity.unshift({
		id: `job-event-${session.job.revision}`,
		label: batch === remaining ? 'Import completed' : `Batch ${session.job.revision - 1} processed`,
		detail: `${batch.toLocaleString()} rows committed by the demo worker.`,
		createdAt: now,
	});
	if (session.job.status === 'completed') {
		session.job.completedAt = now;
		session.job.proof = createHash('sha256').update(JSON.stringify({
			reference: session.job.reference,
			sessionId: session.id,
			total: session.job.total,
			created: session.job.created,
			updated: session.job.updated,
			skipped: session.job.skipped,
			completedAt: now,
		})).digest('hex');
	}
	return success(session.job.status === 'completed' ? 'Import completed and proof generated.' : 'The next worker batch completed.', {
		session: serializeSession(),
		job: cloneValue(session.job),
	});
}

/**
 * Generates a checksum-backed CSV error report for blocked source rows.
 *
 * @param {string} sessionId Import-session identifier.
 * @param {Record<string, unknown>} input Current revision.
 * @returns {Record<string, unknown>} Export receipt or API error.
 */
export function createDataImportErrorReport(sessionId, input = {}) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const analysis = buildRowAnalysis();
	const id = `error-report-${++reportSequence}`;
	const generatedAt = new Date().toISOString();
	const rows = [
		['row', 'company', 'issue'],
		['74', 'Bluebird Retail', 'Primary email is required'],
		['118', 'Monarch Systems', 'Primary email is required'],
		['221', 'Oak & Pine', 'Primary email is required'],
	];
	const content = rows.map((row) => row.map(csvCell).join(',')).join('\n');
	return success('Blocked-row report generated.', {
		report: {
			id,
			filename: `${session.settings.batchName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-errors.csv`,
			rowCount: analysis.blockedRows,
			generatedAt,
			checksum: createHash('sha256').update(content).digest('hex'),
			content,
		},
	});
}

/**
 * Resets the process-local demo to its initial parsed-file session.
 *
 * @param {string} sessionId Import-session identifier.
 * @returns {Record<string, unknown>} Fresh import session or API error.
 */
export function resetDataImportSession(sessionId) {
	const sessionError = validateSessionId(sessionId);
	if (sessionError) return sessionError;
	session = createInitialSession();
	return success('Import session reset to the parsed sample file.', { session: serializeSession() });
}

/**
 * Creates the initial parsed-file import session.
 *
 * @returns {Record<string, unknown>} Initial import session.
 */
function createInitialSession() {
	const now = new Date().toISOString();
	return {
		id: 'import_customer_august',
		revision: 7,
		status: 'mapping',
		preset: 'hubspot_customer',
		file: {
			id: 'file-customer-august',
			name: 'customer-import-august.csv',
			size: 284310,
			rowCount: 1284,
			columnCount: 7,
			parsedAt: now,
			checksum: '5f4dcc3b5aa765d61d8327deb882cf99',
		},
		mapping: createPresetMapping('hubspot_customer'),
		settings: {
			importMode: 'valid_only',
			duplicatePolicy: 'merge_newer',
			batchName: 'August customer migration',
		},
		lastValidation: null,
		job: null,
		createdAt: now,
		updatedAt: now,
		activity: [
			{ id: 'activity-3', label: 'File parsed', detail: '1,284 rows and 7 columns detected.', createdAt: now },
			{ id: 'activity-2', label: 'Mapping inferred', detail: 'HubSpot customer preset matched with 95% confidence.', createdAt: now },
			{ id: 'activity-1', label: 'Upload received', detail: 'Checksum and file metadata recorded.', createdAt: now },
		],
	};
}

/**
 * Returns a complete mapping for one preset.
 *
 * @param {string} preset Preset identifier.
 * @returns {Record<string, string>} Target-to-source mapping.
 */
function createPresetMapping(preset) {
	if (preset === 'minimal_accounts') {
		return { companyName: 'company', email: 'primary_email', stage: 'skip', plan: 'skip', seats: 'skip', renewalDate: 'skip', owner: 'skip' };
	}
	if (preset === 'blank') return Object.fromEntries(targetFields.map((field) => [field.key, 'skip']));
	return { companyName: 'company', email: 'primary_email', stage: 'lifecycle_stage', plan: 'plan', seats: 'seats', renewalDate: 'renewal_date', owner: 'owner' };
}

/**
 * Serializes process-local state with derived mapping and validation details.
 *
 * @returns {Record<string, unknown>} Public import-session payload.
 */
function serializeSession() {
	const analysis = buildRowAnalysis();
	const validationSummary = buildValidationSummary();
	const mappedCount = Object.values(session.mapping).filter((value) => value !== 'skip').length;
	return cloneValue({
		...session,
		previewRows,
		analysis,
		mappingSummary: {
			mappedCount,
			totalCount: targetFields.length,
			requiredMappedCount: targetFields.filter((field) => field.required && session.mapping[field.key] !== 'skip').length,
			requiredCount: targetFields.filter((field) => field.required).length,
			progress: Math.round((mappedCount / targetFields.length) * 100),
		},
		readiness: validationSummary,
	});
}

/**
 * Builds stable row counts and visible import issues from current mappings.
 *
 * @returns {Record<string, unknown>} Row analysis summary.
 */
function buildRowAnalysis() {
	const requiredMapped = targetFields.filter((field) => field.required).every((field) => session.mapping[field.key] && session.mapping[field.key] !== 'skip');
	const blockedRows = requiredMapped ? 16 : session.file.rowCount;
	const issues = [];
	if (!requiredMapped) {
		issues.push({ id: 'required_mapping', status: 'blocked', count: session.file.rowCount, title: 'Required field mapping', detail: 'Company name and primary email must map to parsed columns.' });
	} else {
		issues.push({ id: 'missing_email', status: 'blocked', count: 16, title: 'Missing primary email', detail: 'These rows cannot identify or create customers.' });
	}
	if (session.mapping.stage !== 'skip') issues.push({ id: 'stage_alias', status: 'warning', count: 34, title: 'Lifecycle aliases', detail: 'Prospect and SQL will normalize to Lead before import.' });
	if (session.mapping.renewalDate !== 'skip') issues.push({ id: 'date_format', status: 'warning', count: 18, title: 'Date normalization', detail: 'DD/MM/YYYY values will normalize to ISO dates.' });
	issues.push({ id: 'duplicate_email', status: 'info', count: 12, title: 'Existing customers', detail: 'The selected duplicate policy will handle matching emails.' });
	return {
		validRows: session.file.rowCount - blockedRows,
		blockedRows,
		warningRows: issues.filter((issue) => issue.status === 'warning').reduce((total, issue) => total + issue.count, 0),
		existingRows: 12,
		issues,
	};
}

/**
 * Builds exact import readiness checks for the current server state.
 *
 * @returns {{ ready: boolean, passedCount: number, checks: Array<Record<string, unknown>> }} Validation summary.
 */
function buildValidationSummary() {
	const analysis = buildRowAnalysis();
	const requiredMapped = targetFields.filter((field) => field.required).every((field) => session.mapping[field.key] && session.mapping[field.key] !== 'skip');
	const checks = [
		buildCheck('file', 'Source file parsed', Boolean(session.file.rowCount && session.file.columnCount), `${session.file.rowCount.toLocaleString()} rows and ${session.file.columnCount} columns are available.`),
		buildCheck('required', 'Required fields mapped', requiredMapped, requiredMapped ? 'Company name and primary email are mapped.' : 'Map company name and primary email.'),
		buildCheck('unique', 'Source columns are unique', hasUniqueMappings(), hasUniqueMappings() ? 'No source column is assigned twice.' : 'Assign each source column to only one target.'),
		buildCheck('mode', 'Blocked-row behavior is safe', session.settings.importMode === 'valid_only' || analysis.blockedRows === 0, session.settings.importMode === 'valid_only' ? `${analysis.blockedRows} blocked rows will be skipped.` : `${analysis.blockedRows} blocked rows must be corrected.`),
		buildCheck('duplicates', 'Duplicate behavior selected', Boolean(session.settings.duplicatePolicy), `Matching emails use ${session.settings.duplicatePolicy.replaceAll('_', ' ')}.`),
	];
	const passedCount = checks.filter((check) => check.status === 'passed').length;
	return { ready: passedCount === checks.length, passedCount, checks };
}

/**
 * Checks whether all active source-column assignments are unique.
 *
 * @returns {boolean} Whether no parsed source column is reused.
 */
function hasUniqueMappings() {
	const values = Object.values(session.mapping).filter((value) => value !== 'skip');
	return new Set(values).size === values.length;
}

/**
 * Creates one semantic readiness check.
 *
 * @param {string} id Check identifier.
 * @param {string} label Check label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Supporting detail.
 * @returns {Record<string, unknown>} Normalized readiness check.
 */
function buildCheck(id, label, passed, detail) {
	return { id, label, status: passed ? 'passed' : 'blocked', detail };
}

/**
 * Validates a requested import-session identifier.
 *
 * @param {string} sessionId Requested identifier.
 * @returns {Record<string, unknown>|null} Not-found response when mismatched.
 */
function validateSessionId(sessionId) {
	return String(sessionId || '') === session.id ? null : notFound('Import session');
}

/**
 * Validates optimistic session revision state.
 *
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response when stale.
 */
function validateRevision(revision) {
	if (Number(revision) === session.revision) return null;
	return conflict('This import changed in another tab. Reload the latest session before saving.', { code: 'revision_conflict', session: serializeSession() });
}

/**
 * Commits a session mutation and records activity.
 *
 * @param {string} label Activity label.
 * @returns {void}
 */
function commitSession(label) {
	session.revision += 1;
	session.updatedAt = new Date().toISOString();
	session.activity.unshift({ id: `activity-${session.revision}`, label, detail: 'Maya Chen', createdAt: session.updatedAt });
	session.activity = session.activity.slice(0, 12);
}

/**
 * Normalizes author-entered short text.
 *
 * @param {unknown} value Submitted value.
 * @param {number} maxLength Maximum retained length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Escapes one value for a generated CSV cell.
 *
 * @param {unknown} value Cell value.
 * @returns {string} RFC-style quoted CSV value when needed.
 */
function csvCell(value) {
	const text = String(value ?? '');
	return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
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
 * @returns {Record<string, unknown>} Validation error response.
 */
function validation(message, fields = []) {
	return { status: 422, error: { code: 'validation_failed', message, fields } };
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
