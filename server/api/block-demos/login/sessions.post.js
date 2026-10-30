import { beginPasswordLogin } from '../../../lib/blockDemos/loginGateway.js';

/**
 * Validate password credentials and begin second-factor verification.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Verification challenge or API error.
 */
export async function post(req, res) {
	const result = beginPasswordLogin(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
