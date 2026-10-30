import { sendWebhookTest } from '../../../../../lib/blockDemos/webhookOperations.js';

/**
 * Sends a synthetic event through the endpoint contract.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Test delivery response.
 */
export async function post(req, res) {
	const result = sendWebhookTest(req.params.endpointId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
