import { addModerationNote } from '../../../../../lib/blockDemos/contentModeration.js';

/**
 * Adds an internal note to an exact moderation case version.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated moderation workspace or API error.
 */
export async function post(req, res) {
	const result = addModerationNote(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
