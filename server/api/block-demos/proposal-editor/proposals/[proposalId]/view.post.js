import { recordProposalEditorClientView } from '../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Records a deterministic client-view callback for a sent proposal.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Client-view response.
 */
export async function post(req, res) {
	const result = recordProposalEditorClientView(req.params.proposalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
