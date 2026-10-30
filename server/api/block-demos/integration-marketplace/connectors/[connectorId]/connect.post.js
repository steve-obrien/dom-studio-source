import { connectIntegrationConnector } from '../../../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Connects or repairs a provider using validated setup proof.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Connected provider or structured API error.
 */
export async function post(req, res) {
	const result = connectIntegrationConnector(req.params.connectorId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
