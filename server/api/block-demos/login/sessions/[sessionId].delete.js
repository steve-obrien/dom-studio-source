import { revokeLoginSession } from '../../../../lib/blockDemos/loginGateway.js';

/**
 * Revoke one current authenticated session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Sign-out confirmation or API error.
 */
async function del(req, res) {
	const result = revokeLoginSession(req.params.sessionId);
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
