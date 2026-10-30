import { handoffLoginSession } from '../../../../../lib/blockDemos/loginGateway.js';

/**
 * Select a workspace and produce an app-shell handoff receipt.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Workspace handoff or API error.
 */
export async function post(req, res) {
	const result = handoffLoginSession(req.params.sessionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
