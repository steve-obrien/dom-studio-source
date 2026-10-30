import { decideUsageReconciliationApproval } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Records a finance decision for one reconciliation approval.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = decideUsageReconciliationApproval(req.params.approvalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
