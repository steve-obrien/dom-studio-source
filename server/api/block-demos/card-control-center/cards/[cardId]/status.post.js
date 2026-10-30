import { updateCardControlStatus } from '../../../../../lib/blockDemos/cardControlCenter.js';

/**
 * Freezes or unfreezes a card with an auditable reason.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Card status response.
 */
export async function post(req, res) {
	const result = updateCardControlStatus(req.params.cardId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
