import { disconnectIntegrationConnector } from '../../../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Disconnects a provider after explicit operator confirmation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Disconnection receipt or structured API error.
 */
export async function post(req, res) {
	const result = disconnectIntegrationConnector(req.params.connectorId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
