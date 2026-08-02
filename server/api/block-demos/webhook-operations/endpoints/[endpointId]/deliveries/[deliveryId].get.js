import { getWebhookDelivery } from '../../../../../../lib/blockDemos/webhookOperations.js';

/**
 * Returns complete immutable evidence for one delivery attempt.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Delivery evidence response.
 */
export async function get(req, res) {
	const result = getWebhookDelivery(req.params.endpointId, req.params.deliveryId);
	if (result.error) res.status(result.status || 400);
	return result;
}
