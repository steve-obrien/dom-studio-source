import { commitRoadmapMove } from '../../../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Commits one exact and acknowledged initiative schedule preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated roadmap workspace or API error.
 */
export async function post(req, res) {
	const result = commitRoadmapMove(req.params.initiativeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
