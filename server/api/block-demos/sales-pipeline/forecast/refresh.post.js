import { refreshSalesPipelineForecast } from '../../../../lib/blockDemos/salesPipeline.js';

/**
 * Refreshes CRM and forecast evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated sales-pipeline payload.
 */
export async function post(req, res) {
	const result = refreshSalesPipelineForecast(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
