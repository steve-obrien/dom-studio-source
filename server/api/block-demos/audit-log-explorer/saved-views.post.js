import { createAuditSavedView } from '../../../lib/blockDemos/auditLogExplorer.js';

/**
 * Persists a named audit investigation view.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Created view or API error.
 */
export async function post(req, res) {
	const result = createAuditSavedView(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
