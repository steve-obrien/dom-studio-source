import { claimUsageReconciliationCase } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Assigns one reconciliation case to the current billing operator.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = claimUsageReconciliationCase(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
