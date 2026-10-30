import { removeCardDisputeEvidence } from '../../../../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Removes a typed evidence record from an editable draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Evidence removal response.
 */
export async function del(req, res) {
	const result = removeCardDisputeEvidence(req.params.transactionId, req.params.evidenceId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
