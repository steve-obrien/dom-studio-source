import { completeApiKeyRotation } from '../../../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Disables the previous credential after replacement traffic is confirmed.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Completed rotation or API error.
 */
export async function post(req, res) {
	const result = completeApiKeyRotation(req.params.keyId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
