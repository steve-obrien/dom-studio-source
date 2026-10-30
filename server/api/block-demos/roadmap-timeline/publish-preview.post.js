import { previewRoadmapPublication } from '../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Creates an immutable audience-specific roadmap publication preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Roadmap publication preview or API error.
 */
export async function post(req, res) {
	const result = previewRoadmapPublication(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
