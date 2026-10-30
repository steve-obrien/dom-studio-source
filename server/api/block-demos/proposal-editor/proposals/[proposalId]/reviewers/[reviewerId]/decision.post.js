import { decideProposalEditorReviewer } from '../../../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Records or reopens one proposal reviewer decision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Reviewer decision response.
 */
export async function post(req, res) {
	const result = decideProposalEditorReviewer(req.params.proposalId, req.params.reviewerId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
