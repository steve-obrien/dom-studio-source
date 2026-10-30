import { resolveLocalizationCheck } from '../../../../../../../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Resolves a reviewer-owned segment quality check.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated release or API error.
 */
export async function post(req, res) {
	const result = resolveLocalizationCheck(req.params.releaseId, req.params.segmentId, req.params.checkId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
