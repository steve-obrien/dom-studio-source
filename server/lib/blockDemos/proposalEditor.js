const templateOptions = [
	{ value: 'implementation', label: 'Implementation proposal', description: 'Phased rollout, enablement, and commercial terms.' },
	{ value: 'consulting', label: 'Consulting engagement', description: 'Outcome-led advisory work with clear deliverables.' },
	{ value: 'renewal', label: 'Renewal plan', description: 'Value recap, next-year priorities, and subscription terms.' },
];

const currencyOptions = [
	{ value: 'GBP', label: 'GBP · British pound', description: 'Display proposal totals in pounds sterling.' },
	{ value: 'USD', label: 'USD · US dollar', description: 'Display proposal totals in US dollars.' },
	{ value: 'EUR', label: 'EUR · Euro', description: 'Display proposal totals in euros.' },
];

const sectionStatusOptions = [
	{ value: 'draft', label: 'Draft', description: 'Still being written and not ready for review.' },
	{ value: 'review', label: 'In review', description: 'Ready for internal feedback and approval.' },
	{ value: 'approved', label: 'Approved', description: 'Frozen for the next client delivery.' },
];

const lifecycleOptions = [
	{ value: 'all', label: 'All proposals', description: 'Draft, sent, and accepted work.' },
	{ value: 'draft', label: 'Draft', description: 'Proposals still being prepared.' },
	{ value: 'sent', label: 'Sent', description: 'Client delivery is active.' },
	{ value: 'accepted', label: 'Accepted', description: 'Client acceptance is recorded.' },
];

let sequence = {
	comment: 40,
	event: 700,
	item: 80,
	receipt: 930,
};

let workspace = createInitialWorkspace();

/**
 * Returns the proposal workspace, options, proposal list, and default proposal.
 *
 * @returns {Record<string, unknown>} Proposal editor bootstrap payload.
 */
export function getProposalEditorBootstrap() {
	const proposal = workspace.proposals.find((item) => item.status === 'draft') || workspace.proposals[0];
	return {
		workspace: serializeWorkspace(),
		options: serializeOptions(),
		proposals: serializeProposalList(),
		defaultProposalId: proposal.id,
		...proposalPayload(proposal),
	};
}

/**
 * Returns one proposal with authoring, review, commercial, and evidence data.
 *
 * @param {string} proposalId Proposal identifier.
 * @returns {Record<string, unknown>} Proposal response or missing-resource error.
 */
export function getProposalEditorProposal(proposalId) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	return proposalPayload(proposal);
}

/**
 * Updates a draft proposal delivery contract at an exact revision.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {Record<string, unknown>} input Proposal settings payload.
 * @returns {Record<string, unknown>} Updated proposal or validation error.
 */
export function updateProposalEditorSettings(proposalId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	const editable = requireDraft(proposal);
	if (editable) return editable;
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;

	const title = String(input.title || '').trim();
	const clientName = String(input.clientName || '').trim();
	const clientEmail = String(input.clientEmail || '').trim().toLowerCase();
	const template = String(input.template || '');
	const currency = String(input.currency || '');
	const validUntil = String(input.validUntil || '');
	const fields = [];
	if (title.length < 8 || title.length > 100) fields.push(fieldError('title', 'Use 8 to 100 characters for the proposal title.'));
	if (clientName.length < 2 || clientName.length > 80) fields.push(fieldError('clientName', 'Use 2 to 80 characters for the client name.'));
	if (!isEmail(clientEmail)) fields.push(fieldError('clientEmail', 'Enter a complete client email address.'));
	if (!templateOptions.some((option) => option.value === template)) fields.push(fieldError('template', 'Choose a supported proposal template.'));
	if (!currencyOptions.some((option) => option.value === currency)) fields.push(fieldError('currency', 'Choose a supported proposal currency.'));
	if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || new Date(`${validUntil}T23:59:59Z`).getTime() <= Date.now()) fields.push(fieldError('validUntil', 'Choose a future proposal expiry date.'));
	if (fields.length) return validation('Review the proposal delivery contract.', fields);

	proposal.title = title;
	proposal.clientName = clientName;
	proposal.clientEmail = clientEmail;
	proposal.template = template;
	proposal.currency = currency;
	proposal.validUntil = validUntil;
	advanceRevision(proposal);
	appendEvent(proposal, 'Delivery contract saved', `${clientName} · valid until ${validUntil}`, 'Maya Chen', 'neutral');
	return success('Proposal settings saved.', proposalPayload(proposal));
}

/**
 * Updates one proposal section with exact-revision conflict protection.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {string} sectionId Section identifier.
 * @param {Record<string, unknown>} input Section update payload.
 * @returns {Record<string, unknown>} Updated proposal or validation error.
 */
export function updateProposalEditorSection(proposalId, sectionId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	const editable = requireDraft(proposal);
	if (editable) return editable;
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	const section = proposal.sections.find((item) => item.id === sectionId);
	if (!section) return notFound('Proposal section');

	const title = String(input.title || '').trim();
	const body = String(input.body || '').trim();
	const status = String(input.status || '');
	const fields = [];
	if (title.length < 3 || title.length > 60) fields.push(fieldError('title', 'Use 3 to 60 characters for the section title.'));
	if (body.length < 60 || body.length > 1600) fields.push(fieldError('body', 'Use 60 to 1,600 characters for the section body.'));
	if (!sectionStatusOptions.some((option) => option.value === status)) fields.push(fieldError('status', 'Choose a supported section status.'));
	if (status === 'approved' && proposal.comments.some((comment) => comment.sectionId === section.id && comment.state === 'open')) {
		fields.push(fieldError('status', 'Resolve this section’s comments before approval.'));
	}
	if (fields.length) return validation('Review the proposal section.', fields);

	section.title = title;
	section.body = body;
	section.status = status;
	section.updatedAt = nowIso();
	advanceRevision(proposal);
	appendEvent(proposal, 'Section saved', `${section.title} · ${labelFor(sectionStatusOptions, status)}`, 'Maya Chen', status === 'approved' ? 'success' : 'neutral');
	return success('Proposal section saved.', proposalPayload(proposal, { sectionId: section.id }));
}

/**
 * Resolves an anchored proposal comment at an exact revision.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {string} commentId Comment identifier.
 * @param {Record<string, unknown>} input Resolution evidence.
 * @returns {Record<string, unknown>} Updated proposal or validation error.
 */
export function resolveProposalEditorComment(proposalId, commentId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	const editable = requireDraft(proposal);
	if (editable) return editable;
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	const comment = proposal.comments.find((item) => item.id === commentId);
	if (!comment) return notFound('Proposal comment');
	if (comment.state === 'resolved') return conflict('This comment is already resolved.', proposalPayload(proposal, { sectionId: comment.sectionId }));
	const resolution = String(input.resolution || '').trim();
	if (resolution.length < 8 || resolution.length > 240) return validation('Comment resolution needs evidence.', [fieldError('resolution', 'Record 8 to 240 characters explaining the resolution.')]);

	comment.state = 'resolved';
	comment.resolution = resolution;
	comment.resolvedAt = nowIso();
	comment.resolvedBy = 'Maya Chen';
	advanceRevision(proposal);
	appendEvent(proposal, 'Comment resolved', `${comment.anchorLabel} · ${resolution}`, 'Maya Chen', 'success');
	return success('Review comment resolved.', proposalPayload(proposal, { sectionId: comment.sectionId }));
}

/**
 * Records or revokes one reviewer decision at an exact revision.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {string} reviewerId Reviewer identifier.
 * @param {Record<string, unknown>} input Review decision payload.
 * @returns {Record<string, unknown>} Updated proposal or validation error.
 */
export function decideProposalEditorReviewer(proposalId, reviewerId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	const editable = requireDraft(proposal);
	if (editable) return editable;
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	const reviewer = proposal.reviewers.find((item) => item.id === reviewerId);
	if (!reviewer) return notFound('Proposal reviewer');
	const decision = String(input.decision || '');
	const note = String(input.note || '').trim();
	const fields = [];
	if (!['approved', 'pending'].includes(decision)) fields.push(fieldError('decision', 'Choose approve or return to pending.'));
	if (note.length < 8 || note.length > 240) fields.push(fieldError('note', 'Record 8 to 240 characters of reviewer evidence.'));
	if (fields.length) return validation('Reviewer decision needs evidence.', fields);

	reviewer.status = decision;
	reviewer.note = note;
	reviewer.decidedAt = decision === 'approved' ? nowIso() : null;
	advanceRevision(proposal);
	appendEvent(proposal, decision === 'approved' ? 'Reviewer approved' : 'Approval reopened', `${reviewer.roleLabel} · ${note}`, reviewer.name, decision === 'approved' ? 'success' : 'warning');
	return success(decision === 'approved' ? 'Reviewer approval recorded.' : 'Reviewer approval reopened.', proposalPayload(proposal));
}

/**
 * Adds one commercial line item to a draft proposal.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {Record<string, unknown>} input Pricing item payload.
 * @returns {Record<string, unknown>} Updated proposal or validation error.
 */
export function addProposalEditorPricingItem(proposalId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	const editable = requireDraft(proposal);
	if (editable) return editable;
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	const name = String(input.name || '').trim();
	const description = String(input.description || '').trim();
	const quantity = Number(input.quantity);
	const unitAmount = Number(input.unitAmount);
	const fields = [];
	if (name.length < 3 || name.length > 80) fields.push(fieldError('name', 'Use 3 to 80 characters for the line-item name.'));
	if (description.length < 8 || description.length > 180) fields.push(fieldError('description', 'Use 8 to 180 characters for the line-item description.'));
	if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) fields.push(fieldError('quantity', 'Use a quantity from 1 to 100.'));
	if (!Number.isInteger(unitAmount) || unitAmount < 100 || unitAmount > 1000000) fields.push(fieldError('unitAmount', 'Use a whole minor-unit amount from 100 to 1,000,000.'));
	if (fields.length) return validation('Review the commercial line item.', fields);

	sequence.item += 1;
	proposal.pricingItems.push({ id: `price-${sequence.item}`, name, description, quantity, unitAmount });
	advanceRevision(proposal);
	appendEvent(proposal, 'Commercial item added', `${name} · ${formatMoney(quantity * unitAmount, proposal.currency)}`, 'Maya Chen', 'neutral');
	return success('Commercial line item added.', proposalPayload(proposal));
}

/**
 * Removes one draft commercial line item at an exact revision.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {string} itemId Pricing item identifier.
 * @param {Record<string, unknown>} input Exact-revision payload.
 * @returns {Record<string, unknown>} Updated proposal or validation conflict.
 */
export function removeProposalEditorPricingItem(proposalId, itemId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	const editable = requireDraft(proposal);
	if (editable) return editable;
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	const itemIndex = proposal.pricingItems.findIndex((item) => item.id === itemId);
	if (itemIndex === -1) return notFound('Commercial line item');
	if (proposal.pricingItems.length <= 1) return conflict('Keep at least one commercial line item.', proposalPayload(proposal));
	const [item] = proposal.pricingItems.splice(itemIndex, 1);
	advanceRevision(proposal);
	appendEvent(proposal, 'Commercial item removed', item.name, 'Maya Chen', 'warning');
	return success('Commercial line item removed.', proposalPayload(proposal));
}

/**
 * Runs the authoritative send-readiness checks for one proposal.
 *
 * @param {string} proposalId Proposal identifier.
 * @returns {Record<string, unknown>} Proposal preflight result.
 */
export function runProposalEditorPreflight(proposalId) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	proposal.preflight = calculatePreflight(proposal);
	return success('Proposal preflight refreshed.', { preflight: proposal.preflight, revision: proposal.revision });
}

/**
 * Sends a ready proposal through the deterministic client-delivery boundary.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {Record<string, unknown>} input Send acknowledgement payload.
 * @returns {Record<string, unknown>} Sent proposal and delivery receipt.
 */
export function sendProposalEditorProposal(proposalId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	const editable = requireDraft(proposal);
	if (editable) return editable;
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	proposal.preflight = calculatePreflight(proposal);
	const fields = [];
	if (!proposal.preflight.ready) fields.push(fieldError('preflight', 'Resolve every server readiness check before sending.'));
	if (input.acknowledged !== true) fields.push(fieldError('acknowledged', 'Confirm the client, content, reviewers, and commercials.'));
	if (fields.length) return validation('Proposal delivery is blocked.', fields);

	sequence.receipt += 1;
	proposal.status = 'sent';
	proposal.sentAt = nowIso();
	proposal.deliveryId = `delivery-${proposal.id}-${sequence.receipt}`;
	proposal.clientUrl = `https://proposal.demo/${proposal.id}/${sequence.receipt}`;
	advanceRevision(proposal);
	const receipt = createReceipt('proposal_sent', proposal, { clientEmail: proposal.clientEmail, frozenRevision: proposal.revision });
	proposal.latestReceipt = receipt;
	appendEvent(proposal, 'Proposal sent', `${proposal.clientEmail} · ${formatMoney(totalAmount(proposal), proposal.currency)}`, 'Maya Chen', 'success');
	return success('Proposal sent to the client.', { ...proposalPayload(proposal), receipt });
}

/**
 * Records a deterministic client-view event for a sent proposal.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {Record<string, unknown>} input View acknowledgement payload.
 * @returns {Record<string, unknown>} Updated proposal and view receipt.
 */
export function recordProposalEditorClientView(proposalId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	if (proposal.status !== 'sent') return conflict('Only a sent proposal can record a client view.', proposalPayload(proposal));
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	if (input.acknowledged !== true) return validation('Client view simulation needs acknowledgement.', [fieldError('acknowledged', 'Confirm the deterministic client-view callback.')]);

	proposal.viewedAt = proposal.viewedAt || nowIso();
	proposal.viewCount += 1;
	advanceRevision(proposal);
	const receipt = createReceipt('proposal_viewed', proposal, { viewCount: proposal.viewCount, clientEmail: proposal.clientEmail });
	proposal.latestReceipt = receipt;
	appendEvent(proposal, 'Client viewed proposal', `${proposal.clientEmail} · view ${proposal.viewCount}`, 'Client delivery service', 'neutral');
	return success('Client view callback recorded.', { ...proposalPayload(proposal), receipt });
}

/**
 * Accepts a viewed proposal and creates immutable acceptance evidence.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {Record<string, unknown>} input Client acceptance payload.
 * @returns {Record<string, unknown>} Accepted proposal and acceptance receipt.
 */
export function acceptProposalEditorProposal(proposalId, input = {}) {
	const proposal = findProposal(proposalId);
	if (!proposal) return notFound('Proposal');
	if (proposal.status !== 'sent') return conflict('Only a sent proposal can be accepted.', proposalPayload(proposal));
	const revision = validateRevision(proposal, input.revision);
	if (revision) return revision;
	const signerName = String(input.signerName || '').trim();
	const fields = [];
	if (!proposal.viewedAt) fields.push(fieldError('viewedAt', 'Record a client view before acceptance.'));
	if (signerName.length < 3 || signerName.length > 80) fields.push(fieldError('signerName', 'Use 3 to 80 characters for the accepting client.'));
	if (input.acknowledged !== true) fields.push(fieldError('acknowledged', 'Confirm the deterministic client acceptance callback.'));
	if (fields.length) return validation('Proposal acceptance needs evidence.', fields);

	sequence.receipt += 1;
	proposal.status = 'accepted';
	proposal.acceptedAt = nowIso();
	proposal.acceptedBy = signerName;
	proposal.acceptanceId = `acceptance-${proposal.id}-${sequence.receipt}`;
	advanceRevision(proposal);
	const receipt = createReceipt('proposal_accepted', proposal, {
		acceptedBy: signerName,
		amount: totalAmount(proposal),
		currency: proposal.currency,
		evidenceHash: demoHash(`${proposal.id}:${proposal.revision}:${signerName}`),
	});
	proposal.latestReceipt = receipt;
	proposal.acceptanceReceipt = receipt;
	appendEvent(proposal, 'Proposal accepted', `${signerName} · ${formatMoney(totalAmount(proposal), proposal.currency)}`, 'Client delivery service', 'success');
	return success('Client acceptance recorded.', { ...proposalPayload(proposal), receipt });
}

/**
 * Restores the seeded proposal workspace.
 *
 * @returns {Record<string, unknown>} Reset workspace bootstrap payload.
 */
export function resetProposalEditorWorkspace() {
	sequence = { comment: 40, event: 700, item: 80, receipt: 930 };
	workspace = createInitialWorkspace();
	return { ...getProposalEditorBootstrap(), message: 'Proposal editor reset to the seeded workspace.' };
}

/**
 * Creates the deterministic proposal workspace used by the demo APIs.
 *
 * @returns {Record<string, unknown>} Initial proposal workspace.
 */
function createInitialWorkspace() {
	const now = Date.now();
	return {
		id: 'workspace-acme-revenue',
		name: 'Acme Revenue',
		actor: 'Maya Chen',
		proposals: [
			{
				id: 'proposal-northstar-2048',
				title: 'Northstar launch proposal',
				clientName: 'Northstar Labs',
				clientEmail: 'alex@northstar.test',
				status: 'draft',
				template: 'implementation',
				currency: 'GBP',
				validUntil: '2026-09-15',
				revision: 4,
				createdAt: new Date(now - 4 * 86400000).toISOString(),
				updatedAt: new Date(now - 18 * 60000).toISOString(),
				sentAt: null,
				viewedAt: null,
				acceptedAt: null,
				acceptedBy: null,
				acceptanceId: null,
				deliveryId: null,
				clientUrl: null,
				viewCount: 0,
				sections: [
					{ id: 'section-overview', title: 'Executive overview', eyebrow: 'Why now', status: 'approved', owner: 'Maya Chen', body: 'Northstar Labs is ready to bring onboarding, customer health, and renewal work into one operating rhythm. Acme will provide the implementation team, migration plan, and launch governance needed to move without disrupting the current customer-success cadence.', updatedAt: new Date(now - 2 * 86400000).toISOString() },
					{ id: 'section-outcomes', title: 'Outcomes', eyebrow: 'What changes', status: 'approved', owner: 'Nina Patel', body: 'Within six weeks, Northstar will have a configured workspace, a validated customer and renewal dataset, two live operating workflows, and a trained customer-success team. Weekly checkpoints keep decisions visible and tie every workstream to an accountable owner.', updatedAt: new Date(now - 86400000).toISOString() },
					{ id: 'section-delivery', title: 'Delivery plan', eyebrow: 'Six-week programme', status: 'review', owner: 'Omar Reid', body: 'Week one covers discovery and data mapping. Weeks two and three configure roles, lifecycle stages, and billing-event connections. Weeks four and five validate launch workflows and train the team. Week six closes with an executive handoff and a thirty-day success plan.', updatedAt: new Date(now - 42 * 60000).toISOString() },
					{ id: 'section-commercials', title: 'Commercial terms', eyebrow: 'Investment', status: 'approved', owner: 'Ari Patel', body: 'The engagement combines a fixed implementation fee, the first annual platform term, and an optional success workshop. Invoices are due within fourteen days. Work begins after written acceptance and confirmation of the named Northstar delivery lead.', updatedAt: new Date(now - 25 * 60000).toISOString() },
				],
				comments: [
					{ id: 'comment-31', sectionId: 'section-delivery', anchorLabel: 'Delivery plan · week three', author: 'Ari Patel', role: 'Finance', body: 'Clarify that analytics history is included in the migration validation, not an extra workstream.', state: 'open', resolution: null, createdAt: new Date(now - 36 * 60000).toISOString(), resolvedAt: null, resolvedBy: null },
					{ id: 'comment-32', sectionId: 'section-commercials', anchorLabel: 'Commercial terms · payment', author: 'Nina Patel', role: 'Success', body: 'Payment timing now matches the master services agreement.', state: 'resolved', resolution: 'Updated to fourteen-day terms from the signed MSA.', createdAt: new Date(now - 4 * 3600000).toISOString(), resolvedAt: new Date(now - 3 * 3600000).toISOString(), resolvedBy: 'Maya Chen' },
				],
				reviewers: [
					{ id: 'reviewer-pricing', name: 'Ari Patel', role: 'pricing', roleLabel: 'Pricing', status: 'approved', note: 'Fees and invoice timing match the opportunity.', decidedAt: new Date(now - 75 * 60000).toISOString() },
					{ id: 'reviewer-legal', name: 'Leah Morgan', role: 'legal', roleLabel: 'Legal', status: 'pending', note: 'Waiting for delivery wording to be final.', decidedAt: null },
					{ id: 'reviewer-brand', name: 'Nina Patel', role: 'brand', roleLabel: 'Brand', status: 'approved', note: 'Voice and client presentation are approved.', decidedAt: new Date(now - 2 * 3600000).toISOString() },
				],
				pricingItems: [
					{ id: 'price-71', name: 'Implementation programme', description: 'Six-week configuration, migration validation, workflows, and enablement.', quantity: 1, unitAmount: 1800000 },
					{ id: 'price-72', name: 'Growth platform', description: 'Annual platform subscription for the Northstar customer-success team.', quantity: 1, unitAmount: 1440000 },
					{ id: 'price-73', name: 'Executive success workshop', description: 'Optional post-launch operating review with leadership.', quantity: 1, unitAmount: 240000 },
				],
				events: [
					{ id: 'event-691', title: 'Delivery wording updated', detail: 'Six-week implementation sequence added.', actor: 'Omar Reid', tone: 'neutral', createdAt: new Date(now - 42 * 60000).toISOString() },
					{ id: 'event-692', title: 'Pricing approved', detail: '£34,800 commercial total confirmed.', actor: 'Ari Patel', tone: 'success', createdAt: new Date(now - 75 * 60000).toISOString() },
					{ id: 'event-693', title: 'Proposal created', detail: 'Created from the implementation proposal template.', actor: 'Maya Chen', tone: 'neutral', createdAt: new Date(now - 4 * 86400000).toISOString() },
				],
				latestReceipt: null,
				acceptanceReceipt: null,
			},
			{
				id: 'proposal-atlas-112',
				title: 'Atlas renewal plan', clientName: 'Atlas Fieldwork', clientEmail: 'sam@atlas.test', status: 'sent', template: 'renewal', currency: 'USD', validUntil: '2026-09-30', revision: 7,
				createdAt: new Date(now - 12 * 86400000).toISOString(), updatedAt: new Date(now - 2 * 86400000).toISOString(), sentAt: new Date(now - 2 * 86400000).toISOString(), viewedAt: new Date(now - 30 * 3600000).toISOString(), acceptedAt: null, acceptedBy: null, acceptanceId: null, deliveryId: 'delivery-proposal-atlas-112-902', clientUrl: 'https://proposal.demo/proposal-atlas-112/902', viewCount: 3,
				sections: [{ id: 'atlas-summary', title: 'Year in review', eyebrow: 'Value delivered', status: 'approved', owner: 'Maya Chen', body: 'Atlas consolidated renewal operations, reduced manual forecasting work, and established a weekly risk review. The renewal plan protects that operating rhythm while extending reporting access to regional leaders.', updatedAt: new Date(now - 3 * 86400000).toISOString() }],
				comments: [], reviewers: [{ id: 'atlas-pricing', name: 'Ari Patel', role: 'pricing', roleLabel: 'Pricing', status: 'approved', note: 'Renewal amount approved.', decidedAt: new Date(now - 3 * 86400000).toISOString() }], pricingItems: [{ id: 'atlas-price', name: 'Enterprise renewal', description: 'Twelve-month enterprise platform renewal.', quantity: 1, unitAmount: 7200000 }],
				events: [{ id: 'atlas-event', title: 'Client viewed proposal', detail: 'sam@atlas.test · view 3', actor: 'Client delivery service', tone: 'neutral', createdAt: new Date(now - 30 * 3600000).toISOString() }], latestReceipt: null, acceptanceReceipt: null,
			},
			{
				id: 'proposal-harbor-88',
				title: 'Harbor advisory engagement', clientName: 'Harbor Systems', clientEmail: 'kim@harbor.test', status: 'accepted', template: 'consulting', currency: 'EUR', validUntil: '2026-10-15', revision: 9,
				createdAt: new Date(now - 25 * 86400000).toISOString(), updatedAt: new Date(now - 6 * 86400000).toISOString(), sentAt: new Date(now - 9 * 86400000).toISOString(), viewedAt: new Date(now - 8 * 86400000).toISOString(), acceptedAt: new Date(now - 6 * 86400000).toISOString(), acceptedBy: 'Kim Moreau', acceptanceId: 'acceptance-proposal-harbor-88-884', deliveryId: 'delivery-proposal-harbor-88-879', clientUrl: 'https://proposal.demo/proposal-harbor-88/879', viewCount: 2,
				sections: [{ id: 'harbor-scope', title: 'Advisory scope', eyebrow: 'Engagement', status: 'approved', owner: 'Maya Chen', body: 'Harbor will receive an eight-week operating-model review, three leadership working sessions, and a practical ninety-day implementation plan with named owners and measurable outcomes.', updatedAt: new Date(now - 10 * 86400000).toISOString() }],
				comments: [], reviewers: [{ id: 'harbor-legal', name: 'Leah Morgan', role: 'legal', roleLabel: 'Legal', status: 'approved', note: 'Consulting terms approved.', decidedAt: new Date(now - 10 * 86400000).toISOString() }], pricingItems: [{ id: 'harbor-price', name: 'Advisory engagement', description: 'Eight-week operating-model review and implementation plan.', quantity: 1, unitAmount: 2800000 }],
				events: [{ id: 'harbor-event', title: 'Proposal accepted', detail: 'Kim Moreau · €28,000.00', actor: 'Client delivery service', tone: 'success', createdAt: new Date(now - 6 * 86400000).toISOString() }], latestReceipt: null,
				acceptanceReceipt: { id: 'receipt-884', type: 'proposal_accepted', proposalId: 'proposal-harbor-88', revision: 9, createdAt: new Date(now - 6 * 86400000).toISOString(), evidence: { acceptedBy: 'Kim Moreau', amount: 2800000, currency: 'EUR', evidenceHash: demoHash('proposal-harbor-88:Kim Moreau') } },
			},
		],
	};
}

/**
 * Returns the serialized workspace summary.
 *
 * @returns {Record<string, unknown>} Workspace counts.
 */
function serializeWorkspace() {
	return {
		id: workspace.id,
		name: workspace.name,
		actor: workspace.actor,
		proposalCount: workspace.proposals.length,
		draftCount: workspace.proposals.filter((proposal) => proposal.status === 'draft').length,
		sentCount: workspace.proposals.filter((proposal) => proposal.status === 'sent').length,
		acceptedCount: workspace.proposals.filter((proposal) => proposal.status === 'accepted').length,
	};
}

/**
 * Returns supported editor option groups.
 *
 * @returns {Record<string, unknown>} Proposal editor options.
 */
function serializeOptions() {
	return { templates: templateOptions, currencies: currencyOptions, sectionStatuses: sectionStatusOptions, lifecycles: lifecycleOptions };
}

/**
 * Returns compact proposal list records.
 *
 * @returns {Array<Record<string, unknown>>} Proposal list.
 */
function serializeProposalList() {
	return workspace.proposals.map(serializeProposalSummary);
}

/**
 * Serializes a proposal list item.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @returns {Record<string, unknown>} Proposal summary.
 */
function serializeProposalSummary(proposal) {
	return {
		id: proposal.id,
		title: proposal.title,
		clientName: proposal.clientName,
		status: proposal.status,
		statusLabel: statusMeta(proposal.status).label,
		statusTone: statusMeta(proposal.status).tone,
		amount: totalAmount(proposal),
		formattedAmount: formatMoney(totalAmount(proposal), proposal.currency),
		currency: proposal.currency,
		updatedAt: proposal.updatedAt,
		revision: proposal.revision,
		viewCount: proposal.viewCount,
	};
}

/**
 * Creates a complete API payload for one proposal.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @param {{ sectionId?: string }} selection Optional selected section.
 * @returns {Record<string, unknown>} Proposal payload.
 */
function proposalPayload(proposal, selection = {}) {
	proposal.preflight = calculatePreflight(proposal);
	return {
		workspace: serializeWorkspace(),
		proposals: serializeProposalList(),
		proposal: serializeProposal(proposal),
		selectedSectionId: selection.sectionId || proposal.sections[0]?.id || null,
	};
}

/**
 * Serializes one proposal with derived labels and commercial totals.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @returns {Record<string, unknown>} Serialized proposal.
 */
function serializeProposal(proposal) {
	const status = statusMeta(proposal.status);
	return {
		...proposal,
		statusLabel: status.label,
		statusTone: status.tone,
		templateLabel: labelFor(templateOptions, proposal.template),
		formattedTotal: formatMoney(totalAmount(proposal), proposal.currency),
		totalAmount: totalAmount(proposal),
		sections: proposal.sections.map((section) => ({ ...section, statusLabel: labelFor(sectionStatusOptions, section.status), statusTone: sectionStatusMeta(section.status).tone, wordCount: wordCount(section.body) })),
		comments: proposal.comments.map((comment) => ({ ...comment, statusLabel: comment.state === 'open' ? 'Open' : 'Resolved', statusTone: comment.state === 'open' ? 'warning' : 'success' })),
		reviewers: proposal.reviewers.map((reviewer) => ({ ...reviewer, statusLabel: reviewer.status === 'approved' ? 'Approved' : 'Pending', statusTone: reviewer.status === 'approved' ? 'success' : 'warning' })),
		pricingItems: proposal.pricingItems.map((item) => ({ ...item, lineTotal: item.quantity * item.unitAmount, formattedUnitAmount: formatMoney(item.unitAmount, proposal.currency), formattedLineTotal: formatMoney(item.quantity * item.unitAmount, proposal.currency) })),
		preflight: proposal.preflight,
		events: [...proposal.events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
	};
}

/**
 * Calculates authoritative delivery checks for a proposal.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @returns {Record<string, unknown>} Preflight result.
 */
function calculatePreflight(proposal) {
	const openCommentCount = proposal.comments.filter((comment) => comment.state === 'open').length;
	const checks = [
		{ key: 'client_contract', label: 'Client identity and delivery address are complete', done: proposal.clientName.length >= 2 && isEmail(proposal.clientEmail), detail: 'Delivery receipts need an exact client and email address.' },
		{ key: 'sections', label: 'Every proposal section is approved', done: proposal.sections.length > 0 && proposal.sections.every((section) => section.status === 'approved'), detail: `${proposal.sections.filter((section) => section.status === 'approved').length} of ${proposal.sections.length} sections approved.` },
		{ key: 'comments', label: 'Every review comment is resolved', done: openCommentCount === 0, detail: `${openCommentCount} open ${openCommentCount === 1 ? 'comment remains' : 'comments remain'}.` },
		{ key: 'reviewers', label: 'Every required reviewer approved', done: proposal.reviewers.length > 0 && proposal.reviewers.every((reviewer) => reviewer.status === 'approved'), detail: `${proposal.reviewers.filter((reviewer) => reviewer.status === 'approved').length} of ${proposal.reviewers.length} approvals recorded.` },
		{ key: 'commercials', label: 'Commercial total is valid', done: proposal.pricingItems.length > 0 && totalAmount(proposal) > 0, detail: `${proposal.pricingItems.length} items · ${formatMoney(totalAmount(proposal), proposal.currency)}.` },
		{ key: 'expiry', label: 'Client acceptance window is active', done: new Date(`${proposal.validUntil}T23:59:59Z`).getTime() > Date.now(), detail: `Valid until ${proposal.validUntil}.` },
	];
	const passed = checks.filter((check) => check.done).length;
	return { ready: checks.every((check) => check.done), score: Math.round((passed / checks.length) * 100), passed, total: checks.length, checks };
}

/**
 * Finds one proposal by identifier.
 *
 * @param {string} proposalId Proposal identifier.
 * @returns {Record<string, unknown> | null} Proposal record.
 */
function findProposal(proposalId) {
	return workspace.proposals.find((proposal) => proposal.id === proposalId) || null;
}

/**
 * Requires a proposal to remain in draft for authoring mutations.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @returns {Record<string, unknown> | null} Conflict response when immutable.
 */
function requireDraft(proposal) {
	if (proposal.status === 'draft') return null;
	return conflict('Sent and accepted proposals are immutable. Reset the demo to edit the seeded draft.', proposalPayload(proposal));
}

/**
 * Validates an optimistic proposal revision.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown> | null} Conflict response when stale.
 */
function validateRevision(proposal, revision) {
	if (Number(revision) === proposal.revision) return null;
	return conflict(`Proposal changed from revision ${revision ?? 'unknown'} to ${proposal.revision}. Reloaded the latest version.`, proposalPayload(proposal));
}

/**
 * Advances a proposal revision and updated timestamp.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @returns {void}
 */
function advanceRevision(proposal) {
	proposal.revision += 1;
	proposal.updatedAt = nowIso();
}

/**
 * Adds an immutable activity event to a proposal.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} actor Event actor.
 * @param {string} tone Event tone.
 * @returns {void}
 */
function appendEvent(proposal, title, detail, actor, tone) {
	sequence.event += 1;
	proposal.events.unshift({ id: `event-${sequence.event}`, title, detail, actor, tone, createdAt: nowIso() });
}

/**
 * Creates an immutable provider-style receipt.
 *
 * @param {string} type Receipt type.
 * @param {Record<string, unknown>} proposal Proposal record.
 * @param {Record<string, unknown>} evidence Receipt evidence.
 * @returns {Record<string, unknown>} Receipt record.
 */
function createReceipt(type, proposal, evidence) {
	sequence.receipt += 1;
	return { id: `receipt-${sequence.receipt}`, type, proposalId: proposal.id, revision: proposal.revision, createdAt: nowIso(), evidence };
}

/**
 * Calculates the total proposal amount in minor currency units.
 *
 * @param {Record<string, unknown>} proposal Proposal record.
 * @returns {number} Total minor units.
 */
function totalAmount(proposal) {
	return proposal.pricingItems.reduce((total, item) => total + item.quantity * item.unitAmount, 0);
}

/**
 * Formats minor currency units for display.
 *
 * @param {number} amount Minor-unit amount.
 * @param {string} currency ISO currency code.
 * @returns {string} Formatted currency value.
 */
function formatMoney(amount, currency) {
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount / 100);
}

/**
 * Returns a label from a value-label option list.
 *
 * @param {Array<Record<string, unknown>>} options Option records.
 * @param {string} value Selected value.
 * @returns {string} Option label.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Returns lifecycle presentation metadata.
 *
 * @param {string} status Proposal lifecycle status.
 * @returns {{ label: string, tone: string }} Status presentation.
 */
function statusMeta(status) {
	return {
		draft: { label: 'Draft', tone: 'neutral' },
		sent: { label: 'Awaiting client', tone: 'warning' },
		accepted: { label: 'Accepted', tone: 'success' },
	}[status] || { label: status, tone: 'neutral' };
}

/**
 * Returns section-status presentation metadata.
 *
 * @param {string} status Section status.
 * @returns {{ tone: string }} Section presentation.
 */
function sectionStatusMeta(status) {
	return { draft: { tone: 'neutral' }, review: { tone: 'warning' }, approved: { tone: 'success' } }[status] || { tone: 'neutral' };
}

/**
 * Counts words in a proposal section.
 *
 * @param {string} value Section body.
 * @returns {number} Word count.
 */
function wordCount(value) {
	return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validates a basic email shape for the demo contract.
 *
 * @param {string} value Candidate email address.
 * @returns {boolean} Whether the email is structurally valid.
 */
function isEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Creates a deterministic demo-only evidence hash.
 *
 * @param {string} value Source value.
 * @returns {string} Demo evidence hash.
 */
function demoHash(value) {
	let hash = 0;
	for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
	return `sha256-demo:${Math.abs(hash).toString(16).padStart(16, '0')}`;
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
 * Creates a standard validation field error.
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
 * @param {Record<string, unknown>} payload Current proposal payload.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message, payload = {}) {
	return { error: true, status: 409, code: 'conflict', message, ...payload };
}

/**
 * Creates a structured missing-resource response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Missing-resource response.
 */
function notFound(resource) {
	return { error: true, status: 404, code: 'not_found', message: `${resource} was not found.` };
}
