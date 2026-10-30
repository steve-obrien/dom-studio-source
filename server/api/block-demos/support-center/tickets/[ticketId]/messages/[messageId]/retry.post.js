import { retrySupportCenterMessage } from '../../../../../../../lib/blockDemos/supportCenter.js';

/**
 * Retries one existing failed outbound provider delivery.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated ticket workspace or API error.
 */
export async function post(req, res) {
	const result = retrySupportCenterMessage(req.params.ticketId, req.params.messageId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
