import { createCardRevealChallenge } from '../../../../../lib/blockDemos/cardControlCenter.js';

/**
 * Starts step-up verification before revealing card details.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Reveal challenge response.
 */
export async function post(req, res) {
	const result = createCardRevealChallenge(req.params.cardId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
