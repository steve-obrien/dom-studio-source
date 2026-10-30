import { authorizeIntegrationConnector } from '../../../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Creates a short-lived provider authorization grant.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Authorization grant or structured API error.
 */
export async function post(req, res) {
	const result = authorizeIntegrationConnector(req.params.connectorId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
