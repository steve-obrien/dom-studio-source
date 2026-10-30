import { updateCardControlPolicy } from '../../../../../lib/blockDemos/cardControlCenter.js';

/**
 * Updates spend and authorization policy at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Policy update response.
 */
export async function patch(req, res) {
	const result = updateCardControlPolicy(req.params.cardId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
