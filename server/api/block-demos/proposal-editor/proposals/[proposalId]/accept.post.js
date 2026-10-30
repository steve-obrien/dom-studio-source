import { acceptProposalEditorProposal } from '../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Records deterministic client acceptance and immutable evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Proposal acceptance response.
 */
export async function post(req, res) {
	const result = acceptProposalEditorProposal(req.params.proposalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
