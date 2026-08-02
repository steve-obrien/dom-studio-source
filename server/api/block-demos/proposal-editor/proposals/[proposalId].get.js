import { getProposalEditorProposal } from '../../../../lib/blockDemos/proposalEditor.js';

/**
 * Returns one proposal with content, review, commercials, and evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Proposal response.
 */
export async function get(req, res) {
	const result = getProposalEditorProposal(req.params.proposalId);
	if (result.error) res.status(result.status || 400);
	return result;
}
