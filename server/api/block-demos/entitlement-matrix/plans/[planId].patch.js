import { updatePlanDraft } from '../../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Saves commercial fields for one plan draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function patch(req, res) {
	const result = updatePlanDraft(req.params.planId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
