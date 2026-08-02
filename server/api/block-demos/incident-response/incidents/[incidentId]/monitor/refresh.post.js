import { refreshIncidentMonitoring } from '../../../../../../lib/blockDemos/incidentResponse.js';

/**
 * Refreshes deterministic provider monitoring evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = refreshIncidentMonitoring(req.params.incidentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
