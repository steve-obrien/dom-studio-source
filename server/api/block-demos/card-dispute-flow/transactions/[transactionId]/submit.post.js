import { submitCardDispute } from '../../../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Submits a preflight-approved dispute at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Case submission response.
 */
export async function post(req, res) {
	const result = submitCardDispute(req.params.transactionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
