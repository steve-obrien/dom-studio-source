import { declareIncidentResponseIncident } from '../../../lib/blockDemos/incidentResponse.js';

/**
 * Declares a new incident with command and alert evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = declareIncidentResponseIncident(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
