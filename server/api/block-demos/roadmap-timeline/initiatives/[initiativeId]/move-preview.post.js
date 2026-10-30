import { previewRoadmapMove } from '../../../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Previews dependency and capacity impact for one schedule change.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Immutable schedule preview or API error.
 */
export async function post(req, res) {
	const result = previewRoadmapMove(req.params.initiativeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
