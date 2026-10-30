import { getCursorWorkspaceProposal } from '../../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Returns one immutable agent proposal.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Proposal result or API error.
 */
export async function get(req, res) {
	const result = getCursorWorkspaceProposal(req.params.proposalId);
	if (result.error) res.status(result.status || 400);
	return result;
}
