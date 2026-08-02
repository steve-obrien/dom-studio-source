import { resolveProposalEditorComment } from '../../../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Resolves one anchored proposal comment with operator evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Comment resolution response.
 */
export async function post(req, res) {
	const result = resolveProposalEditorComment(req.params.proposalId, req.params.commentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
