import { getIntegrationMarketplaceConnector } from '../../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Returns safe operational detail for one integration provider.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Provider detail or structured API error.
 */
export async function get(req, res) {
	const result = getIntegrationMarketplaceConnector(req.params.connectorId);
	if (result.error) res.status(result.status || 400);
	return result;
}
