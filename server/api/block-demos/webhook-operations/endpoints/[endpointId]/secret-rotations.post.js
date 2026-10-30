import { rotateWebhookSecret } from '../../../../../lib/blockDemos/webhookOperations.js';

/**
 * Rotates endpoint signing material with a bounded overlap.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Secret rotation response.
 */
export async function post(req, res) {
	const result = rotateWebhookSecret(req.params.endpointId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
