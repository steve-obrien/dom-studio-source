import { getApiKeyManagementKey } from '../../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Returns one safe credential detail without secret material.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Credential detail or API error.
 */
export async function get(req, res) {
	const result = getApiKeyManagementKey(req.params.keyId);
	if (result.error) res.status(result.status || 400);
	return result;
}
