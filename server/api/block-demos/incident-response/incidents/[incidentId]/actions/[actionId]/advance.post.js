import { advanceIncidentResponseAction } from '../../../../../../../lib/blockDemos/incidentResponse.js';

/**
 * Advances one response action to its next state.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = advanceIncidentResponseAction(req.params.incidentId, req.params.actionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
