import { requestUsageReconciliationApproval } from '../../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Requests finance approval for a material correction.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = requestUsageReconciliationApproval(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
