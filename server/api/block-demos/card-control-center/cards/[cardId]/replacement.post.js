import { replaceCardControlCard } from '../../../../../lib/blockDemos/cardControlCenter.js';

/**
 * Orders a replacement card and records lifecycle evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Replacement order response.
 */
export async function post(req, res) {
	const result = replaceCardControlCard(req.params.cardId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
