import { getCardControlCard } from '../../../../lib/blockDemos/cardControlCenter.js';

/**
 * Returns one card with controls, activity, and evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Card detail response.
 */
export async function get(req, res) {
	const result = getCardControlCard(req.params.cardId);
	if (result.error) res.status(result.status || 400);
	return result;
}
