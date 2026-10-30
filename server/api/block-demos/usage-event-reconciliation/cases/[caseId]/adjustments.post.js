import { createUsageReconciliationAdjustment } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Creates an append-only usage or invoice adjustment proposal.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = createUsageReconciliationAdjustment(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
