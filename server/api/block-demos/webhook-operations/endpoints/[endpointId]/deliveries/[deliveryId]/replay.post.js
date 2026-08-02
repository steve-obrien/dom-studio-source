import { replayWebhookDelivery } from '../../../../../../../lib/blockDemos/webhookOperations.js';

/**
 * Replays a failed delivery into a new immutable attempt.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Delivery replay response.
 */
export async function post(req, res) {
	const result = replayWebhookDelivery(req.params.endpointId, req.params.deliveryId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
