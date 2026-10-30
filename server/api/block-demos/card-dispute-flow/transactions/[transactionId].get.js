import { getCardDisputeTransaction } from '../../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Returns one transaction with claim, evidence, checks, and receipts.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Transaction detail response.
 */
export async function get(req, res) {
	const result = getCardDisputeTransaction(req.params.transactionId);
	if (result.error) res.status(result.status || 400);
	return result;
}
