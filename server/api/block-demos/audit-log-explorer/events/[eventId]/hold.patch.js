import { updateAuditEventHold } from '../../../../../lib/blockDemos/auditLogExplorer.js';

/**
 * Places or releases a legal hold on one audit event.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated evidence or API error.
 */
export async function patch(req, res) {
	const result = updateAuditEventHold(req.params.eventId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
