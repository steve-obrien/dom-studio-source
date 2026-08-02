import { revokeApiKey } from '../../../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Permanently revokes a credential after confirmation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Revoked credential or API error.
 */
export async function post(req, res) {
	const result = revokeApiKey(req.params.keyId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
