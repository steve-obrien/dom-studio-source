import { updateWebhookEndpoint } from '../../../../lib/blockDemos/webhookOperations.js';

/**
 * Updates an endpoint delivery contract at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Endpoint update response.
 */
export async function patch(req, res) {
	const result = updateWebhookEndpoint(req.params.endpointId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
