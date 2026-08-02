import { verifyLoginChallenge } from '../../../../../lib/blockDemos/loginGateway.js';

/**
 * Verify a six-digit challenge and create an authenticated session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Authenticated session or API error.
 */
export async function post(req, res) {
	const result = verifyLoginChallenge(req.params.challengeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
