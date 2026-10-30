import { createSupportCenterMessage } from '../../../../../lib/blockDemos/supportCenter.js';

/**
 * Sends a customer reply or saves an internal teammate note.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated ticket workspace or API error.
 */
export async function post(req, res) {
	const result = createSupportCenterMessage(req.params.ticketId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
