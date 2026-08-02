import { reopenSupportCenterTicket } from '../../../../../lib/blockDemos/supportCenter.js';

/**
 * Reopens a completed support ticket for another customer follow-up.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated ticket workspace or API error.
 */
export async function post(req, res) {
	const result = reopenSupportCenterTicket(req.params.ticketId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
