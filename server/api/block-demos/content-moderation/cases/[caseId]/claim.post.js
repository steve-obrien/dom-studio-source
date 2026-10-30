import { claimModerationCase } from '../../../../../lib/blockDemos/contentModeration.js';

/**
 * Claims one moderation case for the seeded reviewer.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated moderation workspace or API error.
 */
export async function post(req, res) {
	const result = claimModerationCase(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
