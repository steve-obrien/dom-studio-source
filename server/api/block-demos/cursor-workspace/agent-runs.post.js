import { runCursorWorkspaceAgent } from '../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Creates a reviewable agent proposal from repository context.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Agent proposal or API error.
 */
export async function post(req, res) {
	const result = runCursorWorkspaceAgent(req.body || {});
	if (result.error) res.status(result.status || 400);
	else res.status(result.status || 201);
	return result;
}
