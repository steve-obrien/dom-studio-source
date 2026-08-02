import { createAuditAlertRule } from '../../../lib/blockDemos/auditLogExplorer.js';

/**
 * Creates an audit alert rule for high-risk activity.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Alert rule proof or API error.
 */
export async function post(req, res) {
	const result = createAuditAlertRule(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
