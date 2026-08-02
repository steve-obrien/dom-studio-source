import { publishIncidentUpdate } from '../../../../../../lib/blockDemos/incidentResponse.js';

/**
 * Publishes one exact incident communication preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = publishIncidentUpdate(req.params.incidentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
