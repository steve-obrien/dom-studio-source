import { addProposalEditorPricingItem } from '../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Adds one commercial line item to a draft proposal.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Pricing creation response.
 */
export async function post(req, res) {
	const result = addProposalEditorPricingItem(req.params.proposalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
