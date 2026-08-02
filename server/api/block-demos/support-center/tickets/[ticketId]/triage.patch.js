import { updateSupportCenterTriage } from '../../../../../lib/blockDemos/supportCenter.js';

/**
 * Updates exact-revision assignment and priority values.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated ticket workspace or API error.
 */
export async function patch(req, res) {
	const result = updateSupportCenterTriage(req.params.ticketId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
