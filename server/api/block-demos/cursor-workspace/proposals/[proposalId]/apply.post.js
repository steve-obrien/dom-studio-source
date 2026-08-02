import { applyCursorWorkspaceProposal } from '../../../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Applies a reviewed proposal with explicit acknowledgement.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Application receipt or API error.
 */
export async function post(req, res) {
	const result = applyCursorWorkspaceProposal(req.params.proposalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
