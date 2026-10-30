import { submitReturnRequest } from '../../../../lib/blockDemos/returnsPortal.js';

/**
 * Creates an approved return request after server-owned checks pass.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Return receipt or blocking checks.
 */
export async function post(req, res) {
	const result = submitReturnRequest(req.params.orderId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
