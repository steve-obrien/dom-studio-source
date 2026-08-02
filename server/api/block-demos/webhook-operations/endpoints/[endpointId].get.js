import { getWebhookEndpoint } from '../../../../lib/blockDemos/webhookOperations.js';

/**
 * Returns safe endpoint configuration and delivery evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Endpoint detail response.
 */
export async function get(req, res) {
	const result = getWebhookEndpoint(req.params.endpointId);
	if (result.error) res.status(result.status || 400);
	return result;
}
