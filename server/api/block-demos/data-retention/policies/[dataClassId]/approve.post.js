import { approveDataRetentionPolicy } from '../../../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Records Security approval for a saved retention draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Approved workspace or API error.
 */
export async function post(req, res) {
	const result = approveDataRetentionPolicy(req.params.dataClassId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
