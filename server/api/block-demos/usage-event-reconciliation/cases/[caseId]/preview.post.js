import { previewUsageReconciliationInvoice } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Generates a revised invoice preview for one current correction.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = previewUsageReconciliationInvoice(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
