import { replayUsageReconciliationEvent } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Retries one schema-error case through a corrected event payload.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = replayUsageReconciliationEvent(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
