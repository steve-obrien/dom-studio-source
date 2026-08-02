import { previewIncidentUpdate } from '../../../../../../lib/blockDemos/incidentResponse.js';

/**
 * Creates an immutable incident communication preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = previewIncidentUpdate(req.params.incidentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
