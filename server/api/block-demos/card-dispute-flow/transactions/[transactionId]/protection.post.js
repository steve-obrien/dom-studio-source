import { protectCardForDispute } from '../../../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Applies immediate card protection for a dispute.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Card protection response.
 */
export async function post(req, res) {
	const result = protectCardForDispute(req.params.transactionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
