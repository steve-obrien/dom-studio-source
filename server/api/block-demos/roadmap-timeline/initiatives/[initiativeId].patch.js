import { updateRoadmapInitiative } from '../../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Updates one initiative at exact workspace and record revisions.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated roadmap workspace or API error.
 */
export async function patch(req, res) {
	const result = updateRoadmapInitiative(req.params.initiativeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
