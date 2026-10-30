import { createAuditExport } from '../../../lib/blockDemos/auditLogExplorer.js';

/**
 * Creates a compliance export job for the current server-side filters.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Export job proof or API error.
 */
export async function post(req, res) {
	const result = createAuditExport(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
