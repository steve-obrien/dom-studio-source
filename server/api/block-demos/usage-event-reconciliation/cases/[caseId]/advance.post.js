import { advanceUsageReconciliationRelease } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Advances one provider correction through its rollout states.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = advanceUsageReconciliationRelease(req.params.caseId);
	if (result.error) res.status(result.status || 400);
	return result;
}
