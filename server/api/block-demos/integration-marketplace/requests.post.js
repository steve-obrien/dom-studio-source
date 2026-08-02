import { requestIntegrationConnector } from '../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Records a request for a provider outside the approved catalog.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Request receipt or structured API error.
 */
export async function post(req, res) {
	const result = requestIntegrationConnector(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
