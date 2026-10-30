import { saveCardDisputeIntake } from '../../../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Creates or updates a structured dispute intake at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Dispute intake response.
 */
export async function patch(req, res) {
	const result = saveCardDisputeIntake(req.params.transactionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
