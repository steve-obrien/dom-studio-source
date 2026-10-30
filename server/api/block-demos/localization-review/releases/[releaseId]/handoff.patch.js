import { saveLocalizationHandoff } from '../../../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Saves reviewer notes and applied glossary terms for one locale.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated release or API error.
 */
export async function patch(req, res) {
	const result = saveLocalizationHandoff(req.params.releaseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
