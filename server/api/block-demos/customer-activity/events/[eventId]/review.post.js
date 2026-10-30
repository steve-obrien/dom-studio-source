import { reviewCustomerActivityEvent } from '../../../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Marks one exact customer activity event as reviewed.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = reviewCustomerActivityEvent(req.params.eventId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
