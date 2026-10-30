import { confirmCardRevealChallenge } from '../../../../../../lib/blockDemos/cardControlCenter.js';

/**
 * Confirms step-up verification and returns short-lived sensitive details.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Sensitive card detail response.
 */
export async function post(req, res) {
	const result = confirmCardRevealChallenge(req.params.cardId, req.params.challengeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
