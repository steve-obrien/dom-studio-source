import { previewDataRetentionPolicy } from '../../../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Calculates a server-owned lifecycle impact preview for an unsaved policy.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Impact preview or API error.
 */
export async function post(req, res) {
	const result = previewDataRetentionPolicy({ ...req.body, dataClassId: req.params.dataClassId });
	if (result.error) res.status(result.status || 400);
	return result;
}
