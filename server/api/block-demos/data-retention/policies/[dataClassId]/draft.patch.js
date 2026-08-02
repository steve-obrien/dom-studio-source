import { saveDataRetentionDraft } from '../../../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Saves an environment-specific retention policy draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Saved workspace or API error.
 */
export async function patch(req, res) {
	const result = saveDataRetentionDraft(req.params.dataClassId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
