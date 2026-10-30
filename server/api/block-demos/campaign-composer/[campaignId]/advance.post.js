import { advanceCampaignDelivery } from '../../../../lib/blockDemos/campaignComposer.js';

/**
 * Advances deterministic provider work so the complete send lifecycle can be demonstrated.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated delivery evidence or API error.
 */
export async function post(req, res) {
	const result = advanceCampaignDelivery(req.params.campaignId);
	if (result.error) res.status(result.status || 400);
	return result;
}
