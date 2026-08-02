import { createRoadmapUpdate } from '../../../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Posts one initiative health update with optional delivery evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated roadmap workspace or API error.
 */
export async function post(req, res) {
	const result = createRoadmapUpdate(req.params.initiativeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
