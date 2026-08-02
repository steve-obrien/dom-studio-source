import { createHash } from 'node:crypto';

const verificationTypeOptions = Object.freeze([
	{ value: 'individual', label: 'Individual customer', description: 'Personal account verification for one applicant.' },
	{ value: 'business_owner', label: 'Business owner', description: 'Identity evidence for a beneficial owner or director.' },
	{ value: 'seller', label: 'Marketplace seller', description: 'Payout eligibility for an individual seller.' },
]);

const countryOptions = Object.freeze([
	{ value: 'GB', label: 'United Kingdom', description: 'Passport, driving licence, or national identity evidence.' },
	{ value: 'US', label: 'United States', description: 'Passport, driving licence, or state identity evidence.' },
	{ value: 'IE', label: 'Ireland', description: 'Passport, driving licence, or national identity evidence.' },
	{ value: 'DE', label: 'Germany', description: 'Passport or national identity evidence.' },
]);

const documentTypeOptions = Object.freeze([
	{ value: 'passport', label: 'Passport', description: 'Photo page with machine-readable zone.' },
	{ value: 'driving_licence', label: 'Driving licence', description: 'Front and reverse capture.' },
	{ value: 'national_id', label: 'National ID card', description: 'Front and reverse capture when applicable.' },
]);

const captureMethodOptions = Object.freeze([
	{ value: 'camera', label: 'Camera capture', description: 'Recommended for document quality and liveness.' },
	{ value: 'upload', label: 'Secure upload', description: 'Use an existing image or PDF from this device.' },
	{ value: 'provider_link', label: 'Continue on phone', description: 'Open the provider session on another device.' },
]);

const pepOptions = Object.freeze([
	{ value: 'not_exposed', label: 'No', description: 'The applicant is not a politically exposed person.' },
	{ value: 'exposed', label: 'Yes', description: 'Route the packet to enhanced due diligence.' },
]);

let session = createInitialSession();

/**
 * Returns configuration and option data needed to start the verification section.
 *
 * @returns {Record<string, unknown>} Verification bootstrap payload.
 */
export function getIdentityVerificationBootstrap() {
	return cloneValue({
		provider: {
			name: 'Atlas Verify',
			mode: 'Demo provider',
			privacyMessage: 'Evidence is encrypted in transit and removed after the configured retention period.',
		},
		currentUser: {
			name: 'Maya Hart',
			initials: 'MH',
		},
		verificationTypeOptions,
		countryOptions,
		documentTypeOptions,
		captureMethodOptions,
		pepOptions,
		support: {
			title: 'Need help verifying?',
			description: 'A support specialist can explain accepted evidence without viewing the document contents.',
			availability: 'Replies usually arrive within 4 minutes.',
		},
	});
}

/**
 * Returns the current process-local verification session.
 *
 * @returns {Record<string, unknown>} Serialized verification session.
 */
export function getIdentityVerificationSession() {
	return serializeSession(session);
}

/**
 * Persists validated applicant profile fields with optimistic revision protection.
 *
 * @param {Record<string, unknown>} input Profile fields and current revision.
 * @returns {Record<string, unknown>} Updated session or API error.
 */
export function saveIdentityVerificationProfile(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (session.status === 'submitted') return conflict('This verification packet has already been submitted.');
	const profile = normalizeProfile(input.profile || {});
	const validationError = validateProfile(profile);
	if (validationError) return { error: validationError, status: 422 };
	session.profile = profile;
	commitSession('Profile details saved', 'Maya Hart');
	return {
		session: serializeSession(session),
		message: 'Your identity details are saved and available when you resume.',
	};
}

/**
 * Captures one required evidence item through the simulated provider boundary.
 *
 * @param {string} evidenceId Evidence identifier.
 * @param {Record<string, unknown>} input Provider method, revision, and optional failure simulation.
 * @returns {Record<string, unknown>} Updated evidence session or provider error.
 */
export function captureIdentityVerificationEvidence(evidenceId, input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (session.status === 'submitted') return conflict('This verification packet has already been submitted.');
	const evidence = session.evidence.find((item) => item.id === String(evidenceId));
	if (!evidence) return notFound('Evidence item');
	const method = normalizeOption(input.method, captureMethodOptions, 'camera');
	evidence.attempts += 1;
	evidence.method = method;
	if (input.simulateFailure === true) {
		evidence.status = 'needs_retry';
		evidence.providerMessage = 'The image was too reflective to read. Move away from direct light and try again.';
		evidence.updatedAt = new Date().toISOString();
		commitSession(`${evidence.name} needs another capture`, 'Atlas Verify');
		return {
			error: evidence.providerMessage,
			status: 422,
			session: serializeSession(session),
		};
	}
	evidence.status = 'verified';
	evidence.providerMessage = evidence.id === 'selfie'
		? 'Liveness and face match passed.'
		: 'Image quality and document authenticity checks passed.';
	evidence.providerRef = `ev_${evidence.id}_${String(Date.now()).slice(-7)}`;
	evidence.updatedAt = new Date().toISOString();
	commitSession(`${evidence.name} verified`, 'Atlas Verify');
	return {
		session: serializeSession(session),
		message: `${evidence.name} passed the provider checks.`,
	};
}

/**
 * Stores applicant declarations and verification consent.
 *
 * @param {Record<string, unknown>} input Declaration values and current revision.
 * @returns {Record<string, unknown>} Updated session or validation error.
 */
export function saveIdentityVerificationDeclarations(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (session.status === 'submitted') return conflict('This verification packet has already been submitted.');
	const pepExposure = normalizeOption(input.pepExposure, pepOptions, '');
	if (!pepExposure) return { error: 'Confirm whether the applicant is a politically exposed person.', status: 422 };
	session.declarations = {
		pepExposure,
		consentAccepted: input.consentAccepted === true,
		consentVersion: 'identity_terms_2026_08',
		acceptedAt: input.consentAccepted === true ? new Date().toISOString() : '',
	};
	session.checks = session.checks.map((check) => check.id === 'pep'
		? { ...check, status: 'pending', result: 'Waiting', detail: 'Run checks again after changing the PEP declaration.' }
		: check);
	commitSession('Declarations and consent updated', 'Maya Hart');
	return {
		session: serializeSession(session),
		message: session.declarations.consentAccepted
			? 'Consent and declarations are saved.'
			: 'Declarations are saved. Consent is still required before submission.',
	};
}

/**
 * Runs server-owned screening checks for the current applicant packet.
 *
 * @param {Record<string, unknown>} input Current revision and optional failure simulation.
 * @returns {Record<string, unknown>} Updated screening results or provider error.
 */
export function runIdentityVerificationChecks(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	if (!profileIsComplete(session.profile)) return { error: 'Complete the applicant profile before running screening checks.', status: 422 };
	if (!session.declarations.pepExposure) return { error: 'Save the PEP declaration before running screening checks.', status: 422 };
	if (input.simulateFailure === true) return { error: 'The screening provider is temporarily unavailable. Try again without losing this session.', status: 503 };
	const pepExposed = session.declarations.pepExposure === 'exposed';
	session.checks = [
		{ id: 'sanctions', name: 'Sanctions screen', status: 'clear', result: 'Clear', detail: 'No list matches found for the applicant or address.', checkedAt: new Date().toISOString() },
		{ id: 'pep', name: 'PEP screen', status: pepExposed ? 'review' : 'clear', result: pepExposed ? 'Review' : 'Clear', detail: pepExposed ? 'Enhanced due diligence is required before a decision.' : 'No declared political exposure.', checkedAt: new Date().toISOString() },
		{ id: 'duplicate', name: 'Duplicate identity', status: 'review', result: 'Review', detail: 'A similar historic account will be compared during manual review.', checkedAt: new Date().toISOString() },
		{ id: 'device', name: 'Device integrity', status: 'clear', result: 'Clear', detail: 'Capture completed from a trusted browser context.', checkedAt: new Date().toISOString() },
	];
	commitSession('Screening checks completed', 'Compliance API');
	return {
		session: serializeSession(session),
		message: 'Screening finished. Review items will travel with the submitted packet.',
	};
}

/**
 * Submits a complete packet and returns immutable handoff evidence.
 *
 * @param {Record<string, unknown>} input Revision, acknowledgement, and applicant context.
 * @returns {Record<string, unknown>} Submitted packet and receipt or readiness error.
 */
export function submitIdentityVerification(input = {}) {
	if (session.status === 'submitted') {
		return {
			session: serializeSession(session),
			receipt: cloneValue(session.receipt),
			message: 'This verification packet is already in review.',
		};
	}
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const readiness = calculateReadiness(session);
	if (!readiness.ready) {
		const missing = readiness.checks.filter((check) => !check.ready).map((check) => check.label).join(', ');
		return { error: `Complete these items before submission: ${missing}.`, status: 422 };
	}
	if (input.acknowledged !== true) return { error: 'Confirm that the applicant reviewed the profile, evidence, and consent summary.', status: 422 };
	const submittedAt = new Date().toISOString();
	const checksum = createHash('sha256')
		.update(`${session.id}:${session.revision}:${submittedAt}:${session.evidence.map((item) => item.providerRef).join(':')}`)
		.digest('hex');
	session.status = 'submitted';
	session.submissionNote = normalizeText(input.note, 300);
	session.receipt = {
		packetId: `packet_${session.id}`,
		submittedAt,
		estimatedDecisionAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
		checksum: `sha256:${checksum}`,
		reviewLane: calculateRisk(session).level === 'high' ? 'Enhanced due diligence' : 'Standard manual review',
	};
	commitSession('Verification packet submitted', 'Maya Hart');
	return {
		session: serializeSession(session),
		receipt: cloneValue(session.receipt),
		message: 'Your evidence is secured and the packet is now in manual review.',
	};
}

/**
 * Records a support request without exposing applicant evidence contents.
 *
 * @param {Record<string, unknown>} input Current revision and verification step.
 * @returns {Record<string, unknown>} Updated session and support request proof.
 */
export function requestIdentityVerificationSupport(input = {}) {
	const revisionError = validateRevision(input.revision);
	if (revisionError) return revisionError;
	const step = ['profile', 'evidence', 'checks', 'review'].includes(String(input.step)) ? String(input.step) : 'evidence';
	const requestId = `support_${session.id}_${String(Date.now()).slice(-6)}`;
	commitSession(`Support requested for ${step}`, 'Maya Hart');
	return {
		session: serializeSession(session),
		supportRequest: {
			id: requestId,
			step,
			responseDueAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
		},
		message: 'A verification specialist has your request and will reply shortly.',
	};
}

/**
 * Creates the initial realistic verification session.
 *
 * @returns {Record<string, unknown>} Mutable process-local session state.
 */
function createInitialSession() {
	const createdAt = new Date(Date.now() - 19 * 60 * 1000).toISOString();
	return {
		id: 'iv_maya_2048',
		revision: 1,
		status: 'in_progress',
		createdAt,
		updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
		expiresAt: new Date(Date.now() + 42 * 60 * 1000).toISOString(),
		profile: {
			verificationType: 'individual',
			country: 'GB',
			firstName: 'Maya',
			lastName: 'Hart',
			email: 'maya@example.com',
			dateOfBirth: '1991-04-18',
			addressLine: '24 Leather Lane',
			city: 'London',
			postcode: 'EC1N 7SU',
			preferredDocument: 'passport',
		},
		evidence: [
			{
				id: 'identity',
				name: 'Government ID',
				description: 'Photo identity evidence and authenticity checks.',
				status: 'verified',
				required: true,
				method: 'camera',
				attempts: 1,
				providerMessage: 'Image quality and document authenticity checks passed.',
				providerRef: 'ev_identity_7834211',
				updatedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
			},
			{
				id: 'address',
				name: 'Proof of address',
				description: 'Bank statement, utility bill, or tax letter from the last 90 days.',
				status: 'required',
				required: true,
				method: '',
				attempts: 0,
				providerMessage: 'Capture one accepted proof-of-address document.',
				providerRef: '',
				updatedAt: '',
			},
			{
				id: 'selfie',
				name: 'Selfie and liveness',
				description: 'Live face capture compared with the identity document.',
				status: 'required',
				required: true,
				method: '',
				attempts: 0,
				providerMessage: 'A short camera capture is required.',
				providerRef: '',
				updatedAt: '',
			},
		],
		declarations: {
			pepExposure: 'not_exposed',
			consentAccepted: false,
			consentVersion: 'identity_terms_2026_08',
			acceptedAt: '',
		},
		checks: [
			{ id: 'sanctions', name: 'Sanctions screen', status: 'pending', result: 'Waiting', detail: 'Run checks after confirming the applicant details.', checkedAt: '' },
			{ id: 'pep', name: 'PEP screen', status: 'pending', result: 'Waiting', detail: 'Run checks after confirming the PEP declaration.', checkedAt: '' },
			{ id: 'duplicate', name: 'Duplicate identity', status: 'pending', result: 'Waiting', detail: 'Comparison begins when checks run.', checkedAt: '' },
			{ id: 'device', name: 'Device integrity', status: 'pending', result: 'Waiting', detail: 'Capture context will be evaluated with the packet.', checkedAt: '' },
		],
		activity: [
			{ id: 'activity_identity', label: 'Government ID verified', actor: 'Atlas Verify', createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
			{ id: 'activity_profile', label: 'Profile details added', actor: 'Maya Hart', createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
			{ id: 'activity_started', label: 'Verification session created', actor: 'Onboarding API', createdAt },
		],
		submissionNote: '',
		receipt: null,
	};
}

/**
 * Serializes session state with server-owned readiness, risk, and next-step context.
 *
 * @param {Record<string, unknown>} value Mutable session state.
 * @returns {Record<string, unknown>} Client-safe session payload.
 */
function serializeSession(value) {
	const readiness = calculateReadiness(value);
	const risk = calculateRisk(value);
	return cloneValue({
		...value,
		readiness,
		risk,
		nextStep: findNextStep(readiness, value),
		evidence: value.evidence.map((item) => ({
			...item,
			statusLabel: evidenceStatusLabel(item.status),
		})),
	});
}

/**
 * Calculates the four server-owned completion gates for submission.
 *
 * @param {Record<string, unknown>} value Verification session.
 * @returns {{ready: boolean, percent: number, checks: Array<Record<string, unknown>>}} Readiness summary.
 */
function calculateReadiness(value) {
	const checks = [
		{
			id: 'profile',
			label: 'Applicant details',
			detail: profileIsComplete(value.profile) ? `${value.profile.firstName} ${value.profile.lastName}` : 'Required identity fields are missing',
			ready: profileIsComplete(value.profile),
		},
		{
			id: 'evidence',
			label: 'Required evidence',
			detail: `${value.evidence.filter((item) => item.status === 'verified').length} of ${value.evidence.filter((item) => item.required).length} verified`,
			ready: value.evidence.filter((item) => item.required).every((item) => item.status === 'verified'),
		},
		{
			id: 'checks',
			label: 'Screening checks',
			detail: value.checks.every((check) => check.status !== 'pending') ? 'Screening results are attached' : 'Server screening has not finished',
			ready: value.checks.every((check) => check.status !== 'pending'),
		},
		{
			id: 'consent',
			label: 'Consent and declaration',
			detail: value.declarations.consentAccepted ? `Accepted ${value.declarations.consentVersion}` : 'Applicant consent is required',
			ready: value.declarations.consentAccepted && Boolean(value.declarations.pepExposure),
		},
	];
	const completed = checks.filter((check) => check.ready).length;
	return {
		ready: checks.every((check) => check.ready),
		percent: Math.round((completed / checks.length) * 100),
		checks,
	};
}

/**
 * Calculates a transparent review score from evidence and declaration state.
 *
 * @param {Record<string, unknown>} value Verification session.
 * @returns {{score: number, level: string, explanation: string}} Risk summary.
 */
function calculateRisk(value) {
	let score = 18;
	if (value.profile.verificationType !== 'individual') score += 8;
	if (value.profile.country !== 'GB') score += 6;
	if (value.declarations.pepExposure === 'exposed') score += 42;
	if (value.checks.some((check) => check.id === 'duplicate' && check.status === 'review')) score += 16;
	if (value.evidence.some((item) => item.status === 'needs_retry')) score += 8;
	const boundedScore = Math.min(100, score);
	const level = boundedScore < 30 ? 'low' : boundedScore < 70 ? 'review' : 'high';
	return {
		score: boundedScore,
		level,
		explanation: level === 'low'
			? 'No material review signals are present.'
			: level === 'review'
				? 'The packet will receive a standard manual comparison.'
				: 'Enhanced due diligence is required before a decision.',
	};
}

/**
 * Chooses the first incomplete step so the client can resume meaningfully.
 *
 * @param {Record<string, unknown>} readiness Readiness summary.
 * @param {Record<string, unknown>} value Verification session.
 * @returns {string} Step identifier.
 */
function findNextStep(readiness, value) {
	if (value.status === 'submitted') return 'review';
	const firstIncomplete = readiness.checks.find((check) => !check.ready);
	if (!firstIncomplete) return 'review';
	if (firstIncomplete.id === 'profile') return 'profile';
	if (firstIncomplete.id === 'evidence') return 'evidence';
	return 'checks';
}

/**
 * Normalizes applicant profile fields to bounded, supported values.
 *
 * @param {Record<string, unknown>} input Candidate profile.
 * @returns {Record<string, string>} Normalized profile.
 */
function normalizeProfile(input) {
	return {
		verificationType: normalizeOption(input.verificationType, verificationTypeOptions, 'individual'),
		country: normalizeOption(input.country, countryOptions, 'GB'),
		firstName: normalizeText(input.firstName, 60),
		lastName: normalizeText(input.lastName, 60),
		email: normalizeText(input.email, 160).toLowerCase(),
		dateOfBirth: normalizeText(input.dateOfBirth, 10),
		addressLine: normalizeText(input.addressLine, 120),
		city: normalizeText(input.city, 80),
		postcode: normalizeText(input.postcode, 20).toUpperCase(),
		preferredDocument: normalizeOption(input.preferredDocument, documentTypeOptions, 'passport'),
	};
}

/**
 * Validates required profile fields and minimum applicant age.
 *
 * @param {Record<string, string>} profile Normalized profile.
 * @returns {string} Validation error or empty string.
 */
function validateProfile(profile) {
	if (profile.firstName.length < 2 || profile.lastName.length < 2) return 'Enter the applicant legal first and last name.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return 'Enter a valid email address.';
	if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth)) return 'Enter the date of birth in YYYY-MM-DD format.';
	const birthDate = new Date(`${profile.dateOfBirth}T00:00:00Z`);
	if (Number.isNaN(birthDate.getTime())) return 'Enter a valid date of birth.';
	const adultThreshold = new Date();
	adultThreshold.setUTCFullYear(adultThreshold.getUTCFullYear() - 18);
	if (birthDate > adultThreshold) return 'The applicant must be at least 18 years old for this verification flow.';
	if (profile.addressLine.length < 4 || profile.city.length < 2 || profile.postcode.length < 3) return 'Complete the residential address and postcode.';
	return '';
}

/**
 * Reports whether every required profile field currently passes validation.
 *
 * @param {Record<string, string>} profile Applicant profile.
 * @returns {boolean} True when complete.
 */
function profileIsComplete(profile) {
	return validateProfile(normalizeProfile(profile)) === '';
}

/**
 * Commits a session mutation and appends an audit event.
 *
 * @param {string} label Activity label.
 * @param {string} actor Activity actor.
 * @returns {void}
 */
function commitSession(label, actor) {
	session.revision += 1;
	session.updatedAt = new Date().toISOString();
	session.activity.unshift({
		id: `activity_${session.revision}_${Date.now()}`,
		label,
		actor,
		createdAt: session.updatedAt,
	});
}

/**
 * Validates an optimistic session revision.
 *
 * @param {unknown} revision Candidate revision.
 * @returns {Record<string, unknown>|null} Conflict result or null.
 */
function validateRevision(revision) {
	if (Number(revision) !== session.revision) return conflict('This verification changed in another tab. Reload the latest session before continuing.');
	return null;
}

/**
 * Resolves a supported option value.
 *
 * @param {unknown} value Candidate value.
 * @param {Array<{value: string}>} options Supported options.
 * @param {string} fallback Fallback value.
 * @returns {string} Supported or fallback value.
 */
function normalizeOption(value, options, fallback) {
	const candidate = String(value || '');
	return options.some((option) => option.value === candidate) ? candidate : fallback;
}

/**
 * Normalizes a bounded user-authored string.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Returns a readable status for evidence UI.
 *
 * @param {string} status Evidence status.
 * @returns {string} Human-readable label.
 */
function evidenceStatusLabel(status) {
	return ({ verified: 'Verified', required: 'Required', needs_retry: 'Try again' })[status] || 'Waiting';
}

/**
 * Creates a standard optimistic or lifecycle conflict response.
 *
 * @param {string} error Conflict message.
 * @returns {{error: string, status: number}} Conflict response.
 */
function conflict(error) {
	return { error, status: 409 };
}

/**
 * Creates a standard missing-resource response.
 *
 * @param {string} resource Resource label.
 * @returns {{error: string, status: number}} Not-found response.
 */
function notFound(resource) {
	return { error: `${resource} not found.`, status: 404 };
}

/**
 * Detaches JSON-safe state before returning it to callers.
 *
 * @param {unknown} value Serializable value.
 * @returns {unknown} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
