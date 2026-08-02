import { saveCursorWorkspaceFile } from '../../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Saves one repository file with optimistic revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Saved file or API error.
 */
export async function patch(req, res) {
	const result = saveCursorWorkspaceFile(req.params.fileId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
