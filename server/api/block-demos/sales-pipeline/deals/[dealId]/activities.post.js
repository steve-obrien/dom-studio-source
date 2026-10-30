import { logSalesPipelineActivity } from '../../../../../lib/blockDemos/salesPipeline.js';

/**
 * Logs one acknowledged activity against an exact deal version.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated sales-pipeline payload.
 */
export async function post(req, res) {
	const result = logSalesPipelineActivity(req.params.dealId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
