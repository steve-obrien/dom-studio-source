import { getLoginSession } from '../../../../lib/blockDemos/loginGateway.js';

/**
 * Return one current authenticated session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Current session or API error.
 */
export async function get(req, res) {
	const result = getLoginSession(req.params.sessionId);
	if (result.error) res.status(result.status || 400);
	return result;
}
