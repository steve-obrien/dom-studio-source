import { selectIncidentResponseIncident } from '../../../lib/blockDemos/incidentResponse.js';

/**
 * Selects one incident at an exact workspace revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = selectIncidentResponseIncident(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
