import { resolveDeliveryException } from '../../../../../../lib/blockDemos/deliveryTracker.js';

/**
 * Resolves one customer-actionable delivery exception.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Resolved exception and refreshed delivery.
 */
export async function post(req, res) {
	const result = resolveDeliveryException(
		req.params.orderId,
		req.params.exceptionId,
		req.body || {},
	);
	if (result.error) res.status(result.status || 400);
	return result;
}
