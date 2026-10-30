import { saveLocalizationTranslation } from '../../../../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Saves one translated string and reruns server-owned quality checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated release or API error.
 */
export async function patch(req, res) {
	const result = saveLocalizationTranslation(req.params.releaseId, req.params.segmentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
