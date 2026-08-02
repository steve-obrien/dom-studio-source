import { compareUsageReconciliationCase } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Compares immutable source usage with rated invoice usage.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = compareUsageReconciliationCase(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
