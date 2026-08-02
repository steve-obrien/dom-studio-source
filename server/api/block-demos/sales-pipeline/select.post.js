import { selectSalesPipelineDeal } from '../../../lib/blockDemos/salesPipeline.js';

/**
 * Selects one exact deal.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated sales-pipeline payload.
 */
export async function post(req, res) {
	const result = selectSalesPipelineDeal(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
