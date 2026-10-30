import { updateReturnDraft } from '../../../../lib/blockDemos/returnsPortal.js';

/**
 * Validates and persists the customer's complete return draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated return workflow or API error.
 */
export async function patch(req, res) {
	const result = updateReturnDraft(req.params.orderId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
