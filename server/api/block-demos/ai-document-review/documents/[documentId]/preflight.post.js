import { runAiDocumentReviewPreflight } from '../../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Recalculates authoritative document release gates.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Release preflight response.
 */
export async function post(req, res) {
	const result = runAiDocumentReviewPreflight(req.params.documentId);
	if (result.error) res.status(result.status || 400);
	return result;
}
