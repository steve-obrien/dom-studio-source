import { updateIntegrationConnectorSettings } from '../../../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Persists connection ownership, schedule, region, and scopes.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated provider or structured API error.
 */
export async function patch(req, res) {
	const result = updateIntegrationConnectorSettings(req.params.connectorId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
