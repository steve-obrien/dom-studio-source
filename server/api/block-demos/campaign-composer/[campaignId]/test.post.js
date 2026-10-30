import { sendCampaignTest } from '../../../../lib/blockDemos/campaignComposer.js';

/**
 * Sends a provider-style campaign test and returns immutable delivery evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Test receipt or API error.
 */
export async function post(req, res) {
	const result = sendCampaignTest(req.params.campaignId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
