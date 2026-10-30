import { sendProposalEditorProposal } from '../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Sends a ready proposal through the deterministic client-delivery boundary.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Proposal send response.
 */
export async function post(req, res) {
	const result = sendProposalEditorProposal(req.params.proposalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
