import { enableWebhookEndpoint } from '../../../../../lib/blockDemos/webhookOperations.js';

/**
 * Re-enables an endpoint after explicit delivery-risk acknowledgement.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Endpoint enablement response.
 */
export async function post(req, res) {
	const result = enableWebhookEndpoint(req.params.endpointId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
