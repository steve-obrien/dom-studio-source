import { updateApiKeyPermissions } from '../../../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Validates and saves credential scopes and allowed origins.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated credential or API error.
 */
export async function patch(req, res) {
	const result = updateApiKeyPermissions(req.params.keyId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
