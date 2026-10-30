import { createRoadmapInitiative } from '../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Creates one validated portfolio initiative.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated roadmap workspace or API error.
 */
export async function post(req, res) {
	const result = createRoadmapInitiative(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
