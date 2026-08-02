import { createCardTravelNotice } from '../../../../../lib/blockDemos/cardControlCenter.js';

/**
 * Creates a dated travel notice for a card.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Travel notice response.
 */
export async function post(req, res) {
	const result = createCardTravelNotice(req.params.cardId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
