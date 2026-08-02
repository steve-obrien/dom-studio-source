import { transitionIncidentResponseStatus } from '../../../../../lib/blockDemos/incidentResponse.js';

/**
 * Moves an incident into monitoring or resolves it.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = transitionIncidentResponseStatus(req.params.incidentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
