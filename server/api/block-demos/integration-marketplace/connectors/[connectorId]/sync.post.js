import { syncIntegrationConnector } from '../../../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Runs a manual synchronisation for a healthy connection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Synchronisation evidence or structured API error.
 */
export async function post(req, res) {
	const result = syncIntegrationConnector(req.params.connectorId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
