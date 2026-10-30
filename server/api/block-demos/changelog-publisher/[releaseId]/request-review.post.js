import { requestChangelogReview } from '../../../../lib/blockDemos/changelogPublisher.js';

/**
 * Runs server-owned readiness checks and sends a draft for review.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Review workflow or blocking checks.
 */
export async function post(req, res) {
	const result = requestChangelogReview(req.params.releaseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
