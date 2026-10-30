import { getModerationCase } from '../../../../lib/blockDemos/contentModeration.js';

/**
 * Returns one complete moderation case lazily.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Case detail or API error.
 */
export async function get(req, res) {
	const result = getModerationCase(req.params.caseId);
	if (result.error) res.status(result.status || 400);
	return result;
}
