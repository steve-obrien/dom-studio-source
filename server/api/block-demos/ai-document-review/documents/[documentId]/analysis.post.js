import { runAiDocumentReviewAnalysis } from '../../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Runs deterministic AI analysis for the current source and policy inputs.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Analysis response.
 */
export async function post(req, res) {
	const result = runAiDocumentReviewAnalysis(req.params.documentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
