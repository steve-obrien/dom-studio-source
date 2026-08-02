const policyPackOptions = [
	{ value: 'enterprise-security', label: 'Enterprise security playbook', description: 'Availability, incident notice, security controls, and customer commitments.' },
	{ value: 'vendor-paper', label: 'Vendor paper baseline', description: 'Balanced fallback positions for third-party terms.' },
	{ value: 'regulated-data', label: 'Regulated data playbook', description: 'Additional safeguards for regulated and sensitive customer data.' },
];

const jurisdictionOptions = [
	{ value: 'england-wales', label: 'England & Wales', description: 'Apply the UK commercial contracting baseline.' },
	{ value: 'new-york', label: 'New York', description: 'Apply the US enterprise contracting baseline.' },
	{ value: 'california', label: 'California', description: 'Apply the California privacy and commercial baseline.' },
];

const lifecycleOptions = [
	{ value: 'all', label: 'All reviews', description: 'In-review, ready, and released documents.' },
	{ value: 'review', label: 'In review', description: 'Findings or reviewer gates still need attention.' },
	{ value: 'ready', label: 'Ready', description: 'Every server release gate has passed.' },
	{ value: 'released', label: 'Released', description: 'The reviewed version and evidence are immutable.' },
];

const findingTypeOptions = [
	{ value: 'all', label: 'All findings', description: 'Risk, obligation, and clarity findings.' },
	{ value: 'risk', label: 'Risk', description: 'Language that may create unsupported exposure.' },
	{ value: 'obligation', label: 'Obligation', description: 'Commitments that need a clear owner or timing.' },
	{ value: 'clarity', label: 'Clarity', description: 'Wording that can be made easier to understand.' },
];

let sequence = {
	analysis: 530,
	event: 860,
	receipt: 470,
};

let workspace = createInitialWorkspace();

/**
 * Returns the contract-review workspace, filter options, document list, and default review.
 *
 * @returns {Record<string, unknown>} AI document review bootstrap payload.
 */
export function getAiDocumentReviewBootstrap() {
	const document = workspace.documents.find((item) => item.status === 'review') || workspace.documents[0];
	return {
		workspace: serializeWorkspace(),
		options: serializeOptions(),
		documents: serializeDocumentList(),
		defaultDocumentId: document.id,
		...documentPayload(document),
	};
}

/**
 * Returns one document with clauses, findings, reviewer gates, and release evidence.
 *
 * @param {string} documentId Document identifier.
 * @returns {Record<string, unknown>} Document response or missing-resource error.
 */
export function getAiDocumentReviewDocument(documentId) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	return documentPayload(document);
}

/**
 * Updates the review contract and invalidates analysis when policy inputs change.
 *
 * @param {string} documentId Document identifier.
 * @param {Record<string, unknown>} input Settings payload.
 * @returns {Record<string, unknown>} Updated document or structured error.
 */
export function updateAiDocumentReviewSettings(documentId, input = {}) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	const editable = requireEditable(document);
	if (editable) return editable;
	const revision = validateRevision(document, input.revision);
	if (revision) return revision;

	const title = String(input.title || '').trim();
	const counterparty = String(input.counterparty || '').trim();
	const policyPack = String(input.policyPack || '');
	const jurisdiction = String(input.jurisdiction || '');
	const fields = [];
	if (title.length < 8 || title.length > 110) fields.push(fieldError('title', 'Use 8 to 110 characters for the document title.'));
	if (counterparty.length < 2 || counterparty.length > 80) fields.push(fieldError('counterparty', 'Use 2 to 80 characters for the counterparty.'));
	if (!policyPackOptions.some((option) => option.value === policyPack)) fields.push(fieldError('policyPack', 'Choose a supported policy pack.'));
	if (!jurisdictionOptions.some((option) => option.value === jurisdiction)) fields.push(fieldError('jurisdiction', 'Choose a supported jurisdiction.'));
	if (fields.length) return validation('Review the document settings.', fields);

	const analysisInputsChanged = document.policyPack !== policyPack || document.jurisdiction !== jurisdiction;
	document.title = title;
	document.counterparty = counterparty;
	document.policyPack = policyPack;
	document.jurisdiction = jurisdiction;
	if (analysisInputsChanged) {
		document.sourceRevision += 1;
		document.analysisStatus = 'stale';
		document.status = 'review';
		document.reviewers.forEach((reviewer) => {
			if (reviewer.required) {
				reviewer.status = 'pending';
				reviewer.note = 'Waiting for refreshed AI analysis and human decisions.';
				reviewer.decidedAt = null;
			}
		});
	}
	advanceRevision(document);
	appendEvent(document, analysisInputsChanged ? 'Analysis inputs changed' : 'Review details saved', `${labelFor(policyPackOptions, policyPack)} · ${labelFor(jurisdictionOptions, jurisdiction)}`, workspace.actor, analysisInputsChanged ? 'warning' : 'neutral');
	return success(analysisInputsChanged ? 'Settings saved. Run a fresh analysis before release.' : 'Document settings saved.', documentPayload(document));
}

/**
 * Runs a deterministic server analysis against the current source and policy inputs.
 *
 * @param {string} documentId Document identifier.
 * @param {Record<string, unknown>} input Analysis acknowledgement and revision.
 * @returns {Record<string, unknown>} Refreshed findings and analysis receipt.
 */
export function runAiDocumentReviewAnalysis(documentId, input = {}) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	const editable = requireEditable(document);
	if (editable) return editable;
	const revision = validateRevision(document, input.revision);
	if (revision) return revision;
	if (input.acknowledged !== true) return validation('Confirm that this deterministic demo analysis may replace the current findings.', [fieldError('acknowledged', 'Confirm the analysis reset before continuing.')]);

	document.analysisStatus = 'complete';
	document.analysisId = `analysis-${++sequence.analysis}`;
	document.analysisRevision = document.sourceRevision;
	document.analysisCreatedAt = nowIso();
	document.findings = createFreshFindings(document.id);
	document.reviewers.forEach((reviewer) => {
		reviewer.status = reviewer.role === 'security' ? 'approved' : 'pending';
		reviewer.note = reviewer.role === 'security' ? 'Security playbook mapping confirmed.' : 'Waiting for human finding decisions.';
		reviewer.decidedAt = reviewer.role === 'security' ? nowIso() : null;
	});
	document.status = 'review';
	advanceRevision(document);
	appendEvent(document, 'AI analysis completed', `${document.findings.length} cited findings · ${labelFor(policyPackOptions, document.policyPack)}`, 'Review service', 'info');
	const receipt = createReceipt('analysis_completed', document, {
		analysisId: document.analysisId,
		model: document.analysisModel,
		promptVersion: document.promptVersion,
		sourceHash: document.sourceHash,
	});
	document.latestReceipt = receipt;
	return success('Fresh analysis completed.', { ...documentPayload(document), receipt });
}

/**
 * Records one explicit human finding decision and applies accepted replacement text.
 *
 * @param {string} documentId Document identifier.
 * @param {string} findingId Finding identifier.
 * @param {Record<string, unknown>} input Decision payload.
 * @returns {Record<string, unknown>} Updated review or structured error.
 */
export function decideAiDocumentReviewFinding(documentId, findingId, input = {}) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	const editable = requireEditable(document);
	if (editable) return editable;
	const revision = validateRevision(document, input.revision);
	if (revision) return revision;
	if (document.analysisStatus !== 'complete' || document.analysisRevision !== document.sourceRevision) return validation('Run a current analysis before deciding findings.', [fieldError('analysis', 'The policy inputs or source changed after this analysis.')]);

	const finding = document.findings.find((item) => item.id === findingId);
	if (!finding) return notFound('Finding');
	if (finding.state !== 'pending') return conflict('This finding already has a human decision.', documentPayload(document));
	const decision = String(input.decision || '');
	const note = String(input.note || '').trim();
	const fields = [];
	if (!['accepted', 'dismissed'].includes(decision)) fields.push(fieldError('decision', 'Choose accept or dismiss.'));
	if (note.length < 12 || note.length > 500) fields.push(fieldError('note', 'Add 12 to 500 characters of decision evidence.'));
	if (finding.severity === 'high' && decision === 'accepted' && input.acknowledgedHighRisk !== true) fields.push(fieldError('acknowledgedHighRisk', 'Confirm that a human reviewed the high-risk replacement.'));
	if (fields.length) return validation('Add complete human decision evidence.', fields);

	if (decision === 'accepted') {
		const section = document.sections.find((item) => item.id === finding.sectionId);
		if (!section || !section.body.includes(finding.source)) return conflict('The clause changed after this finding was generated.', documentPayload(document));
		section.body = section.body.replace(finding.source, finding.proposed);
		section.version += 1;
		section.updatedAt = nowIso();
	}
	finding.state = decision;
	finding.decisionNote = note;
	finding.decidedBy = workspace.actor;
	finding.decidedAt = nowIso();
	advanceRevision(document);
	finding.appliedRevision = decision === 'accepted' ? document.revision : null;
	appendEvent(document, decision === 'accepted' ? 'Finding accepted' : 'Finding dismissed', `${finding.label} · ${note}`, workspace.actor, decision === 'accepted' ? 'success' : 'neutral');
	updateDocumentStatus(document);
	return success(decision === 'accepted' ? 'Finding accepted and clause patched.' : 'Finding dismissed with evidence.', { ...documentPayload(document), selectedFindingId: finding.id });
}

/**
 * Records or reopens one reviewer gate at the current review revision.
 *
 * @param {string} documentId Document identifier.
 * @param {string} reviewerId Reviewer identifier.
 * @param {Record<string, unknown>} input Reviewer decision payload.
 * @returns {Record<string, unknown>} Updated review or structured error.
 */
export function decideAiDocumentReviewReviewer(documentId, reviewerId, input = {}) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	const editable = requireEditable(document);
	if (editable) return editable;
	const revision = validateRevision(document, input.revision);
	if (revision) return revision;
	const reviewer = document.reviewers.find((item) => item.id === reviewerId);
	if (!reviewer) return notFound('Reviewer');
	const decision = String(input.decision || '');
	const note = String(input.note || '').trim();
	const fields = [];
	if (!['approved', 'pending'].includes(decision)) fields.push(fieldError('decision', 'Choose approve or reopen.'));
	if (note.length < 12 || note.length > 500) fields.push(fieldError('note', 'Add 12 to 500 characters of reviewer evidence.'));
	if (decision === 'approved' && document.findings.some((finding) => finding.state === 'pending')) fields.push(fieldError('decision', 'Decide every AI finding before reviewer approval.'));
	if (decision === 'approved' && (document.analysisStatus !== 'complete' || document.analysisRevision !== document.sourceRevision)) fields.push(fieldError('decision', 'Run a current analysis before reviewer approval.'));
	if (fields.length) return validation('Reviewer approval is not ready.', fields);

	reviewer.status = decision;
	reviewer.note = note;
	reviewer.decidedAt = decision === 'approved' ? nowIso() : null;
	advanceRevision(document);
	appendEvent(document, decision === 'approved' ? 'Reviewer approved' : 'Reviewer reopened', `${reviewer.roleLabel} · ${note}`, reviewer.name, decision === 'approved' ? 'success' : 'warning');
	updateDocumentStatus(document);
	return success(decision === 'approved' ? 'Reviewer approval recorded.' : 'Reviewer gate reopened.', documentPayload(document));
}

/**
 * Recalculates authoritative release gates without changing the review revision.
 *
 * @param {string} documentId Document identifier.
 * @returns {Record<string, unknown>} Current document and server preflight result.
 */
export function runAiDocumentReviewPreflight(documentId) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	updateDocumentStatus(document);
	return success(document.status === 'ready' ? 'Every release gate passed.' : 'Release gates still need attention.', documentPayload(document));
}

/**
 * Releases the reviewed source revision and creates immutable decision evidence.
 *
 * @param {string} documentId Document identifier.
 * @param {Record<string, unknown>} input Release acknowledgement and revision.
 * @returns {Record<string, unknown>} Released document and evidence receipt.
 */
export function releaseAiDocumentReviewDocument(documentId, input = {}) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	const editable = requireEditable(document);
	if (editable) return editable;
	const revision = validateRevision(document, input.revision);
	if (revision) return revision;
	if (input.acknowledged !== true) return validation('Confirm the reviewed version before release.', [fieldError('acknowledged', 'Confirm the exact source, finding decisions, and reviewer approvals.')]);
	const preflight = calculatePreflight(document);
	if (!preflight.ready) return validation('The document is not ready to release.', preflight.checks.filter((check) => !check.done).map((check) => fieldError(check.key, check.detail)));

	document.status = 'released';
	document.releasedAt = nowIso();
	document.releasedBy = workspace.actor;
	advanceRevision(document);
	appendEvent(document, 'Reviewed version released', `Source v${document.sourceVersion} · ${document.findings.length} finding decisions`, workspace.actor, 'success');
	const receipt = createReceipt('document_released', document, {
		sourceVersion: document.sourceVersion,
		sourceHash: document.sourceHash,
		analysisId: document.analysisId,
		acceptedFindings: document.findings.filter((finding) => finding.state === 'accepted').length,
		dismissedFindings: document.findings.filter((finding) => finding.state === 'dismissed').length,
		reviewers: document.reviewers.filter((reviewer) => reviewer.required).map((reviewer) => reviewer.name),
	});
	document.releaseReceipt = receipt;
	document.latestReceipt = receipt;
	return success('Reviewed document released.', { ...documentPayload(document), receipt });
}

/**
 * Creates a deterministic redline export receipt for the current reviewed version.
 *
 * @param {string} documentId Document identifier.
 * @param {Record<string, unknown>} input Exact review revision.
 * @returns {Record<string, unknown>} Export evidence and document payload.
 */
export function exportAiDocumentReviewRedline(documentId, input = {}) {
	const document = findDocument(documentId);
	if (!document) return notFound('Document');
	const revision = validateRevision(document, input.revision);
	if (revision) return revision;
	if (!document.findings.some((finding) => finding.state !== 'pending')) return validation('Decide at least one finding before exporting a redline.', [fieldError('findings', 'The redline has no human decisions yet.')]);
	const receipt = createReceipt('redline_exported', document, {
		filename: `${document.id}-v${document.sourceVersion}-redline.docx`,
		acceptedFindings: document.findings.filter((finding) => finding.state === 'accepted').length,
		dismissedFindings: document.findings.filter((finding) => finding.state === 'dismissed').length,
		sourceHash: document.sourceHash,
	});
	document.latestReceipt = receipt;
	appendEvent(document, 'Redline exported', receipt.evidence.filename, workspace.actor, 'info');
	return success('Redline export receipt created.', { ...documentPayload(document), receipt });
}

/**
 * Restores the deterministic AI review workspace used by the block demo.
 *
 * @returns {Record<string, unknown>} Fresh bootstrap payload.
 */
export function resetAiDocumentReviewWorkspace() {
	sequence = { analysis: 530, event: 860, receipt: 470 };
	workspace = createInitialWorkspace();
	return { ...getAiDocumentReviewBootstrap(), message: 'AI document review reset to the seeded workspace.' };
}

/**
 * Creates the seeded legal-review workspace and three representative lifecycle states.
 *
 * @returns {Record<string, unknown>} Initial workspace record.
 */
function createInitialWorkspace() {
	const northstar = {
		id: 'document-northstar-security',
		title: 'Security and launch addendum',
		counterparty: 'Northstar Labs',
		status: 'review',
		policyPack: 'enterprise-security',
		jurisdiction: 'england-wales',
		revision: 8,
		sourceRevision: 12,
		sourceVersion: 12,
		sourceHash: 'sha256-demo:0000000048cf92d1',
		analysisStatus: 'complete',
		analysisId: 'analysis-524',
		analysisRevision: 12,
		analysisModel: 'review-model-2026-07',
		promptVersion: 'security-playbook-v7',
		analysisCreatedAt: isoMinutesAgo(42),
		uploadedAt: isoMinutesAgo(130),
		updatedAt: isoMinutesAgo(9),
		releasedAt: null,
		releasedBy: null,
		sections: [
			{ id: 'section-overview', number: '1', title: 'Service overview', eyebrow: 'Purpose', body: 'Northstar Labs will use the platform to coordinate onboarding, customer health, and renewal planning across implementation and success teams. This addendum defines the launch controls and operating commitments that sit beside the signed order form.', version: 3, updatedAt: isoMinutesAgo(110) },
			{ id: 'section-security', number: '2', title: 'Availability and safeguards', eyebrow: 'Security', body: 'Customer data is processed according to the agreed data protection terms. The vendor will take reasonable steps to protect the production environment. The vendor shall keep the production environment available and monitored.', version: 6, updatedAt: isoMinutesAgo(26) },
			{ id: 'section-incident', number: '3', title: 'Incident communication', eyebrow: 'Obligations', body: 'Priority incidents are reviewed by the response team. Critical incidents are communicated through the customer success owner after the response team confirms impact.', version: 2, updatedAt: isoMinutesAgo(24) },
			{ id: 'section-handoff', number: '4', title: 'Launch handoff', eyebrow: 'Delivery', body: 'The implementation team will confirm administrator training, billing setup, and first workflow activation before the account moves into the customer success operating cadence.', version: 4, updatedAt: isoMinutesAgo(71) },
		],
		findings: [
			{ id: 'finding-plain-language', sectionId: 'section-security', type: 'clarity', severity: 'low', confidence: 94, label: 'Commercially reasonable efforts', source: 'The vendor shall use commercially reasonable efforts to protect the production environment.', proposed: 'The vendor will take reasonable steps to protect the production environment.', rationale: 'Uses customer-facing language while preserving a reasonable-efforts standard.', citation: 'Enterprise security playbook §2.1', state: 'accepted', decisionNote: 'Clearer language with no material change to the protection standard.', decidedBy: 'Maya Chen', decidedAt: isoMinutesAgo(31), appliedRevision: 7 },
			{ id: 'finding-availability-sla', sectionId: 'section-security', type: 'risk', severity: 'high', confidence: 91, label: 'Unsupported availability promise', source: 'keep the production environment available and monitored', proposed: 'measure production availability against the service levels in the signed order form', rationale: 'Links availability wording to the negotiated SLA instead of creating an uncapped standalone promise.', citation: 'Enterprise security playbook §4.2', state: 'pending', decisionNote: '', decidedBy: null, decidedAt: null, appliedRevision: null },
			{ id: 'finding-incident-notice', sectionId: 'section-incident', type: 'obligation', severity: 'medium', confidence: 88, label: 'Incident notice owner and timing', source: 'Critical incidents are communicated through the customer success owner after the response team confirms impact.', proposed: 'Critical incidents are reported to the named security contact within the notice window in the data protection terms.', rationale: 'Names the recipient and ties timing to an existing contractual obligation.', citation: 'Enterprise security playbook §5.4', state: 'pending', decisionNote: '', decidedBy: null, decidedAt: null, appliedRevision: null },
			{ id: 'finding-data-location', sectionId: 'section-overview', type: 'risk', severity: 'medium', confidence: 79, label: 'Add hosting-region warranty', source: 'This addendum defines the launch controls', proposed: 'This addendum warrants that all customer data remains in the United Kingdom', rationale: 'A regional warranty may be useful for regulated buyers but is not supported by the signed order.', citation: 'Regulated data playbook §1.6', state: 'dismissed', decisionNote: 'The signed order does not include a UK-only hosting commitment.', decidedBy: 'Maya Chen', decidedAt: isoMinutesAgo(18), appliedRevision: null },
		],
		reviewers: [
			{ id: 'reviewer-security', name: 'Omar Reid', role: 'security', roleLabel: 'Security', required: true, status: 'approved', note: 'Security playbook mapping and control ownership confirmed.', decidedAt: isoMinutesAgo(34) },
			{ id: 'reviewer-legal', name: 'Leah Morgan', role: 'legal', roleLabel: 'Legal', required: true, status: 'pending', note: 'Waiting for availability and incident findings.', decidedAt: null },
		],
		events: [
			{ id: 'event-851', title: 'AI analysis completed', detail: '4 cited findings · enterprise security playbook.', actor: 'Review service', tone: 'info', createdAt: isoMinutesAgo(42) },
			{ id: 'event-852', title: 'Finding accepted', detail: 'Commercially reasonable efforts · clearer customer language.', actor: 'Maya Chen', tone: 'success', createdAt: isoMinutesAgo(31) },
			{ id: 'event-853', title: 'Finding dismissed', detail: 'Add hosting-region warranty · unsupported by the signed order.', actor: 'Maya Chen', tone: 'neutral', createdAt: isoMinutesAgo(18) },
		],
		latestReceipt: null,
		releaseReceipt: null,
	};

	const atlas = {
		...northstar,
		id: 'document-atlas-dpa',
		title: 'Data processing addendum',
		counterparty: 'Atlas Fieldwork',
		status: 'ready',
		policyPack: 'regulated-data',
		jurisdiction: 'new-york',
		revision: 14,
		sourceRevision: 9,
		sourceVersion: 9,
		sourceHash: 'sha256-demo:0000000084aa6be2',
		analysisId: 'analysis-518',
		analysisRevision: 9,
		analysisCreatedAt: isoMinutesAgo(220),
		updatedAt: isoMinutesAgo(65),
		sections: northstar.sections.map((section) => ({ ...section, body: section.body.replaceAll('Northstar', 'Atlas') })),
		findings: northstar.findings.map((finding) => ({ ...finding, state: finding.state === 'pending' ? 'accepted' : finding.state, decisionNote: finding.state === 'pending' ? 'Replacement matches the signed order and operating policy.' : finding.decisionNote, decidedBy: finding.decidedBy || 'Maya Chen', decidedAt: finding.decidedAt || isoMinutesAgo(80), appliedRevision: finding.state === 'pending' ? 13 : finding.appliedRevision })),
		reviewers: northstar.reviewers.map((reviewer) => ({ ...reviewer, status: 'approved', note: reviewer.role === 'legal' ? 'All AI findings and the New York baseline are approved.' : reviewer.note, decidedAt: reviewer.decidedAt || isoMinutesAgo(70) })),
		events: [{ id: 'event-854', title: 'Release gates passed', detail: 'Human decisions and required reviewers complete.', actor: 'Review service', tone: 'success', createdAt: isoMinutesAgo(65) }],
		latestReceipt: null,
		releaseReceipt: null,
	};
	applySeededAcceptedFindings(atlas);

	const harborRelease = {
		id: 'receipt-462',
		type: 'document_released',
		documentId: 'document-harbor-order',
		revision: 18,
		createdAt: isoMinutesAgo(1440),
		evidence: { sourceVersion: 7, sourceHash: 'sha256-demo:00000000c79b149f', analysisId: 'analysis-506', acceptedFindings: 2, dismissedFindings: 1, reviewers: ['Omar Reid', 'Leah Morgan'] },
	};
	const harbor = {
		...atlas,
		id: 'document-harbor-order',
		title: 'Enterprise order form',
		counterparty: 'Harbor Systems',
		status: 'released',
		policyPack: 'vendor-paper',
		jurisdiction: 'california',
		revision: 18,
		sourceRevision: 7,
		sourceVersion: 7,
		sourceHash: 'sha256-demo:00000000c79b149f',
		analysisId: 'analysis-506',
		analysisRevision: 7,
		analysisCreatedAt: isoMinutesAgo(1640),
		updatedAt: isoMinutesAgo(1440),
		releasedAt: isoMinutesAgo(1440),
		releasedBy: 'Maya Chen',
		sections: atlas.sections.map((section) => ({ ...section, body: section.body.replaceAll('Atlas', 'Harbor') })),
		events: [{ id: 'event-855', title: 'Reviewed version released', detail: 'Source v7 · 4 finding decisions.', actor: 'Maya Chen', tone: 'success', createdAt: isoMinutesAgo(1440) }],
		latestReceipt: harborRelease,
		releaseReceipt: harborRelease,
	};

	return {
		id: 'workspace-acme-legal',
		name: 'Acme Legal Ops',
		actor: 'Maya Chen',
		documents: [northstar, atlas, harbor],
	};
}

/**
 * Applies accepted finding replacements to a seeded document so its rendered
 * clauses agree with the decision history and readiness state shown in the UI.
 *
 * @param {object} document Seeded review document to normalize.
 * @returns {void}
 */
function applySeededAcceptedFindings(document) {
	for (const finding of document.findings) {
		if (finding.state !== 'accepted') continue;
		const section = document.sections.find((candidate) => candidate.id === finding.sectionId);
		if (!section?.body.includes(finding.source)) continue;
		section.body = section.body.replace(finding.source, finding.proposed);
	}
}

/**
 * Creates a fresh set of deterministic findings for a rerun analysis.
 *
 * @param {string} documentId Document identifier used for stable finding IDs.
 * @returns {Array<Record<string, unknown>>} Pending analysis findings.
 */
function createFreshFindings(documentId) {
	const suffix = documentId.split('-').slice(-1)[0];
	return [
		{ id: `finding-${suffix}-availability`, sectionId: 'section-security', type: 'risk', severity: 'high', confidence: 91, label: 'Unsupported availability promise', source: 'keep the production environment available and monitored', proposed: 'measure production availability against the service levels in the signed order form', rationale: 'Links availability wording to the negotiated SLA instead of creating a standalone promise.', citation: 'Enterprise security playbook §4.2', state: 'pending', decisionNote: '', decidedBy: null, decidedAt: null, appliedRevision: null },
		{ id: `finding-${suffix}-incident`, sectionId: 'section-incident', type: 'obligation', severity: 'medium', confidence: 88, label: 'Incident notice owner and timing', source: 'Critical incidents are communicated through the customer success owner after the response team confirms impact.', proposed: 'Critical incidents are reported to the named security contact within the notice window in the data protection terms.', rationale: 'Names the recipient and ties timing to an existing contractual obligation.', citation: 'Enterprise security playbook §5.4', state: 'pending', decisionNote: '', decidedBy: null, decidedAt: null, appliedRevision: null },
	];
}

/**
 * Returns workspace counts for the document rail and header.
 *
 * @returns {Record<string, unknown>} Serialized workspace summary.
 */
function serializeWorkspace() {
	return {
		id: workspace.id,
		name: workspace.name,
		actor: workspace.actor,
		documentCount: workspace.documents.length,
		inReviewCount: workspace.documents.filter((document) => document.status === 'review').length,
		readyCount: workspace.documents.filter((document) => document.status === 'ready').length,
		releasedCount: workspace.documents.filter((document) => document.status === 'released').length,
	};
}

/**
 * Returns rich select options used by the review workspace.
 *
 * @returns {Record<string, Array<Record<string, string>>>} Review option groups.
 */
function serializeOptions() {
	return {
		policyPacks: policyPackOptions,
		jurisdictions: jurisdictionOptions,
		lifecycles: lifecycleOptions,
		findingTypes: findingTypeOptions,
	};
}

/**
 * Serializes all documents for the compact queue rail.
 *
 * @returns {Array<Record<string, unknown>>} Document summaries.
 */
function serializeDocumentList() {
	return workspace.documents.map(serializeDocumentSummary);
}

/**
 * Serializes one document for list display.
 *
 * @param {Record<string, unknown>} document Document record.
 * @returns {Record<string, unknown>} List-safe document summary.
 */
function serializeDocumentSummary(document) {
	const status = statusMeta(document.status);
	const preflight = calculatePreflight(document);
	return {
		id: document.id,
		title: document.title,
		counterparty: document.counterparty,
		status: document.status,
		statusLabel: status.label,
		statusTone: status.tone,
		pendingCount: document.findings.filter((finding) => finding.state === 'pending').length,
		readinessScore: preflight.score,
		revision: document.revision,
		updatedAt: document.updatedAt,
	};
}

/**
 * Composes the common document payload returned by mutations and reads.
 *
 * @param {Record<string, unknown>} document Document record.
 * @param {Record<string, unknown>} selection Optional active item hints.
 * @returns {Record<string, unknown>} Complete review payload.
 */
function documentPayload(document, selection = {}) {
	const selectedFindingId = selection.findingId || document.findings.find((finding) => finding.state === 'pending')?.id || document.findings[0]?.id || '';
	const selectedFinding = document.findings.find((finding) => finding.id === selectedFindingId);
	return {
		workspace: serializeWorkspace(),
		documents: serializeDocumentList(),
		document: serializeDocument(document),
		selectedSectionId: selection.sectionId || selectedFinding?.sectionId || document.sections[0]?.id || '',
		selectedFindingId,
	};
}

/**
 * Serializes a document with UI labels, tones, counts, and current preflight data.
 *
 * @param {Record<string, unknown>} document Document record.
 * @returns {Record<string, unknown>} UI-ready document.
 */
function serializeDocument(document) {
	const status = statusMeta(document.status);
	return {
		...document,
		statusLabel: status.label,
		statusTone: status.tone,
		policyPackLabel: labelFor(policyPackOptions, document.policyPack),
		jurisdictionLabel: labelFor(jurisdictionOptions, document.jurisdiction),
		sections: document.sections.map((section) => ({ ...section, findingCount: document.findings.filter((finding) => finding.sectionId === section.id).length, pendingCount: document.findings.filter((finding) => finding.sectionId === section.id && finding.state === 'pending').length })),
		findings: document.findings.map(serializeFinding),
		reviewers: document.reviewers.map((reviewer) => ({ ...reviewer, statusLabel: reviewer.status === 'approved' ? 'Approved' : 'Pending', statusTone: reviewer.status === 'approved' ? 'success' : 'warning' })),
		events: [...document.events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
		preflight: calculatePreflight(document),
	};
}

/**
 * Adds labels and tones to one AI finding.
 *
 * @param {Record<string, unknown>} finding Finding record.
 * @returns {Record<string, unknown>} UI-ready finding.
 */
function serializeFinding(finding) {
	const severity = severityMeta(finding.severity);
	const state = findingStateMeta(finding.state);
	return {
		...finding,
		typeLabel: labelFor(findingTypeOptions, finding.type),
		severityLabel: severity.label,
		severityTone: severity.tone,
		stateLabel: state.label,
		stateTone: state.tone,
	};
}

/**
 * Calculates authoritative release checks for a document.
 *
 * @param {Record<string, unknown>} document Document record.
 * @returns {Record<string, unknown>} Release preflight result.
 */
function calculatePreflight(document) {
	const pendingCount = document.findings.filter((finding) => finding.state === 'pending').length;
	const openHighRiskCount = document.findings.filter((finding) => finding.severity === 'high' && finding.state === 'pending').length;
	const requiredReviewers = document.reviewers.filter((reviewer) => reviewer.required);
	const approvedReviewers = requiredReviewers.filter((reviewer) => reviewer.status === 'approved').length;
	const checks = [
		{ key: 'analysis', label: 'AI analysis completed', done: document.analysisStatus === 'complete', detail: document.analysisStatus === 'complete' ? `${document.analysisId} completed with cited findings.` : 'Run analysis for the selected policy inputs.' },
		{ key: 'source_revision', label: 'Analysis matches the source revision', done: document.analysisRevision === document.sourceRevision, detail: document.analysisRevision === document.sourceRevision ? `Analysis covers source revision ${document.sourceRevision}.` : `Source revision ${document.sourceRevision} changed after analysis.` },
		{ key: 'findings', label: 'Every AI finding has a human decision', done: pendingCount === 0, detail: `${pendingCount} pending ${pendingCount === 1 ? 'finding remains' : 'findings remain'}.` },
		{ key: 'high_risk', label: 'High-risk findings have explicit evidence', done: openHighRiskCount === 0, detail: `${openHighRiskCount} high-risk ${openHighRiskCount === 1 ? 'finding needs' : 'findings need'} a human decision.` },
		{ key: 'reviewers', label: 'Required reviewers approved', done: requiredReviewers.length > 0 && approvedReviewers === requiredReviewers.length, detail: `${approvedReviewers} of ${requiredReviewers.length} required approvals recorded.` },
		{ key: 'policy', label: 'Policy pack and jurisdiction are fixed', done: Boolean(document.policyPack && document.jurisdiction), detail: `${labelFor(policyPackOptions, document.policyPack)} · ${labelFor(jurisdictionOptions, document.jurisdiction)}.` },
	];
	const passed = checks.filter((check) => check.done).length;
	return { ready: checks.every((check) => check.done), score: Math.round((passed / checks.length) * 100), passed, total: checks.length, checks };
}

/**
 * Updates the lifecycle after a decision or reviewer mutation.
 *
 * @param {Record<string, unknown>} document Document record.
 * @returns {void}
 */
function updateDocumentStatus(document) {
	if (document.status === 'released') return;
	document.status = calculatePreflight(document).ready ? 'ready' : 'review';
}

/**
 * Finds one document by identifier.
 *
 * @param {string} documentId Document identifier.
 * @returns {Record<string, unknown> | null} Document record.
 */
function findDocument(documentId) {
	return workspace.documents.find((document) => document.id === documentId) || null;
}

/**
 * Requires a document to remain mutable before authoring or review changes.
 *
 * @param {Record<string, unknown>} document Document record.
 * @returns {Record<string, unknown> | null} Immutable-state error or null.
 */
function requireEditable(document) {
	if (document.status !== 'released') return null;
	return { error: true, status: 409, code: 'immutable', message: 'Released document evidence is immutable.', ...documentPayload(document) };
}

/**
 * Validates an optimistic review revision.
 *
 * @param {Record<string, unknown>} document Document record.
 * @param {unknown} revision Candidate revision.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function validateRevision(document, revision) {
	if (Number(revision) === document.revision) return null;
	return conflict(`The review changed from revision ${revision} to ${document.revision}.`, documentPayload(document));
}

/**
 * Advances the review revision and timestamp.
 *
 * @param {Record<string, unknown>} document Document record.
 * @returns {void}
 */
function advanceRevision(document) {
	document.revision += 1;
	document.updatedAt = nowIso();
}

/**
 * Adds an immutable-looking event to the demo review activity.
 *
 * @param {Record<string, unknown>} document Document record.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} actor Event actor.
 * @param {string} tone Event tone.
 * @returns {void}
 */
function appendEvent(document, title, detail, actor, tone) {
	document.events.push({ id: `event-${++sequence.event}`, title, detail, actor, tone, createdAt: nowIso() });
}

/**
 * Creates deterministic evidence for analysis, release, or export actions.
 *
 * @param {string} type Receipt type.
 * @param {Record<string, unknown>} document Document record.
 * @param {Record<string, unknown>} evidence Receipt evidence.
 * @returns {Record<string, unknown>} Evidence receipt.
 */
function createReceipt(type, document, evidence) {
	return { id: `receipt-${++sequence.receipt}`, type, documentId: document.id, revision: document.revision, createdAt: nowIso(), evidence };
}

/**
 * Resolves an option label while preserving unknown values for diagnostics.
 *
 * @param {Array<Record<string, string>>} options Options collection.
 * @param {string} value Selected value.
 * @returns {string} Option label.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Returns lifecycle presentation metadata.
 *
 * @param {string} status Document lifecycle.
 * @returns {{ label: string, tone: string }} Status metadata.
 */
function statusMeta(status) {
	return {
		review: { label: 'In review', tone: 'warning' },
		ready: { label: 'Ready to release', tone: 'info' },
		released: { label: 'Released', tone: 'success' },
	}[status] || { label: status, tone: 'neutral' };
}

/**
 * Returns severity presentation metadata.
 *
 * @param {string} severity Finding severity.
 * @returns {{ label: string, tone: string }} Severity metadata.
 */
function severityMeta(severity) {
	return {
		high: { label: 'High', tone: 'danger' },
		medium: { label: 'Medium', tone: 'warning' },
		low: { label: 'Low', tone: 'info' },
	}[severity] || { label: severity, tone: 'neutral' };
}

/**
 * Returns finding-decision presentation metadata.
 *
 * @param {string} state Finding state.
 * @returns {{ label: string, tone: string }} Finding state metadata.
 */
function findingStateMeta(state) {
	return {
		pending: { label: 'Pending', tone: 'warning' },
		accepted: { label: 'Accepted', tone: 'success' },
		dismissed: { label: 'Dismissed', tone: 'neutral' },
	}[state] || { label: state, tone: 'neutral' };
}

/**
 * Returns an ISO timestamp relative to now for deterministic seeded ordering.
 *
 * @param {number} minutes Minutes before the current time.
 * @returns {string} ISO timestamp.
 */
function isoMinutesAgo(minutes) {
	return new Date(Date.now() - minutes * 60_000).toISOString();
}

/**
 * Returns the current time as an ISO timestamp.
 *
 * @returns {string} Current ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Creates a field-level validation record.
 *
 * @param {string} field Field name.
 * @param {string} message Validation message.
 * @returns {{ field: string, message: string }} Field error.
 */
function fieldError(field, message) {
	return { field, message };
}

/**
 * Creates a successful API result.
 *
 * @param {string} message Success message.
 * @param {Record<string, unknown>} payload Response payload.
 * @returns {Record<string, unknown>} Success response.
 */
function success(message, payload = {}) {
	return { ...payload, message };
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Error summary.
 * @param {Array<{ field: string, message: string }>} fields Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { error: true, status: 422, code: 'validation_error', message, fields };
}

/**
 * Creates a structured conflict response.
 *
 * @param {string} message Conflict summary.
 * @param {Record<string, unknown>} payload Current document payload.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message, payload = {}) {
	return { error: true, status: 409, code: 'conflict', message, ...payload };
}

/**
 * Creates a missing-resource response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Missing-resource response.
 */
function notFound(resource) {
	return { error: true, status: 404, code: 'not_found', message: `${resource} was not found.` };
}
