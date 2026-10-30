import { getAiDocumentReviewDocument } from '../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Returns one contract review with findings and evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Document review response.
 */
export async function get(req, res) {
	const result = getAiDocumentReviewDocument(req.params.documentId);
	if (result.error) res.status(result.status || 400);
	return result;
}
