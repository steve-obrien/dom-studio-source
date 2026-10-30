import { getAuditEvent } from '../../../../lib/blockDemos/auditLogExplorer.js';

/**
 * Returns full evidence for one audit event.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Audit event evidence or API error.
 */
export async function get(req, res) {
	const result = getAuditEvent(req.params.eventId);
	if (result.error) res.status(result.status || 400);
	return result;
}
