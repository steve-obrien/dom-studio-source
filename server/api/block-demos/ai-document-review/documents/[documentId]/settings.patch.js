import { updateAiDocumentReviewSettings } from '../../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Updates document and policy settings at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Settings update response.
 */
export async function patch(req, res) {
	const result = updateAiDocumentReviewSettings(req.params.documentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
