import { updateCampaignDraft } from '../../../../lib/blockDemos/campaignComposer.js';

/**
 * Validates and persists a complete campaign draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated campaign workspace or API error.
 */
export async function patch(req, res) {
	const result = updateCampaignDraft(req.params.campaignId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
