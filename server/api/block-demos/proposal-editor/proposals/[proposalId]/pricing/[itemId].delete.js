import { removeProposalEditorPricingItem } from '../../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Removes one commercial line item from a draft proposal.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Pricing removal response.
 */
export async function del(req, res) {
	const result = removeProposalEditorPricingItem(req.params.proposalId, req.params.itemId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
