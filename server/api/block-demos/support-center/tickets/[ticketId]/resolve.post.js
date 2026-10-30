import { resolveSupportCenterTicket } from '../../../../../lib/blockDemos/supportCenter.js';

/**
 * Resolves a support ticket after authoritative workflow checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated ticket workspace or API error.
 */
export async function post(req, res) {
	const result = resolveSupportCenterTicket(req.params.ticketId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
