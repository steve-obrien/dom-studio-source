import { exportAiDocumentReviewRedline } from '../../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Creates a deterministic redline export receipt.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Redline export response.
 */
export async function post(req, res) {
	const result = exportAiDocumentReviewRedline(req.params.documentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
