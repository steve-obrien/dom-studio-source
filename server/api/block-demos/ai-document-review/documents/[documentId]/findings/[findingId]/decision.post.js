import { decideAiDocumentReviewFinding } from '../../../../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Records one human finding decision and optional clause patch.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Finding decision response.
 */
export async function post(req, res) {
	const result = decideAiDocumentReviewFinding(req.params.documentId, req.params.findingId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
