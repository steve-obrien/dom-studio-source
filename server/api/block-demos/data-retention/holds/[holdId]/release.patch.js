import { releaseDataRetentionHold } from '../../../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Releases an active legal hold with revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Released hold or API error.
 */
export async function patch(req, res) {
	const result = releaseDataRetentionHold(req.params.holdId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
