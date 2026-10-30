import { disableWebhookEndpoint } from '../../../../../lib/blockDemos/webhookOperations.js';

/**
 * Disables an endpoint after guarded operator confirmation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Endpoint disablement response.
 */
export async function post(req, res) {
	const result = disableWebhookEndpoint(req.params.endpointId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
