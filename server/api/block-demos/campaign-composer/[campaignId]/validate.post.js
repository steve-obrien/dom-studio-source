import { validateCampaign } from '../../../../lib/blockDemos/campaignComposer.js';

/**
 * Runs server-owned campaign audience, content, consent, and schedule checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Validation evidence or API error.
 */
export async function post(req, res) {
	const result = validateCampaign(req.params.campaignId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
