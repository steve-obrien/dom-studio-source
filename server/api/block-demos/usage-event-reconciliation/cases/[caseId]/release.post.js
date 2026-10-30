import { releaseUsageReconciliationCase } from '../../../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Publishes one checked correction to the provider rollout worker.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = releaseUsageReconciliationCase(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
