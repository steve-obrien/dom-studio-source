import { addCardDisputeEvidence } from '../../../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Adds a typed evidence record to an editable dispute draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Evidence mutation response.
 */
export async function post(req, res) {
	const result = addCardDisputeEvidence(req.params.transactionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
