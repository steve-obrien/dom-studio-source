import { testIntegrationConnector } from '../../../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Runs a deterministic credential and required-scope test.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Test evidence or structured API error.
 */
export async function post(req, res) {
	const result = testIntegrationConnector(req.params.connectorId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
