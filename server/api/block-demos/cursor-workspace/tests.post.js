import { runCursorWorkspaceTests } from '../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Runs focused checks against the current repository revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Test evidence or API error.
 */
export async function post(req, res) {
	const result = runCursorWorkspaceTests(req.body || {});
	if (result.error) res.status(result.status || 400);
	else res.status(result.status || 201);
	return result;
}
