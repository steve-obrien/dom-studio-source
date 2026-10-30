import { updateCursorWorkspaceSettings } from '../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Saves model and agent defaults.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated settings or API error.
 */
export async function patch(req, res) {
	const result = updateCursorWorkspaceSettings(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
