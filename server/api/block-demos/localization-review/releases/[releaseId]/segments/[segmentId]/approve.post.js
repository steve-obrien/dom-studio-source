import { approveLocalizationSegment } from '../../../../../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Approves a translated string after server-owned checks pass.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated release or API error.
 */
export async function post(req, res) {
	const result = approveLocalizationSegment(req.params.releaseId, req.params.segmentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
