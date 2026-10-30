import { validateUsageReconciliationCase } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Runs authoritative reconciliation release checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = validateUsageReconciliationCase(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
