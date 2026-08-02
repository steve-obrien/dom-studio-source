import { decideAiDocumentReviewReviewer } from '../../../../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Records or reopens one required reviewer gate.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Reviewer decision response.
 */
export async function post(req, res) {
	const result = decideAiDocumentReviewReviewer(req.params.documentId, req.params.reviewerId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
