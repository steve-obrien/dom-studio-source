import { getReturnOrder } from '../../../lib/blockDemos/returnsPortal.js';

/**
 * Returns one customer-visible return workflow.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Return order payload or API error.
 */
export async function get(req, res) {
	const result = getReturnOrder(req.params.orderId);
	if (result.error) res.status(result.status || 400);
	return result;
}
