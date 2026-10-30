import { requestLocalizationSuggestion } from '../../../../../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Returns a translation-memory suggestion without mutating saved copy.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Translation suggestion or provider error.
 */
export async function post(req, res) {
	const result = requestLocalizationSuggestion(req.params.releaseId, req.params.segmentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
