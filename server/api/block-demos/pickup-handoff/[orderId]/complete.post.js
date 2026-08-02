import { completePickupHandoff } from '../../../../lib/blockDemos/pickupHandoff.js';

/**
 * Completes a pickup after every server-owned readiness check passes.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Final handoff proof or blocking checks.
 */
export async function post(req, res) {
	const result = completePickupHandoff(req.params.orderId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
