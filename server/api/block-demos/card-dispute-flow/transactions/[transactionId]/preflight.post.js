import { runCardDisputePreflight } from '../../../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Runs server-owned dispute eligibility and evidence checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Preflight response.
 */
export async function post(req, res) {
	const result = runCardDisputePreflight(req.params.transactionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
