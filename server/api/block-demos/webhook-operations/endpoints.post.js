import { createWebhookEndpoint } from '../../../lib/blockDemos/webhookOperations.js';

/**
 * Creates a webhook endpoint and returns one-time secret material.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Endpoint creation response.
 */
export async function post(req, res) {
	const result = createWebhookEndpoint(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
