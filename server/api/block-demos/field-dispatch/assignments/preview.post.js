import { previewFieldDispatchAssignment } from '../../../../lib/blockDemos/fieldDispatch.js';

/**
 * Creates one exact server-owned dispatch assignment preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = previewFieldDispatchAssignment(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
