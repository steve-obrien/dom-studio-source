import { getCampaign } from '../../../lib/blockDemos/campaignComposer.js';

/**
 * Returns one complete campaign operations workspace.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Campaign workspace or API error.
 */
export async function get(req, res) {
	const result = getCampaign(req.params.campaignId);
	if (result.error) res.status(result.status || 400);
	return result;
}
