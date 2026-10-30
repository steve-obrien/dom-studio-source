import { launchCampaign } from '../../../../lib/blockDemos/campaignComposer.js';

/**
 * Schedules or starts an acknowledged campaign delivery.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Launch receipt or API error.
 */
export async function post(req, res) {
	const result = launchCampaign(req.params.campaignId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
