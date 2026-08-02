import { getCursorWorkspaceFile } from '../../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Returns one editable repository file.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} File result or API error.
 */
export async function get(req, res) {
	const result = getCursorWorkspaceFile(req.params.fileId);
	if (result.error) res.status(result.status || 400);
	return result;
}
