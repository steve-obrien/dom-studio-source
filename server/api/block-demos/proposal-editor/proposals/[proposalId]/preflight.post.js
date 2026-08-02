import { runProposalEditorPreflight } from '../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Runs server-owned proposal readiness checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Proposal preflight response.
 */
export async function post(req, res) {
	const result = runProposalEditorPreflight(req.params.proposalId);
	if (result.error) res.status(result.status || 400);
	return result;
}
