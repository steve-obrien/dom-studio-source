import { resetCampaign } from '../../../../lib/blockDemos/campaignComposer.js';

/**
 * Restores a campaign to its deterministic seeded demo state.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Restored campaign workspace or API error.
 */
export async function post(req, res) {
	const result = resetCampaign(req.params.campaignId);
	if (result.error) res.status(result.status || 400);
	return result;
}
