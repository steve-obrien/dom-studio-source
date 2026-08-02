const roleOptions = [
	{ value: 'candidate', label: 'Candidate', description: 'Primary recipient for employment documents.' },
	{ value: 'hiring_manager', label: 'Hiring manager', description: 'Company countersignature and approval.' },
	{ value: 'finance_approver', label: 'Finance approver', description: 'Compensation and grant review.' },
	{ value: 'legal_reviewer', label: 'Legal reviewer', description: 'Contract and policy review.' },
];

const deliveryOptions = [
	{ value: 'sequential', label: 'Signing order', description: 'Invite each recipient only after the previous signer completes.' },
	{ value: 'parallel', label: 'Parallel signing', description: 'Invite every recipient at the same time.' },
];

const reminderOptions = [
	{ value: 'every_2_days', label: 'Every 2 days', description: 'Frequent reminders for time-sensitive envelopes.' },
	{ value: 'every_3_days', label: 'Every 3 days', description: 'Balanced default for employment documents.' },
	{ value: 'weekly', label: 'Weekly', description: 'Low-frequency reminders for longer reviews.' },
	{ value: 'disabled', label: 'Disabled', description: 'Only operators can send reminders.' },
];

const expiryOptions = [
	{ value: '7', label: '7 days', description: 'Short, time-sensitive signing window.' },
	{ value: '14', label: '14 days', description: 'Standard employment document window.' },
	{ value: '30', label: '30 days', description: 'Extended review period.' },
];

const fieldTypeOptions = [
	{ value: 'signature', label: 'Signature', description: 'Certificate-backed recipient signature.' },
	{ value: 'initials', label: 'Initials', description: 'Initials attached to a specific clause.' },
	{ value: 'date_signed', label: 'Date signed', description: 'Provider-generated completion date.' },
	{ value: 'text', label: 'Text field', description: 'Recipient-entered plain text.' },
];

const positionOptions = [
	{ value: 'lower_left', label: 'Lower left', description: 'Primary company signature position.', x: 18, y: 82 },
	{ value: 'lower_right', label: 'Lower right', description: 'Primary recipient signature position.', x: 62, y: 82 },
	{ value: 'middle_right', label: 'Middle right', description: 'Acknowledgement beside a key term.', x: 62, y: 58 },
	{ value: 'upper_margin', label: 'Upper margin', description: 'Initials beside an early clause.', x: 76, y: 31 },
];

let sequence = {
	event: 950,
	field: 40,
	receipt: 600,
};

let workspace = createInitialWorkspace();

/**
 * Returns the signing workspace, available configuration, and default envelope.
 *
 * @returns {Record<string, unknown>} Signing workspace bootstrap payload.
 */
export function getDocumentSigningBootstrap() {
	const defaultEnvelope = workspace.envelopes.find((envelope) => envelope.status === 'draft') || workspace.envelopes[0];
	return {
		workspace: serializeWorkspace(),
		options: serializeOptions(),
		envelopes: serializeEnvelopeList(),
		defaultEnvelopeId: defaultEnvelope.id,
		...envelopePayload(defaultEnvelope),
	};
}

/**
 * Returns one envelope with its document content, recipients, fields, and evidence.
 *
 * @param {string} envelopeId Envelope identifier.
 * @returns {Record<string, unknown>} Envelope response or missing-resource error.
 */
export function getDocumentSigningEnvelope(envelopeId) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	return envelopePayload(envelope);
}

/**
 * Updates the editable delivery contract at an exact revision.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {Record<string, unknown>} input Settings update payload.
 * @returns {Record<string, unknown>} Updated envelope or validation conflict.
 */
export function updateDocumentSigningSettings(envelopeId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	const editable = requireDraft(envelope);
	if (editable) return editable;
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;

	const fields = [];
	const subject = String(input.subject || '').trim();
	const message = String(input.message || '').trim();
	const deliveryMode = String(input.deliveryMode || '');
	const reminderCadence = String(input.reminderCadence || '');
	const expiresInDays = String(input.expiresInDays || '');
	if (subject.length < 8 || subject.length > 100) fields.push(fieldError('subject', 'Use 8 to 100 characters for the email subject.'));
	if (message.length < 24 || message.length > 500) fields.push(fieldError('message', 'Use 24 to 500 characters for the recipient message.'));
	if (!deliveryOptions.some((option) => option.value === deliveryMode)) fields.push(fieldError('deliveryMode', 'Choose a supported delivery mode.'));
	if (!reminderOptions.some((option) => option.value === reminderCadence)) fields.push(fieldError('reminderCadence', 'Choose a supported reminder cadence.'));
	if (!expiryOptions.some((option) => option.value === expiresInDays)) fields.push(fieldError('expiresInDays', 'Choose a supported expiration window.'));
	if (fields.length) return validation('Review the envelope delivery contract.', fields);

	envelope.subject = subject;
	envelope.message = message;
	envelope.deliveryMode = deliveryMode;
	envelope.reminderCadence = reminderCadence;
	envelope.expiresInDays = Number(expiresInDays);
	envelope.signingOrder = deliveryMode === 'sequential' ? Boolean(input.signingOrder) : false;
	envelope.declineReasonRequired = Boolean(input.declineReasonRequired);
	advanceRevision(envelope);
	appendEvent(envelope, 'Envelope settings saved', `${labelFor(deliveryOptions, deliveryMode)} · ${labelFor(reminderOptions, reminderCadence)}`, 'Mina Cook', 'neutral');
	return success('Envelope settings saved.', envelopePayload(envelope));
}

/**
 * Updates one draft recipient with server-side identity and duplicate checks.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {string} recipientId Recipient identifier.
 * @param {Record<string, unknown>} input Recipient update payload.
 * @returns {Record<string, unknown>} Updated envelope or validation conflict.
 */
export function updateDocumentSigningRecipient(envelopeId, recipientId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	const editable = requireDraft(envelope);
	if (editable) return editable;
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	const recipient = envelope.recipients.find((item) => item.id === recipientId);
	if (!recipient) return notFound('Envelope recipient');

	const fields = [];
	const name = String(input.name || '').trim();
	const email = String(input.email || '').trim().toLowerCase();
	const role = String(input.role || '');
	const required = Boolean(input.required);
	if (name.length < 2 || name.length > 60) fields.push(fieldError('name', 'Use 2 to 60 characters for the recipient name.'));
	if (!isEmail(email)) fields.push(fieldError('email', 'Enter a complete recipient email address.'));
	if (envelope.recipients.some((item) => item.id !== recipientId && item.email.toLowerCase() === email)) fields.push(fieldError('email', 'Each recipient needs a unique email address.'));
	if (!roleOptions.some((option) => option.value === role)) fields.push(fieldError('role', 'Choose a supported recipient role.'));
	if (!required && !envelope.recipients.some((item) => item.id !== recipientId && item.required)) fields.push(fieldError('required', 'Keep at least one recipient required.'));
	if (fields.length) return validation('Review the recipient details.', fields);

	recipient.name = name;
	recipient.email = email;
	recipient.role = role;
	recipient.required = required;
	recipient.identityCheck = Boolean(input.identityCheck);
	advanceRevision(envelope);
	appendEvent(envelope, 'Recipient updated', `${recipient.name} · ${labelFor(roleOptions, recipient.role)}`, 'Mina Cook', 'neutral');
	return success('Recipient saved.', envelopePayload(envelope, recipient.id));
}

/**
 * Adds a server-positioned signing field to a draft document.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {Record<string, unknown>} input Field creation payload.
 * @returns {Record<string, unknown>} Updated envelope or validation conflict.
 */
export function addDocumentSigningField(envelopeId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	const editable = requireDraft(envelope);
	if (editable) return editable;
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	const document = envelope.documents.find((item) => item.id === input.documentId);
	const recipient = envelope.recipients.find((item) => item.id === input.recipientId);
	const type = fieldTypeOptions.find((option) => option.value === input.type);
	const position = positionOptions.find((option) => option.value === input.position);
	const page = Number(input.page);
	const fields = [];
	if (!document) fields.push(fieldError('documentId', 'Choose a document in this envelope.'));
	if (!recipient) fields.push(fieldError('recipientId', 'Choose a recipient in this envelope.'));
	if (!type) fields.push(fieldError('type', 'Choose a supported field type.'));
	if (!position) fields.push(fieldError('position', 'Choose a supported document position.'));
	if (!document || !Number.isInteger(page) || page < 1 || page > document.pages) fields.push(fieldError('page', 'Choose a page in the selected document.'));
	if (fields.length) return validation('Review the signing field.', fields);
	if (envelope.fields.some((field) => field.documentId === document.id && field.page === page && field.position === position.value)) {
		return conflict('That document position already contains a signing field.', envelopePayload(envelope, recipient.id, document.id));
	}

	sequence.field += 1;
	envelope.fields.push({
		id: `field-${sequence.field}`,
		documentId: document.id,
		recipientId: recipient.id,
		type: type.value,
		label: `${type.label} · ${recipient.name}`,
		page,
		position: position.value,
		x: position.x,
		y: position.y,
		required: Boolean(input.required),
	});
	advanceRevision(envelope);
	appendEvent(envelope, 'Signing field added', `${type.label} for ${recipient.name} · ${document.name} page ${page}`, 'Mina Cook', 'neutral');
	return success('Signing field added.', envelopePayload(envelope, recipient.id, document.id));
}

/**
 * Removes one signing field while preserving immutable envelope activity.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {string} fieldId Field identifier.
 * @param {Record<string, unknown>} input Exact-revision payload.
 * @returns {Record<string, unknown>} Updated envelope or validation conflict.
 */
export function removeDocumentSigningField(envelopeId, fieldId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	const editable = requireDraft(envelope);
	if (editable) return editable;
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	const fieldIndex = envelope.fields.findIndex((field) => field.id === fieldId);
	if (fieldIndex === -1) return notFound('Signing field');
	const [field] = envelope.fields.splice(fieldIndex, 1);
	advanceRevision(envelope);
	appendEvent(envelope, 'Signing field removed', field.label, 'Mina Cook', 'warning');
	return success('Signing field removed.', envelopePayload(envelope, field.recipientId, field.documentId));
}

/**
 * Approves the exact document version currently attached to a draft envelope.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {string} documentId Document identifier.
 * @param {Record<string, unknown>} input Approval evidence.
 * @returns {Record<string, unknown>} Updated envelope or validation conflict.
 */
export function approveDocumentSigningVersion(envelopeId, documentId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	const editable = requireDraft(envelope);
	if (editable) return editable;
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	const document = envelope.documents.find((item) => item.id === documentId);
	if (!document) return notFound('Envelope document');
	if (document.status === 'approved') return conflict('This document version is already approved.', envelopePayload(envelope, null, document.id));
	const reason = String(input.reason || '').trim();
	const fields = [];
	if (reason.length < 12 || reason.length > 240) fields.push(fieldError('reason', 'Record 12 to 240 characters of approval evidence.'));
	if (input.acknowledged !== true) fields.push(fieldError('acknowledged', 'Confirm that you reviewed this exact checksum.'));
	if (fields.length) return validation('Document approval needs evidence.', fields);

	document.status = 'approved';
	document.approvedAt = nowIso();
	document.approvedBy = 'Mina Cook';
	document.approvalReason = reason;
	advanceRevision(envelope);
	appendEvent(envelope, 'Document version approved', `${document.name} ${document.version} · ${document.checksum.slice(0, 12)}`, 'Mina Cook', 'success');
	return success('Document version approved.', envelopePayload(envelope, null, document.id));
}

/**
 * Returns server-calculated readiness without changing the envelope revision.
 *
 * @param {string} envelopeId Envelope identifier.
 * @returns {Record<string, unknown>} Current preflight result or missing-resource error.
 */
export function runDocumentSigningPreflight(envelopeId) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	return success('Server readiness recalculated.', {
		preflight: calculatePreflight(envelope),
		checkedAt: nowIso(),
		revision: envelope.revision,
	});
}

/**
 * Sends a ready draft through the deterministic provider boundary.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {Record<string, unknown>} input Send acknowledgement and revision.
 * @returns {Record<string, unknown>} Sent envelope and immutable receipt.
 */
export function sendDocumentSigningEnvelope(envelopeId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	const editable = requireDraft(envelope);
	if (editable) return editable;
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	if (input.acknowledged !== true) return validation('Sending requires an acknowledgement.', [fieldError('acknowledged', 'Confirm the recipients, versions, and delivery boundary.')]);
	const preflight = calculatePreflight(envelope);
	if (!preflight.ready) return conflict('Server preflight still has blocking checks.', envelopePayload(envelope));

	envelope.status = 'sent';
	envelope.sentAt = nowIso();
	envelope.providerEnvelopeId = `provider-${envelope.id}-${Date.now().toString(36)}`;
	envelope.expiresAt = addDays(envelope.sentAt, envelope.expiresInDays);
	const requiredRecipients = envelope.recipients.filter((recipient) => recipient.required);
	for (const [index, recipient] of requiredRecipients.entries()) {
		recipient.status = envelope.deliveryMode === 'parallel' || index === 0 ? 'pending' : 'queued';
		recipient.invitedAt = recipient.status === 'pending' ? envelope.sentAt : null;
	}
	advanceRevision(envelope);
	appendEvent(envelope, 'Envelope sent', `${requiredRecipients.length} required recipients · ${labelFor(deliveryOptions, envelope.deliveryMode)}`, 'Mina Cook', 'success');
	const receipt = createReceipt(envelope, 'envelope_sent', {
		providerEnvelopeId: envelope.providerEnvelopeId,
		expiresAt: envelope.expiresAt,
	});
	return success('Envelope sent to the signing provider.', { ...envelopePayload(envelope), receipt });
}

/**
 * Sends an operator reminder for one active recipient with cooldown protection.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {string} recipientId Recipient identifier.
 * @param {Record<string, unknown>} input Reminder evidence and revision.
 * @returns {Record<string, unknown>} Updated envelope and reminder receipt.
 */
export function remindDocumentSigningRecipient(envelopeId, recipientId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	if (envelope.status !== 'sent') return conflict('Reminders are available only while an envelope is awaiting signatures.', envelopePayload(envelope));
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	const recipient = envelope.recipients.find((item) => item.id === recipientId);
	if (!recipient) return notFound('Envelope recipient');
	if (!['pending', 'viewed'].includes(recipient.status)) return conflict('Only active recipients can receive a reminder.', envelopePayload(envelope, recipient.id));
	const reason = String(input.reason || '').trim();
	const fields = [];
	if (reason.length < 8 || reason.length > 180) fields.push(fieldError('reason', 'Record 8 to 180 characters for the operator reminder.'));
	if (input.acknowledged !== true) fields.push(fieldError('acknowledged', 'Confirm that this reminder is appropriate.'));
	if (fields.length) return validation('Reminder evidence is incomplete.', fields);
	if (recipient.lastReminderAt && Date.now() - new Date(recipient.lastReminderAt).getTime() < 60_000) {
		return conflict('A reminder was just sent. Wait before sending another.', envelopePayload(envelope, recipient.id));
	}

	recipient.lastReminderAt = nowIso();
	advanceRevision(envelope);
	appendEvent(envelope, 'Reminder sent', `${recipient.name} · ${reason}`, 'Mina Cook', 'neutral');
	const receipt = createReceipt(envelope, 'recipient_reminded', { recipientId: recipient.id, recipientEmail: recipient.email });
	return success('Reminder queued for delivery.', { ...envelopePayload(envelope, recipient.id), receipt });
}

/**
 * Simulates a signed provider callback and advances sequential recipients.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {string} recipientId Recipient identifier.
 * @param {Record<string, unknown>} input Provider callback acknowledgement.
 * @returns {Record<string, unknown>} Updated envelope and callback receipt.
 */
export function completeDocumentSigningRecipient(envelopeId, recipientId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	if (envelope.status !== 'sent') return conflict('Signer callbacks are available only for sent envelopes.', envelopePayload(envelope));
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	const recipient = envelope.recipients.find((item) => item.id === recipientId);
	if (!recipient) return notFound('Envelope recipient');
	if (recipient.status === 'completed') return conflict('This recipient already completed the envelope.', envelopePayload(envelope, recipient.id));
	if (recipient.status === 'queued') return conflict('Signing order has not reached this recipient yet.', envelopePayload(envelope, recipient.id));
	if (input.acknowledged !== true) return validation('Provider callbacks require an acknowledgement.', [fieldError('acknowledged', 'Confirm this is a deterministic demo callback.')]);

	recipient.status = 'completed';
	recipient.completedAt = nowIso();
	recipient.evidenceHash = checksum(`${envelope.id}:${recipient.id}:${recipient.completedAt}`);
	appendEvent(envelope, 'Recipient signed', `${recipient.name} · identity ${recipient.identityCheck ? 'verified' : 'email confirmed'}`, 'Demo signing provider', 'success');
	if (envelope.deliveryMode === 'sequential') {
		const nextRecipient = envelope.recipients
			.filter((item) => item.required && item.status === 'queued')
			.sort((left, right) => left.order - right.order)[0];
		if (nextRecipient) {
			nextRecipient.status = 'pending';
			nextRecipient.invitedAt = nowIso();
			appendEvent(envelope, 'Next recipient invited', `${nextRecipient.name} · signing order ${nextRecipient.order}`, 'Demo signing provider', 'neutral');
		}
	}
	const requiredRecipients = envelope.recipients.filter((item) => item.required);
	if (requiredRecipients.every((item) => item.status === 'completed')) {
		envelope.status = 'completed';
		envelope.completedAt = nowIso();
		envelope.certificate = createCertificate(envelope);
		appendEvent(envelope, 'Envelope completed', `${requiredRecipients.length} required signatures · certificate issued`, 'Demo signing provider', 'success');
	}
	advanceRevision(envelope);
	const receipt = createReceipt(envelope, 'recipient_signed', { recipientId: recipient.id, evidenceHash: recipient.evidenceHash });
	return success(recipient.status === 'completed' ? 'Provider signature callback accepted.' : 'Recipient updated.', { ...envelopePayload(envelope, recipient.id), receipt });
}

/**
 * Voids a draft or sent envelope with exact-name confirmation and audit evidence.
 *
 * @param {string} envelopeId Envelope identifier.
 * @param {Record<string, unknown>} input Void confirmation payload.
 * @returns {Record<string, unknown>} Voided envelope or validation conflict.
 */
export function voidDocumentSigningEnvelope(envelopeId, input = {}) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	if (!['draft', 'sent'].includes(envelope.status)) return conflict('Only draft or sent envelopes can be voided.', envelopePayload(envelope));
	const revision = validateRevision(envelope, input.revision);
	if (revision) return revision;
	const reason = String(input.reason || '').trim();
	const fields = [];
	if (String(input.confirmSubject || '') !== envelope.subject) fields.push(fieldError('confirmSubject', `Type ${envelope.subject} exactly.`));
	if (reason.length < 12 || reason.length > 240) fields.push(fieldError('reason', 'Record 12 to 240 characters for the audit trail.'));
	if (input.acknowledged !== true) fields.push(fieldError('acknowledged', 'Confirm that signing links should be invalidated.'));
	if (fields.length) return validation('Voiding needs explicit confirmation.', fields);

	envelope.status = 'voided';
	envelope.voidedAt = nowIso();
	for (const recipient of envelope.recipients) {
		if (!['completed', 'draft'].includes(recipient.status)) recipient.status = 'voided';
	}
	advanceRevision(envelope);
	appendEvent(envelope, 'Envelope voided', reason, 'Mina Cook', 'danger');
	const receipt = createReceipt(envelope, 'envelope_voided', { reason });
	return success('Envelope voided and active signing links invalidated.', { ...envelopePayload(envelope), receipt });
}

/**
 * Returns the immutable completion certificate for a completed envelope.
 *
 * @param {string} envelopeId Envelope identifier.
 * @returns {Record<string, unknown>} Certificate response or lifecycle conflict.
 */
export function getDocumentSigningCertificate(envelopeId) {
	const envelope = findEnvelope(envelopeId);
	if (!envelope) return notFound('Signing envelope');
	if (envelope.status !== 'completed' || !envelope.certificate) return conflict('A certificate is available after every required signer completes.', envelopePayload(envelope));
	return success('Completion certificate loaded.', { certificate: cloneValue(envelope.certificate) });
}

/**
 * Restores the deterministic signing workspace and clears process-local changes.
 *
 * @returns {Record<string, unknown>} Restored workspace bootstrap payload.
 */
export function resetDocumentSigningWorkspace() {
	sequence = { event: 950, field: 40, receipt: 600 };
	workspace = createInitialWorkspace();
	return { ...getDocumentSigningBootstrap(), message: 'Document signing reset to the seeded workspace.' };
}

/**
 * Creates the deterministic workspace and three lifecycle examples.
 *
 * @returns {Record<string, unknown>} Initial workspace state.
 */
function createInitialWorkspace() {
	const base = nowIso();
	const draft = createEnvelope({
		id: 'env-offer-2048',
		name: 'Offer letter and NDA',
		subject: 'Your Acme offer documents',
		status: 'draft',
		revision: 1,
		createdAt: addDays(base, -2),
	});
	draft.documents = [];
	draft.documents.push(createDocument('doc-offer', 'Offer Letter.pdf', 'v4', 4, 'approved', 'People Ops', 'sha256:7f0e5d1caa83', {
			eyebrow: 'Acme People',
			title: 'Offer of employment',
			subtitle: 'Prepared for Riley Chen · Senior Product Designer',
			paragraphs: [
				'We are pleased to offer you the role of Senior Product Designer at Acme People, reporting to Maya Patel.',
				'Your anticipated start date is 24 August 2026. This offer is subject to the attached confidentiality agreement and standard right-to-work verification.',
			],
			terms: [
				{ label: 'Base salary', value: '£92,000 per year' },
				{ label: 'Working pattern', value: 'Hybrid · London' },
				{ label: 'Probation', value: 'Three months' },
			],
			note: 'Please sign below to confirm that you accept the terms of this offer.',
	}));
	draft.documents.push(createDocument('doc-nda', 'Mutual NDA.pdf', 'v2', 6, 'approved', 'Legal', 'sha256:0c47d523de11', {
		eyebrow: 'Acme Legal',
		title: 'Mutual confidentiality agreement',
		subtitle: 'Effective from the date of the final signature',
		paragraphs: [
			'Each party may receive confidential product, commercial, technical, or customer information while evaluating or performing the employment relationship.',
			'Confidential information must be protected with reasonable care and used only for the purpose described in this agreement.',
		],
		terms: [
			{ label: 'Term', value: 'Three years' },
			{ label: 'Governing law', value: 'England and Wales' },
		],
		note: 'Initial the acknowledgement and sign the final page.',
	}));
	draft.documents.push(createDocument('doc-equity', 'Equity Plan Summary.pdf', 'v3', 2, 'needs_review', 'Finance', 'sha256:65e09cf3aab4', {
		eyebrow: 'Acme Finance',
		title: 'Equity plan summary',
		subtitle: 'Illustrative grant · subject to board approval',
		paragraphs: [
			'The proposed award is 8,500 options under the Acme 2026 Employee Option Plan. The grant remains subject to formal board approval and the definitive plan rules.',
			'Nothing in this summary is a guarantee of value or continued employment.',
		],
		terms: [
			{ label: 'Vesting', value: 'Four years · one-year cliff' },
			{ label: 'Proposed options', value: '8,500' },
		],
		note: 'Finance must approve this exact version before the envelope can be sent.',
	}));
	draft.recipients = [
		createRecipient('rec-riley', 'Riley Chen', 'riley.chen@example.com', 'candidate', 1, true, true, 'draft'),
		createRecipient('rec-maya', 'Maya Patel', 'maya@acme.test', 'hiring_manager', 2, true, false, 'draft'),
		createRecipient('rec-jon', 'Jon Bell', '', 'finance_approver', 3, false, false, 'draft'),
	];
	draft.fields = [
		createField('field-31', 'doc-offer', 'rec-maya', 'signature', 'Signature · Maya Patel', 4, 'lower_left', true),
		createField('field-32', 'doc-offer', 'rec-riley', 'signature', 'Signature · Riley Chen', 4, 'lower_right', true),
		createField('field-33', 'doc-offer', 'rec-riley', 'date_signed', 'Date signed · Riley Chen', 4, 'middle_right', true),
		createField('field-34', 'doc-nda', 'rec-riley', 'initials', 'Initials · Riley Chen', 2, 'upper_margin', true),
	];
	draft.events = [
		createEvent('Document version updated', 'Equity Plan Summary.pdf v3 attached for Finance review.', 'Finance workflow', 'warning', addMinutes(base, -82)),
		createEvent('Recipient order updated', 'Riley Chen signs before Maya Patel.', 'Mina Cook', 'neutral', addMinutes(base, -143)),
		createEvent('Envelope created', 'Three documents added from approved templates.', 'Mina Cook', 'neutral', addDays(base, -2)),
	];

	const sent = createEnvelope({
		id: 'env-vendor-112',
		name: 'Vendor services agreement',
		subject: 'Acme vendor agreement for signature',
		status: 'sent',
		revision: 4,
		createdAt: addDays(base, -5),
		sentAt: addDays(base, -3),
		providerEnvelopeId: 'provider-env-vendor-112',
		expiresAt: addDays(base, 11),
	});
	sent.documents = [createDocument('doc-vendor', 'Vendor Services Agreement.pdf', 'v7', 8, 'approved', 'Legal', 'sha256:67d4aa925120', {
		eyebrow: 'Acme Legal',
		title: 'Vendor services agreement',
		subtitle: 'Northstar Research Ltd · Statement of work 2026-14',
		paragraphs: ['Northstar Research Ltd will provide moderated customer research services described in statement of work 2026-14.', 'Fees are payable within 30 days of a valid invoice and acceptance of the relevant deliverable.'],
		terms: [{ label: 'Contract value', value: '£18,400' }, { label: 'Term', value: '12 months' }],
		note: 'The customer counter-signature is pending.',
	})];
	sent.recipients = [
		{ ...createRecipient('rec-ari', 'Ari Grant', 'ari@acme.test', 'legal_reviewer', 1, true, true, 'completed'), completedAt: addDays(base, -2), evidenceHash: checksum('env-vendor-112:rec-ari') },
		{ ...createRecipient('rec-samira', 'Samira Noor', 'samira@northstar.example', 'legal_reviewer', 2, true, true, 'pending'), invitedAt: addDays(base, -2) },
	];
	sent.fields = [
		createField('field-35', 'doc-vendor', 'rec-ari', 'signature', 'Signature · Ari Grant', 8, 'lower_left', true),
		createField('field-36', 'doc-vendor', 'rec-samira', 'signature', 'Signature · Samira Noor', 8, 'lower_right', true),
	];
	sent.events = [
		createEvent('Recipient signed', 'Ari Grant · identity verified.', 'Demo signing provider', 'success', addDays(base, -2)),
		createEvent('Envelope sent', 'Two recipients · signing order.', 'Mina Cook', 'success', addDays(base, -3)),
		createEvent('Envelope created', 'Vendor agreement v7 attached.', 'Mina Cook', 'neutral', addDays(base, -5)),
	];

	const completed = createEnvelope({
		id: 'env-policy-88',
		name: 'Policy acknowledgement',
		subject: 'Updated security policy acknowledgement',
		status: 'completed',
		revision: 5,
		createdAt: addDays(base, -18),
		sentAt: addDays(base, -15),
		completedAt: addDays(base, -14),
		providerEnvelopeId: 'provider-env-policy-88',
		expiresAt: addDays(base, -1),
	});
	completed.deliveryMode = 'parallel';
	completed.signingOrder = false;
	completed.documents = [createDocument('doc-policy', 'Security Policy.pdf', 'v5', 5, 'approved', 'Security', 'sha256:aa80b50a32f1', {
		eyebrow: 'Acme Security',
		title: 'Security policy acknowledgement',
		subtitle: 'Version 5 · effective 15 July 2026',
		paragraphs: ['This policy defines the minimum controls for company devices, customer information, authentication, and incident reporting.', 'By signing, the recipient confirms that they have read the policy and agree to follow the controls applicable to their work.'],
		terms: [{ label: 'Review cycle', value: 'Annual' }, { label: 'Owner', value: 'Security Operations' }],
		note: 'This envelope completed with identity and timestamp evidence.',
	})];
	completed.recipients = [
		{ ...createRecipient('rec-maya-policy', 'Maya Patel', 'maya@acme.test', 'hiring_manager', 1, true, true, 'completed'), completedAt: addDays(base, -14), evidenceHash: checksum('env-policy-88:rec-maya-policy') },
	];
	completed.fields = [createField('field-37', 'doc-policy', 'rec-maya-policy', 'signature', 'Signature · Maya Patel', 5, 'lower_right', true)];
	completed.events = [
		createEvent('Envelope completed', 'One required signature · certificate issued.', 'Demo signing provider', 'success', addDays(base, -14)),
		createEvent('Recipient signed', 'Maya Patel · identity verified.', 'Demo signing provider', 'success', addDays(base, -14)),
		createEvent('Envelope sent', 'One recipient · parallel signing.', 'Mina Cook', 'success', addDays(base, -15)),
	];
	completed.certificate = createCertificate(completed);

	return {
		id: 'workspace-acme-people',
		name: 'Acme People',
		actor: 'Mina Cook',
		envelopes: [draft, sent, completed],
	};
}

/**
 * Creates a base envelope with editable settings and empty relationships.
 *
 * @param {Record<string, unknown>} input Envelope seed values.
 * @returns {Record<string, unknown>} Envelope state.
 */
function createEnvelope(input) {
	return {
		id: input.id,
		name: input.name,
		subject: input.subject,
		message: 'Please review the attached documents and complete every required field before the signing window closes.',
		status: input.status,
		revision: input.revision,
		deliveryMode: 'sequential',
		reminderCadence: 'every_3_days',
		expiresInDays: 14,
		signingOrder: true,
		declineReasonRequired: true,
		createdAt: input.createdAt,
		updatedAt: input.createdAt,
		sentAt: input.sentAt || null,
		completedAt: input.completedAt || null,
		voidedAt: null,
		expiresAt: input.expiresAt || null,
		providerEnvelopeId: input.providerEnvelopeId || null,
		documents: [],
		recipients: [],
		fields: [],
		events: [],
		certificate: null,
	};
}

/**
 * Creates one versioned document with meaningful preview content.
 *
 * @param {string} id Document identifier.
 * @param {string} name Document filename.
 * @param {string} version Exact version label.
 * @param {number} pages Page count.
 * @param {string} status Approval status.
 * @param {string} owner Accountable team.
 * @param {string} checksumValue Audit-safe checksum.
 * @param {Record<string, unknown>} content Visible document content.
 * @returns {Record<string, unknown>} Document state.
 */
function createDocument(id, name, version, pages, status, owner, checksumValue, content) {
	return { id, name, version, pages, status, owner, checksum: checksumValue, approvedAt: status === 'approved' ? addDays(nowIso(), -3) : null, approvedBy: status === 'approved' ? owner : null, approvalReason: null, content };
}

/**
 * Creates one envelope recipient.
 *
 * @param {string} id Recipient identifier.
 * @param {string} name Recipient name.
 * @param {string} email Recipient email.
 * @param {string} role Recipient role value.
 * @param {number} order Signing order.
 * @param {boolean} required Whether completion is required.
 * @param {boolean} identityCheck Whether provider identity checks are required.
 * @param {string} status Recipient lifecycle status.
 * @returns {Record<string, unknown>} Recipient state.
 */
function createRecipient(id, name, email, role, order, required, identityCheck, status) {
	return { id, name, email, role, order, required, identityCheck, status, invitedAt: null, completedAt: null, lastReminderAt: null, evidenceHash: null };
}

/**
 * Creates one signing field from a supported position template.
 *
 * @param {string} id Field identifier.
 * @param {string} documentId Document identifier.
 * @param {string} recipientId Recipient identifier.
 * @param {string} type Field type.
 * @param {string} label Field label.
 * @param {number} page Page number.
 * @param {string} position Position template value.
 * @param {boolean} required Whether the field blocks completion.
 * @returns {Record<string, unknown>} Signing field state.
 */
function createField(id, documentId, recipientId, type, label, page, position, required) {
	const coordinates = positionOptions.find((option) => option.value === position) || positionOptions[0];
	return { id, documentId, recipientId, type, label, page, position, x: coordinates.x, y: coordinates.y, required };
}

/**
 * Creates an immutable audit event.
 *
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} actor Event actor.
 * @param {string} tone Semantic event tone.
 * @param {string} createdAt Event timestamp.
 * @returns {Record<string, unknown>} Audit event.
 */
function createEvent(title, detail, actor, tone, createdAt = nowIso()) {
	sequence.event += 1;
	return { id: `event-${sequence.event}`, title, detail, actor, tone, createdAt };
}

/**
 * Appends a new immutable audit event to an envelope.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} actor Event actor.
 * @param {string} tone Semantic event tone.
 * @returns {void}
 */
function appendEvent(envelope, title, detail, actor, tone) {
	envelope.events.unshift(createEvent(title, detail, actor, tone));
}

/**
 * Creates a provider-style mutation receipt.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @param {string} action Receipt action.
 * @param {Record<string, unknown>} details Receipt details.
 * @returns {Record<string, unknown>} Immutable receipt.
 */
function createReceipt(envelope, action, details = {}) {
	sequence.receipt += 1;
	return {
		id: `receipt-${sequence.receipt}`,
		action,
		envelopeId: envelope.id,
		revision: envelope.revision,
		createdAt: nowIso(),
		actor: action.includes('signed') ? 'Demo signing provider' : 'Mina Cook',
		...details,
	};
}

/**
 * Creates an immutable completion certificate from current evidence.
 *
 * @param {Record<string, unknown>} envelope Completed envelope state.
 * @returns {Record<string, unknown>} Completion certificate.
 */
function createCertificate(envelope) {
	const issuedAt = envelope.completedAt || nowIso();
	const recipients = envelope.recipients.filter((recipient) => recipient.required).map((recipient) => ({
		id: recipient.id,
		name: recipient.name,
		email: recipient.email,
		completedAt: recipient.completedAt,
		identity: recipient.identityCheck ? 'provider_verified' : 'email_confirmed',
		evidenceHash: recipient.evidenceHash,
	}));
	return {
		id: `certificate-${envelope.id}`,
		envelopeId: envelope.id,
		providerEnvelopeId: envelope.providerEnvelopeId,
		issuedAt,
		documentVersions: envelope.documents.map((document) => ({ id: document.id, name: document.name, version: document.version, checksum: document.checksum })),
		recipients,
		auditEventCount: envelope.events.length,
		certificateHash: checksum(`${envelope.id}:${issuedAt}:${recipients.map((recipient) => recipient.evidenceHash).join(':')}`),
	};
}

/**
 * Calculates authoritative readiness checks for one envelope.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @returns {Record<string, unknown>} Readiness score and checks.
 */
function calculatePreflight(envelope) {
	const requiredRecipients = envelope.recipients.filter((recipient) => recipient.required);
	const checks = [
		{
			key: 'recipient_identity',
			label: 'Required recipients have unique valid emails',
			done: requiredRecipients.length > 0 && requiredRecipients.every((recipient) => isEmail(recipient.email)) && new Set(requiredRecipients.map((recipient) => recipient.email.toLowerCase())).size === requiredRecipients.length,
			detail: 'Delivery and certificate evidence depend on an exact recipient identity.',
		},
		{
			key: 'signature_fields',
			label: 'Every required recipient has a signature field',
			done: requiredRecipients.every((recipient) => envelope.fields.some((field) => field.recipientId === recipient.id && field.type === 'signature' && field.required)),
			detail: 'Required recipients need at least one required signature field.',
		},
		{
			key: 'document_versions',
			label: 'Every attached document version is approved',
			done: envelope.documents.length > 0 && envelope.documents.every((document) => document.status === 'approved'),
			detail: 'The provider receives frozen checksums, so pending versions block sending.',
		},
		{
			key: 'recipient_message',
			label: 'Subject and recipient message are ready',
			done: envelope.subject.trim().length >= 8 && envelope.message.trim().length >= 24,
			detail: 'Clear delivery copy reduces suspicious or confusing signature requests.',
		},
		{
			key: 'decline_evidence',
			label: 'Declines require an auditable reason',
			done: envelope.declineReasonRequired,
			detail: 'Decline reasons help support teams understand failed completion.',
		},
	];
	const passed = checks.filter((check) => check.done).length;
	return { ready: passed === checks.length, score: Math.round((passed / checks.length) * 100), passed, total: checks.length, checks };
}

/**
 * Returns the workspace summary shown in the application header.
 *
 * @returns {Record<string, unknown>} Workspace summary.
 */
function serializeWorkspace() {
	return {
		id: workspace.id,
		name: workspace.name,
		actor: workspace.actor,
		envelopeCount: workspace.envelopes.length,
		draftCount: workspace.envelopes.filter((envelope) => envelope.status === 'draft').length,
		awaitingCount: workspace.envelopes.filter((envelope) => envelope.status === 'sent').length,
		completedCount: workspace.envelopes.filter((envelope) => envelope.status === 'completed').length,
	};
}

/**
 * Returns option records consumed by rich DOM Studio selection controls.
 *
 * @returns {Record<string, unknown>} Option catalog.
 */
function serializeOptions() {
	return {
		roles: cloneValue(roleOptions),
		deliveryModes: cloneValue(deliveryOptions),
		reminders: cloneValue(reminderOptions),
		expiries: cloneValue(expiryOptions),
		fieldTypes: cloneValue(fieldTypeOptions),
		positions: positionOptions.map(({ x, y, ...option }) => ({ ...option })),
		statuses: [
			{ value: 'all', label: 'All envelopes', description: 'Draft, awaiting, completed, and voided.' },
			{ value: 'draft', label: 'Draft', description: 'Still being prepared.' },
			{ value: 'sent', label: 'Awaiting signatures', description: 'Signing links are active.' },
			{ value: 'completed', label: 'Completed', description: 'Every required signer completed.' },
			{ value: 'voided', label: 'Voided', description: 'Signing links were invalidated.' },
		],
	};
}

/**
 * Returns compact envelope summaries for the navigation rail.
 *
 * @returns {Array<Record<string, unknown>>} Envelope summaries.
 */
function serializeEnvelopeList() {
	return workspace.envelopes.map((envelope) => serializeEnvelopeSummary(envelope));
}

/**
 * Serializes one compact envelope summary.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @returns {Record<string, unknown>} Envelope summary.
 */
function serializeEnvelopeSummary(envelope) {
	const requiredRecipients = envelope.recipients.filter((recipient) => recipient.required);
	const completedRecipients = requiredRecipients.filter((recipient) => recipient.status === 'completed');
	return {
		id: envelope.id,
		name: envelope.name,
		subject: envelope.subject,
		status: envelope.status,
		statusLabel: envelopeStatusLabel(envelope.status),
		statusTone: envelopeStatusTone(envelope.status),
		documentCount: envelope.documents.length,
		recipientCount: requiredRecipients.length,
		completedRecipientCount: completedRecipients.length,
		updatedAt: envelope.updatedAt,
		revision: envelope.revision,
	};
}

/**
 * Serializes the complete envelope view while cloning mutable relationships.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @returns {Record<string, unknown>} Complete envelope view.
 */
function serializeEnvelope(envelope) {
	return {
		...serializeEnvelopeSummary(envelope),
		message: envelope.message,
		deliveryMode: envelope.deliveryMode,
		deliveryModeLabel: labelFor(deliveryOptions, envelope.deliveryMode),
		reminderCadence: envelope.reminderCadence,
		reminderLabel: labelFor(reminderOptions, envelope.reminderCadence),
		expiresInDays: String(envelope.expiresInDays),
		signingOrder: envelope.signingOrder,
		declineReasonRequired: envelope.declineReasonRequired,
		createdAt: envelope.createdAt,
		sentAt: envelope.sentAt,
		completedAt: envelope.completedAt,
		voidedAt: envelope.voidedAt,
		expiresAt: envelope.expiresAt,
		providerEnvelopeId: envelope.providerEnvelopeId,
		documents: envelope.documents.map((document) => ({ ...cloneValue(document), statusLabel: document.status === 'approved' ? 'Approved' : 'Needs review', statusTone: document.status === 'approved' ? 'success' : 'warning' })),
		recipients: envelope.recipients.map((recipient) => ({ ...cloneValue(recipient), roleLabel: labelFor(roleOptions, recipient.role), statusLabel: recipientStatusLabel(recipient.status), statusTone: recipientStatusTone(recipient.status) })),
		fields: envelope.fields.map((field) => ({ ...cloneValue(field), typeLabel: labelFor(fieldTypeOptions, field.type) })),
		preflight: calculatePreflight(envelope),
		events: cloneValue(envelope.events),
		certificate: cloneValue(envelope.certificate),
	};
}

/**
 * Builds the common envelope response and selected relationship defaults.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @param {string | null} recipientId Preferred recipient identifier.
 * @param {string | null} documentId Preferred document identifier.
 * @returns {Record<string, unknown>} Envelope payload.
 */
function envelopePayload(envelope, recipientId = null, documentId = null) {
	const recipient = envelope.recipients.find((item) => item.id === recipientId) || envelope.recipients[0] || null;
	const document = envelope.documents.find((item) => item.id === documentId) || envelope.documents[0] || null;
	return {
		workspace: serializeWorkspace(),
		envelopes: serializeEnvelopeList(),
		envelope: serializeEnvelope(envelope),
		selectedRecipientId: recipient?.id || null,
		selectedDocumentId: document?.id || null,
	};
}

/**
 * Finds an envelope by canonical identifier.
 *
 * @param {string} envelopeId Envelope identifier.
 * @returns {Record<string, unknown> | null} Envelope state or null.
 */
function findEnvelope(envelopeId) {
	return workspace.envelopes.find((envelope) => envelope.id === envelopeId) || null;
}

/**
 * Returns a lifecycle conflict when the envelope is no longer editable.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireDraft(envelope) {
	if (envelope.status === 'draft') return null;
	return conflict('Only draft envelopes can change preparation details.', envelopePayload(envelope));
}

/**
 * Validates an exact optimistic revision.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @param {unknown} revision Requested revision.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function validateRevision(envelope, revision) {
	if (Number(revision) === envelope.revision) return null;
	return conflict('This envelope changed in another session. Reload the latest revision.', envelopePayload(envelope));
}

/**
 * Advances the envelope revision and update timestamp.
 *
 * @param {Record<string, unknown>} envelope Envelope state.
 * @returns {void}
 */
function advanceRevision(envelope) {
	envelope.revision += 1;
	envelope.updatedAt = nowIso();
}

/**
 * Returns a label for an option value.
 *
 * @param {Array<Record<string, unknown>>} options Option records.
 * @param {unknown} value Current value.
 * @returns {string} Human-readable label.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || String(value || 'Unknown');
}

/**
 * Returns a display label for an envelope lifecycle state.
 *
 * @param {string} status Envelope status.
 * @returns {string} Lifecycle label.
 */
function envelopeStatusLabel(status) {
	return { draft: 'Draft', sent: 'Awaiting signatures', completed: 'Completed', voided: 'Voided' }[status] || status;
}

/**
 * Returns a semantic tone for an envelope lifecycle state.
 *
 * @param {string} status Envelope status.
 * @returns {string} Semantic tone.
 */
function envelopeStatusTone(status) {
	return { draft: 'neutral', sent: 'warning', completed: 'success', voided: 'danger' }[status] || 'neutral';
}

/**
 * Returns a display label for a recipient lifecycle state.
 *
 * @param {string} status Recipient status.
 * @returns {string} Recipient status label.
 */
function recipientStatusLabel(status) {
	return { draft: 'Draft', queued: 'Waiting turn', pending: 'Awaiting', viewed: 'Viewed', completed: 'Signed', voided: 'Voided' }[status] || status;
}

/**
 * Returns a semantic tone for a recipient lifecycle state.
 *
 * @param {string} status Recipient status.
 * @returns {string} Semantic tone.
 */
function recipientStatusTone(status) {
	return { draft: 'neutral', queued: 'neutral', pending: 'warning', viewed: 'info', completed: 'success', voided: 'danger' }[status] || 'neutral';
}

/**
 * Returns one field-level validation record.
 *
 * @param {string} field Field name.
 * @param {string} message Validation message.
 * @returns {Record<string, string>} Field error.
 */
function fieldError(field, message) {
	return { field, message };
}

/**
 * Returns whether a string resembles a complete email address.
 *
 * @param {unknown} value Candidate value.
 * @returns {boolean} Whether the email is valid for the demo boundary.
 */
function isEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(String(value || ''));
}

/**
 * Returns a successful API payload.
 *
 * @param {string} message Human-readable success message.
 * @param {Record<string, unknown>} data Additional response data.
 * @returns {Record<string, unknown>} Success response.
 */
function success(message, data = {}) {
	return { message, ...data };
}

/**
 * Returns a validation response.
 *
 * @param {string} message Human-readable validation summary.
 * @param {Array<Record<string, string>>} fields Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields = []) {
	return { error: true, status: 422, code: 'validation_error', message, fields };
}

/**
 * Returns a recoverable conflict response.
 *
 * @param {string} message Human-readable conflict summary.
 * @param {Record<string, unknown>} data Latest safe state.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message, data = {}) {
	return { error: true, status: 409, code: 'conflict', message, ...data };
}

/**
 * Returns a missing-resource response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Missing-resource response.
 */
function notFound(resource) {
	return { error: true, status: 404, code: 'not_found', message: `${resource} was not found.` };
}

/**
 * Returns a deterministic audit checksum without exposing source material.
 *
 * @param {string} value Source value.
 * @returns {string} Audit checksum.
 */
function checksum(value) {
	let hash = 2166136261;
	for (const character of value) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return `sha256-demo:${(hash >>> 0).toString(16).padStart(8, '0')}${value.length.toString(16).padStart(8, '0')}`;
}

/**
 * Clones JSON-safe demo data before returning it to callers.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Cloned value.
 */
function cloneValue(value) {
	return value == null ? value : JSON.parse(JSON.stringify(value));
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
 * Adds minutes to an ISO timestamp.
 *
 * @param {string} value ISO timestamp.
 * @param {number} minutes Minute delta.
 * @returns {string} Shifted ISO timestamp.
 */
function addMinutes(value, minutes) {
	return new Date(new Date(value).getTime() + minutes * 60_000).toISOString();
}

/**
 * Adds days to an ISO timestamp.
 *
 * @param {string} value ISO timestamp.
 * @param {number} days Day delta.
 * @returns {string} Shifted ISO timestamp.
 */
function addDays(value, days) {
	return new Date(new Date(value).getTime() + days * 86_400_000).toISOString();
}
