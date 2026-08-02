import { queryAuditEvents } from '../../../lib/blockDemos/auditLogExplorer.js';

/**
 * Runs a server-side audit event investigation query.
 *
 * @param {import('express').Request} req HTTP request.
 * @returns {Promise<Record<string, unknown>>} Paginated audit event result.
 */
export async function post(req) {
	return queryAuditEvents(req.body || {});
}
