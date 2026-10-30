import { beginPasswordlessLogin } from '../../../lib/blockDemos/loginGateway.js';

/**
 * Request a passwordless email sign-in challenge.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Passwordless challenge or API error.
 */
export async function post(req, res) {
	const result = beginPasswordlessLogin(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
