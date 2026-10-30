import { rotateApiKey } from '../../../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Creates a one-time replacement secret and overlap plan.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Rotation result or API error.
 */
export async function post(req, res) {
	const result = rotateApiKey(req.params.keyId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
