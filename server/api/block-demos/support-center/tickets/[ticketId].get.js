import { getSupportCenterTicket } from '../../../../lib/blockDemos/supportCenter.js';

/**
 * Returns one complete ticket conversation and customer record.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Ticket payload or API error.
 */
export async function get(req, res) {
	const result = getSupportCenterTicket(req.params.ticketId);
	if (result.error) res.status(result.status || 400);
	return result;
}
