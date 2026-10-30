import { getCardControlBootstrap } from '../../../lib/blockDemos/cardControlCenter.js';

/**
 * Returns the card operations workspace and selected card.
 *
 * @param {import('express').Request} req HTTP request.
 * @returns {Promise<Record<string, unknown>>} Card operations bootstrap payload.
 */
export async function get(req) {
	return getCardControlBootstrap(req.query.cardId);
}
