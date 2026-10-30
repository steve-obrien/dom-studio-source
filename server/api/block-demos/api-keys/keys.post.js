import { createApiKey } from '../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Creates a credential and returns its secret once.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} New credential, secret receipt, or API error.
 */
export async function post(req, res) {
	const result = createApiKey(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
